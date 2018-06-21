package types

import (
	"github.com/jinzhu/gorm"
)

// Constants used to track if the data is HTML or JSON. More formats might be supported
// in the future.
const (
	HTML = iota
	JSON
)

// RawEvent is a structure for holding raw event data such as HTTP responses or DOM.
type RawEvent struct {
	gorm.Model
	Data   string `json:"Data" gorm:"not null;unique"`
	Format uint   `json:"Format" gorm:"not null"`
}
