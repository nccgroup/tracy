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

/*
func tracerCache(inClear chan int, inR, inRJ chan string, inU chan types.Tracer, out chan []types.Tracer, outJSON chan []byte) {
	var (
		u   string
		r   types.Tracer
		err error
	)
	empty := []byte{}
	tracers := make(map[string][]types.Tracer)
	tracersJSON := make(map[string][]byte)

	for {
		select {
		case _ = <-inClear:
			tracers = nil
			tracersJSON = nil
			continue
		case u = <-inR:
			if tracers[u] == nil {
				tracers[u], err = getTracersDB(u)
				if err != nil {
					log.Error.Fatal(err)
				}
			}
			out <- tracers[u]
		case u = <-inRJ:
			if tracers[u] == nil {
				tracers[u], err = getTracersDB(u)
				if err != nil {
					log.Error.Fatal(err)
				}
				if tracersJSON[u], err = json.Marshal(tracers[u]); err != nil {
					log.Warning.Print(err)
					outJSON <- empty
					continue
				}
			} else if tracersJSON[u] == nil {
				if tracersJSON[u], err = json.Marshal(tracers[u]); err != nil {
					log.Warning.Print(err)
					outJSON <- empty
					continue
				}
			}
			outJSON <- tracersJSON[u]
		case r = <-inU:
			// If the tracer already exists in the list, just update it
			// with the new value.
			for i := range tracers[r.UUID] {
				if r.ID == tracers[r.UUID][i].ID {
					// This overwrites that tracer. Make sure whatever
					// you pass here has all its fields filled out so
					// that we don't lose data.
					tracers[r.UUID][i] = r
					if tracersJSON[r.UUID], err = json.Marshal(tracers[r.UUID]); err != nil {
						log.Warning.Print(err)
						continue
					}
					continue
				}
			}

			// Otherwise, add it to the list.
			tracers[r.UUID] = append(tracers[r.UUID], r)
			if tracersJSON[r.UUID], err = json.Marshal(tracers[r.UUID]); err != nil {
				log.Warning.Print(err)
				continue
			}

		}
	}
}

var inClearChanTracer chan int
var inReadChanTracer chan string
var inUpdateChanTracer chan types.Tracer
var inReadChanTracerJSON chan string
var outChanTracer chan []types.Tracer
var outChanTracerJSON chan []byte
*/
func init() {
	/*	inClearChanTracer = make(chan int, 10)
		inReadChanTracer = make(chan string, 10)
		inUpdateChanTracer = make(chan types.Tracer, 10)
		inReadChanTracerJSON = make(chan string, 10)
		outChanTracer = make(chan []types.Tracer, 10)
		outChanTracerJSON = make(chan []byte, 10)
		go tracerCache(inClearChanTracer,
			inReadChanTracer,
			inReadChanTracerJSON,
			inUpdateChanTracer,
			outChanTracer,
			outChanTracerJSON)*/
}

// AddRequests adds multiple requests for a single tracer to the database.
func AddRequests(tracer types.Tracer) ([]byte, error) {
	var (
		ret []byte
		err error
	)

	// Adding a size limit to the RawRequest field.
	for _, v := range tracer.Requests {
		if len(v.RawRequest) > configure.Current.MaxRequestSize {
			v.RawRequest = v.RawRequest[:configure.Current.MaxRequestSize]
		}
	}

	if err = store.DB.Create(&tracer).Error; err != nil {
		log.Warning.Printf(err.Error())
		return ret, err
	}

	//inUpdateChanTracer <- tracer
	UpdateSubscribers(tracer.UUID, tracer)
	if ret, err = json.Marshal(tracer); err != nil {
		log.Warning.Printf(err.Error())
	}

	return ret, err
}

// AddTracers adds multiple tracers for a single requests to the database.
func AddTracers(req types.Request) ([]byte, error) {
	var (
		ret []byte
		err error
	)

	// Adding a size limit to the RawRequest field.
	if len(req.RawRequest) > configure.Current.MaxRequestSize {
		req.RawRequest = req.RawRequest[:configure.Current.MaxRequestSize]
	}

	if err = store.DB.Create(&req).Error; err != nil {
		log.Warning.Printf(err.Error())
		return ret, err
	}

	/*	for _, v := range req.Tracers {
		v.Requests = []types.Request{req}
		inUpdateChanTracer <- v
	}*/
	UpdateSubscribers(req.UUID, req)
	if ret, err = json.Marshal(req); err != nil {
		log.Warning.Printf(err.Error())
	}

	return ret, err
}

// UpdateRequest is the common functionality to modify a raw request
// in the database.
func UpdateRequest(request types.Request) ([]byte, error) {
	var (
		ret []byte
		err error
	)

	if err = store.DB.Where("uuid = ?", request.UUID).Save(&request).Error; err != nil {
		log.Warning.Printf(err.Error())
		return ret, err
	}

	//	inUpdateChanTracer <- request
	UpdateSubscribers(request.UUID, request)
	if ret, err = json.Marshal(request); err != nil {
		log.Warning.Printf(err.Error())
	}

	return ret, err
}

// AddRequest is the common functionality to add a request to a tracer
// by its ID.
func AddRequest(request types.Request, tracerID uint) ([]byte, error) {
	var (
		ret []byte
		err error
	)

	tracer := types.Tracer{}
	tracer.ID = tracerID
	if err = store.DB.Model(&tracer).
		Where("uuid = ?", request.UUID).
		Association("Requests").
		Append(request).Error; err != nil {
		log.Warning.Printf(err.Error())
		return ret, err
	}

	//	inUpdateChanTracer <- request
	UpdateSubscribers(request.UUID, request)
	if ret, err = json.Marshal(request); err != nil { //TODO: Find out what should be returned here
		log.Warning.Printf(err.Error())
	}

	return ret, err
}

// GetTracer is the common functionality to get a tracer from the database by it's ID.
func GetTracer(tracerID uint, uuid string) ([]byte, error) {
	var (
		ret    []byte
		err    error
		tracer types.Tracer
	)

	if err = store.DB.Where("uuid = ?", uuid).First(&tracer, tracerID).Error; err != nil {
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

func getTracersDB(u string) ([]types.Tracer, error) {
	var (
		err     error
		tracers []types.Tracer
	)

	if err = store.DB.Where("uuid = ?", u).Preload("Requests").Find(&tracers).Error; err != nil {
		log.Warning.Print(err)
		return nil, err
	}

	return tracers, err
}

/*
// GetTracersCache returns the current set of tracers but first looks in the cache
// for them.
func GetTracersCache(u string) []types.Tracer {
	inReadChanTracer <- u
	return <-outChanTracer
}

// GetTracersJSONCache returns the current set of tracers as a JSON object
// and grabs it from the cache based on the UUID.
func GetTracersJSONCache(u string) []byte {
	inReadChanTracerJSON <- u
	return <-outChanTracerJSON
}

// ClearTracerCache will tell the cache of tracers to reset. This is mainly used
// for testing.
func ClearTracerCache() {
	inClearChanTracer <- -1
}*/

// GetTracers is the common functionality to get all the tracers from database.
func GetTracers(u string) ([]byte, error) {
	var ret []byte
	tracers, err := getTracersDB(u)
	if err != nil {
		log.Warning.Printf(err.Error())
		return empty, err
	}
	if ret, err = json.Marshal(tracers); err != nil {
		log.Warning.Printf(err.Error())
		return ret, err
	}

	return ret, nil
}

var empty = []byte("")

// EditTracer updates a tracer in the database.
func EditTracer(tracer types.Tracer, id uint) ([]byte, error) {
	t := types.Tracer{Model: gorm.Model{ID: id}}
	var err error
	if err = store.DB.Model(&t).Where("uuid = ?", tracer.UUID).Updates(tracer).Error; err != nil {
		log.Warning.Print(err)
		return empty, err
	}

	//	inUpdateChanTracer <- t
	UpdateSubscribers(tracer.UUID, t)

	return empty, err
}
