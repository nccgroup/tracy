package types

import "github.com/jinzhu/gorm"

// ReproductionTest is a struct that holds a single reproduction
// test case. Reproduction tests are associated with a particular
// event.
type ReproductionTest struct {
	gorm.Model
	TracerEventID uint   `json:"TracerEventID" gorm:"not null"`
	Exploit       string `json:"Exploit" gorm:"not null"`
	Successful    bool   `json:"Successful" gorm:"not null"`
}

// Reproduction is the struct that holds all the information
// a tab needs to in order to successfully reproduce a finding.
type Reproduction struct {
	Tracer            Tracer             `json:Tracer`
	TracerEvent       TracerEvent        `json:TracerEvent`
	DOMContext        DOMContext         `json:DOMContext`
	ReproductionTests []ReproductionTest `json:ReproductionTests`
}
