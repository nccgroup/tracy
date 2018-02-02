package types

import (
	"github.com/jinzhu/gorm"
)

/*TracerEvent is an event that marks when a particular tracer was viewed again. */
type TracerEvent struct {
	gorm.Model
	TracerID    uint         `json:"tracer_id" gorm:"not null;index"`
	RawEvent    string       `json:"raw_event"  gorm:"not null;unique_index:idx_event_collision"`
	EventURL    string       `json:"event_url"  gorm:"not null; unique_index:idx_event_collision"`
	EventType   string       `json:"event_type"  gorm:"not null"`
	DOMContexts []DOMContext `json:"dom_contexts"`
}
