package common

import (
	"encoding/json"
	"github.com/nccgroup/tracy/api/store"
	"github.com/nccgroup/tracy/api/types"
	"github.com/nccgroup/tracy/log"
	"strings"
)

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

// GetTracers is the common functionality to get all the tracers from database.
func GetTracers() ([]byte, error) {
	var (
		ret  []byte
		err  error
		reqs []types.Request
	)

	if err = store.DB.Preload("Tracers").Find(&reqs).Error; err != nil {
		log.Warning.Print(err)
		return ret, err
	}

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
