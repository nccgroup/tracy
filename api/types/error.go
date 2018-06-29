package types

import (
	"github.com/jinzhu/gorm"
)

// Error is a database table that contains all the errors from the application.
type Error struct {
	gorm.Model
	ErrorID  uint   `json:"ErrorID" gorm:"not null"`
	ErrorMsg string `json:"ErrorMsg" gorm:"not null"`
}
