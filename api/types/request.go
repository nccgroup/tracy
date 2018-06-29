package types

import (
	"github.com/jinzhu/gorm"
)

// Request is a structure for holding the request information that created a tracer.
type Request struct {
	gorm.Model
	RawRequest    string   `json:"RawRequest" gorm:"not null"`
	RequestURL    string   `json:"RequestURL" gorm:"not null"`
	RequestMethod string   `json:"RequestMethod" gorm:"not null"`
	Tracers       []Tracer `json:Tracers"`
}
