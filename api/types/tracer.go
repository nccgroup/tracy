package types

import (
	"github.com/jinzhu/gorm"
)

/* Constants used to track the tracer string location type. */
const (
	Header = iota
	QueryParam
	Body
)

/*Tracer is a marker for input into the application. This will be used to find outputs. */
type Tracer struct {
	gorm.Model
	TracerString        string        `json:"TracerString" gorm:"not null;index"` // the tracer string used by the user (e.g. {{XSS}})
	OverallSeverity     uint          `json:"OverallSeverity" gorm:"not null"`
	RequestID           uint          `json:"RequestID" gorm:"not null;index"`
	TracerEvents        []TracerEvent `json:"TracerEvents" `
	TracerPayload       string        `json:"TracerPayload" gorm:"not null;index;unique_index:idx_tracer_string"` // the payload tracy convert the string into
	TracerLocationType  uint          `json:"TracerLocationType" gorm:"not null"`
	TracerLocationIndex uint          `json:"TracerLocationIndex"` // what is the index or where the tracer was located in the request
	HasTracerEvents     bool          `json:"HasTracerEvents" gorm:"not null"`
}
