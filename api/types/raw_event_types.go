package types

import (
	"github.com/jinzhu/gorm"
)

/*RawEvent is a payload type that can be used by the extension. */
type RawEvent struct {
	gorm.Model
	RawData string `json:"RawData" gorm:"not null"`
}
