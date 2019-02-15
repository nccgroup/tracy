package common

import (
	"encoding/json"
	"strings"

	"github.com/nccgroup/tracy/api/store"
	"github.com/nccgroup/tracy/api/types"
	"github.com/nccgroup/tracy/log"
)

func tracerCache(inR chan int, inU chan types.Request, out chan []types.Request) {
	var (
		i       int
		r       types.Request
		tracers []types.Request
		err     error
	)
	for {
		select {
		case i = <-inR:
			if i == -1 {
				tracers = []types.Request{}
				continue
			}
			if tracers == nil {
				tracers, err = getTracersDB()
				if err != nil {
					log.Error.Fatal(err)
				}
			}
			out <- tracers
			continue
		case r = <-inU:
			tracers = append(tracers, r)
			continue
		}
	}
}

var inReadChanTracer chan int
var inUpdateChanTracer chan types.Request
var outChanTracer chan []types.Request

func init() {
	inReadChanTracer = make(chan int, 10)
	inUpdateChanTracer = make(chan types.Request, 10)
	outChanTracer = make(chan []types.Request, 10)
	go tracerCache(inReadChanTracer, inUpdateChanTracer, outChanTracer)
}

// AddTracer is the common functionality to add a tracer to the database.
func AddTracer(request types.Request) ([]byte, error) {
	var (
		ret []byte
		err error
	)

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

// GetTracersCache returns the current set of tracers but first looks in the cache
// for them.
func GetTracersCache() []types.Request {
	inReadChanTracer <- 1
	return <-outChanTracer
}

// ClearTracerCache will tell the cache of tracers to reset. This is mainly used
// for testing.
func ClearTracerCache() {
	inReadChanTracer <- -1
}

// GetTracers is the common functionality to get all the tracers from database.
func GetTracers() ([]byte, error) {
	var (
		ret []byte
		err error
	)

	reqs := GetTracersCache()
	if ret, err = json.Marshal(reqs); err != nil {
		log.Warning.Print(err)
	}

	return ret, err
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
