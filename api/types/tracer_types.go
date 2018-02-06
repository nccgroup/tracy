package types

import (
	"github.com/jinzhu/gorm"
)

/*Tracer is a marker for input into the application. This will be used to find outputs. */
type Tracer struct {
	gorm.Model
	TracerString    string        `json:"TracerString" gorm:"not null;index;unique_index:idx_tracer_string"`
	OverallSeverity uint          `json:"OverallSeverity" gorm:"not null"`
	RequestID       uint          `json:"RequestID" gorm:"not null;index"`
	TracerEvents    []TracerEvent `json:"TracerEvents"`
}
