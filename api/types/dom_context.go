package types

import (
	"github.com/jinzhu/gorm"
)

// Constants used to track the categories for the HTMLLocationType of a tracer string.
const (
	Attr = iota
	Text
	NodeName
	AttrVal
	Comment
)

// Constants used to track the different reasons.
const (
	LeafNode = iota
	LeafNodeScriptTag
	TagName
	LeafNodeCommentTag
	AttributeName
	AttributeNameHTTPResponse
	AttributeValueStartHref
	AttributeValueOnEventHandler
	AttributeValueHTTPResponse
)

// DOMContext is an event that marks when a particular tracer was viewed again.
type DOMContext struct {
	gorm.Model
	TracerEventID     uint               `json:"TracerEventID" gorm:"not null; index"`
	EventContext      string             `json:"EventContext" gorm:"not null"`
	HTMLLocationType  uint               `json:"HTMLLocationType" gorm:"not null"`
	HTMLNodeType      string             `json:"HTMLNodeType" gorm:"not null"`
	Severity          uint               `json:"Severity" gorm:"not null"`
	Reason            uint               `json:"Reason" gorm:"not null"`
	ReproductionTests []ReproductionTest `json:"ReproductionTests"`
}
