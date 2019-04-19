package common

import (
	"encoding/json"
	"strings"

	"github.com/jinzhu/gorm"
	"github.com/nccgroup/tracy/api/store"
	"github.com/nccgroup/tracy/api/types"
	"github.com/nccgroup/tracy/configure"
	"github.com/nccgroup/tracy/log"
)

func tracerCache(inR, inRJ chan int, inU chan types.Request, out chan []types.Request, outJSON chan []byte) {
	var (
		i           int
		r           types.Request
		tracers     []types.Request
		tracersJSON []byte
		err         error
	)
	for {
		select {
		case i = <-inR:
			if i == -1 {
				tracers = nil
				tracersJSON = nil
				continue
			}
			if tracers == nil {
				tracers, err = getTracersDB()
				if err != nil {
					log.Error.Fatal(err)
				}
			}
			out <- tracers
		case _ = <-inRJ:
			if tracers == nil {
				tracers, err = getTracersDB()
				if err != nil {
					log.Error.Fatal(err)
				}
				if tracersJSON, err = json.Marshal(tracers); err != nil {
					log.Warning.Print(err)
					outJSON <- []byte{}
					continue
				}
			} else if tracersJSON == nil {
				if tracersJSON, err = json.Marshal(tracers); err != nil {
					log.Warning.Print(err)
					outJSON <- []byte{}
					continue
				}
			}
			outJSON <- tracersJSON
		case r = <-inU:
			tracers = append(tracers, r)
			if tracersJSON, err = json.Marshal(tracers); err != nil {
				log.Warning.Print(err)
				continue
			}
		}
	}
}

var inReadChanTracer chan int
var inUpdateChanTracer chan types.Request
var inReadChanTracerJSON chan int
var outChanTracer chan []types.Request
var outChanTracerJSON chan []byte

func init() {
	inReadChanTracer = make(chan int, 10)
	inUpdateChanTracer = make(chan types.Request, 10)
	inReadChanTracerJSON = make(chan int, 10)
	outChanTracer = make(chan []types.Request, 10)
	outChanTracerJSON = make(chan []byte, 10)
	go tracerCache(inReadChanTracer, inReadChanTracerJSON, inUpdateChanTracer, outChanTracer, outChanTracerJSON)
}

// AddTracer is the common functionality to add a tracer to the database.
func AddTracer(request types.Request) ([]byte, error) {
	var (
		ret []byte
		err error
	)

	// Adding a size limit to the rawrequest field
	if len(request.RawRequest) > configure.Current.MaxRequestSize {
		request.RawRequest = request.RawRequest[:configure.Current.MaxRequestSize]
	}

	if err = store.DB.Create(&request).Error; err != nil {
		log.Warning.Printf(err.Error())
		return ret, err
	}

	inUpdateChanTracer <- request
	UpdateSubscribers(request)
	if ret, err = json.Marshal(request); err != nil {
		log.Warning.Printf(err.Error())
	}

	return ret, err
}

// updateTracer is the common functionality to add a tracer to the database.
func UpdateRequest(request types.Request) ([]byte, error) {
	var (
		ret []byte
		err error
	)

	if err = store.DB.Save(&request).Error; err != nil {
		log.Warning.Printf(err.Error())
		return ret, err
	}

	inUpdateChanTracer <- request
	UpdateSubscribers(request)
	if ret, err = json.Marshal(request); err != nil {
		log.Warning.Printf(err.Error())
	}

	return ret, err
}

func AddRequest(request types.Request, tracerID uint) ([]byte, error) {
	var (
		ret []byte
		err error
	)

	tracer := types.Tracer{}

	tracer.ID = tracerID

	if err = store.DB.Model(&tracer).Association("Requests").Append(request).Error; err != nil {
		log.Warning.Printf(err.Error())
		return ret, err
	}

	inUpdateChanTracer <- request
	UpdateSubscribers(request)
	if ret, err = json.Marshal(request); err != nil { //TODO: Find out what should be returned here
		log.Warning.Printf(err.Error())
	}

	return ret, err
}

// GetTracer is the common functionality to get a tracer from the database by it's ID.
func GetTracer(tracerID uint) ([]byte, error) {
	var (
		ret    []byte
		err    error
		tracer types.Tracer
	)

	if err = store.DB.First(&tracer, tracerID).Error; err != nil {
		log.Warning.Printf(err.Error())
		return ret, err
	}

	if ret, err = json.Marshal(tracer); err != nil {
		log.Warning.Printf(err.Error())
		return ret, err
	}

	ret = []byte(strings.Replace(string(ret), "\\", "\\\\", -1))
	return ret, nil
}

func getTracersDB() ([]types.Request, error) {
	var (
		err  error
		reqs []types.Request
	)

	if err = store.DB.Preload("Tracers").Find(&reqs).Error; err != nil {
		log.Warning.Print(err)
		return nil, err
	}

	return reqs, err
}

// EditTracer updates a tracer in the database.
func EditTracer(tracer types.Tracer, id uint) ([]byte, error) {
	t := types.Tracer{Model: gorm.Model{ID: id}}
	var err error
	if err = store.DB.Model(&t).Updates(tracer).Error; err != nil {
		log.Warning.Print(err)
		return []byte{}, err
	}
	r := types.Request{Tracers: []types.Tracer{t}}
	inUpdateChanTracer <- r

	var ret []byte
	if ret, err = json.Marshal(tracer); err != nil {
		log.Warning.Print(err)
	}

	return ret, err
}

// GetTracersCache returns the current set of tracers but first looks in the cache
// for them.
func GetTracersCache() []types.Request {
	inReadChanTracer <- 1
	return <-outChanTracer
}

// GetTracersJSONCache returns the current set of tracers as a JSON object
// and grabs it from the cache.
func GetTracersJSONCache() []byte {
	inReadChanTracerJSON <- 1
	return <-outChanTracerJSON
}

// ClearTracerCache will tell the cache of tracers to reset. This is mainly used
// for testing.
func ClearTracerCache() {
	inReadChanTracer <- -1
}

// GetTracers is the common functionality to get all the tracers from database.
func GetTracers() ([]byte, error) {
	return GetTracersJSONCache(), nil
}

// GetTracerRequest gets the raw request for the tracer specified by an ID.
func GetTracerRequest(tracerID uint) ([]byte, error) {
	var (
		ret     []byte
		err     error
		request types.Request
	)

	if err = store.DB.First(&request).Error; err != nil {
		log.Warning.Print(err)
		return ret, err
	}

	if ret, err = json.Marshal(request); err != nil {
		log.Warning.Print(err)
	}

	return ret, err
}
