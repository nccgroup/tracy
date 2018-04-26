package types

import (
	"github.com/jinzhu/gorm"
)

/*RawEvent is a structure for holding raw event data such as HTTP responses or DOM. */
type RawEvent struct {
	gorm.Model
	Data string `json:"RawData" gorm:"not null"`
}
