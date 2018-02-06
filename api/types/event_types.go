package types

import (
	"github.com/jinzhu/gorm"
)

/*TracerEvent is an event that marks when a particular tracer was viewed again. */
type TracerEvent struct {
	gorm.Model
	TracerID    uint         `json:"TracerID" gorm:"not null;index"`
	RawEvent    string       `json:"RawEvent"  gorm:"not null;unique_index:idx_event_collision"`
	EventURL    string       `json:"EventURL"  gorm:"not null; unique_index:idx_event_collision"`
	EventType   string       `json:"EventType"  gorm:"not null"`
	DOMContexts []DOMContext `json:"DOMContexts"`
}
