package types

import (
	"github.com/jinzhu/gorm"
)

/*RawEvent is a structure for holding raw event data such as HTTP responses or DOM. */
type RawEvent struct {
	gorm.Model
	Data string `json:"Data" gorm:"not null;unique_data:data_collision"`
}
