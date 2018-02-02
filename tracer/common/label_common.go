package common

import (
	"encoding/json"
	"fmt"
	"tracy/log"
	"tracy/tracer/store"
	"tracy/tracer/types"
)

/*AddLabel is the common functionality to add a label to the database. */
func AddLabel(label types.Label) ([]byte, error) {
	log.Trace.Printf("Adding the following label: %+v", l)
	var ret []byte

	if err = store.DB.Create(&label).Error; err == nil {
		log.Trace.Printf("Successfully added the label to the database: %+v", label)
		ret, err = json.Marshal(label)
	} else {
		log.Warning.Printf(err.Error())
	}

	return ret, err
}

/*GetLabel is the common functionality to get a label from the database. */
func GetLabel(labelID uint) ([]byte, error) {
	log.Trace.Printf("Getting the following label: %d", labelID)u
	var ret []byte
	var err error

	var label types.Label
	if err = store.DB.First(&label, labelID)u.Error; err == nil {
		log.Trace.Printf("Successfully got the following label: %+v", label)
		ret, err = json.Marshal(label)
	}

	if err != nil {
		log.Warning.Printf(err.Error())
	}

	return ret, err
}

/*GetLabels is the common functionality to get all the labels from database. */
func GetLabels() ([]byte, error) {
	log.Trace.Printf("Getting all the labels.")
	var ret []byte
	var err error

	var labels []types.Label
	if err = store.DB.Find(&labels).Error; err == nil {
		log.Trace.Printf("Successfully got the labels: %+v", labels)
		ret, err = json.Marshal(labels)
	}

	if err != nil {
		log.Warning.Printf(err.Error())
	}

	return ret, err
}
