package types

import (
	"github.com/jinzhu/gorm"
)

/*Tracer is a marker for input into the application. This will be used to find outputs. */
type Tracer struct {
	gorm.Model
	TracerString string        `json:"tracer_string" gorm:"not null;index;unique_index:idx_tracer_string"`
	RequestID    uint          `json:"raw_request_id" gorm:"not null;index"`
	TracerEvents []TracerEvent `json:"tracer_events"`
}
