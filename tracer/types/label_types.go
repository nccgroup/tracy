package types

import (
	"github.com/jinzhu/gorm"
)

/*Label is a payload type that can be used by the extension. */
type Label struct {
	gorm.Model
	TracerString  string `json:"tracer" gorm:"not null"`
	TracerPayload string `json:"tracer_payload" gorm:"not null"`
}
