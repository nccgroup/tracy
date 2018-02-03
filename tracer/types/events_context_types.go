package types

import (
	"github.com/jinzhu/gorm"
)

/*DOMContext is an event that marks when a particular tracer was viewed again. */
type DOMContext struct {
	gorm.Model
	TracerEventID    uint   `json:"tracer_event_id" gorm:"not null; index"`
	EventContext     string `json:"event_context" gorm:"not null"`
	HTMLLocationType uint   `json:"html_location_typ" gorm:"not null"`
	HTMLNodeType     string `json:"html_node_type" gorm:"not null"`
}
