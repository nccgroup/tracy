package common

import (
	"encoding/json"
	"fmt"
	"tracy/log"
	"tracy/tracer/store"
	"tracy/tracer/types"
)

/*AddLabel is the common functionality to add a label to the database. */
func AddLabel(l types.Label) ([]byte, error) {
	log.Trace.Printf("Adding the following label: %+v", l)
	var ret []byte

	label, err := store.DBAddLabel(store.TracerDB, l)
	if err == nil {
		if int(label.ID.Int64) != 0 {
			log.Trace.Printf("Successfully added the label to the database: %+v", label)

			ret, err = json.Marshal(label)
		} else {
			err = fmt.Errorf("the label added is not the same as the label returned")
		}
	}

	if err != nil {
		log.Warning.Printf(err.Error())
	}

	return ret, err
}

/*GetLabel is the common functionality to get a label from the database. */
func GetLabel(ID int) ([]byte, error) {
	log.Trace.Printf("Getting the following label: %d", ID)
	var ret []byte
	var err error

	label, err := store.DBGetLabelByID(store.TracerDB, ID)
	if err == nil {
		log.Trace.Printf("Successfully got the following label: %+v", label)
		labelStr, err := json.Marshal(label)
		if err == nil {
			ret = labelStr
		}
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

	labels, err := store.DBGetLabels(store.TracerDB)
	if err == nil {
		log.Trace.Printf("Successfully got the labels: %+v", labels)
		tracersStr, err := json.Marshal(labels)
		if err == nil {
			ret = tracersStr
		}
	}

	if err != nil {
		log.Warning.Printf(err.Error())
	}

	return ret, err
}
