package store

import (
	"github.com/nccgroup/tracy/api/types"
	"github.com/nccgroup/tracy/log"

	"github.com/jinzhu/gorm"

	// Blank import used to initialize the register the sqlite database driver.
	_ "github.com/jinzhu/gorm/dialects/sqlite"
)

// DB is the one global used to gain access to the database from this package.
// Other packages, like testing, might choose to not use this database and instead
// will supply their own.
var DB *gorm.DB

// Open the database and create the tables if they aren't already created.
// Errors indicate something incorrectly happened while
// connecting. Don't forget to close this DB when finished using it.
func Open(path string, logMode bool) error {
	var err error
	if DB, err = gorm.Open("sqlite3", path); err != nil {
		log.Error.Fatal(err)
		return err
	}

	DB.Exec("PRAGMA foreign_keys = ON")
	DB.Exec("PRAGMA journal_mode = WAL")
	DB.LogMode(logMode)
	DB.AutoMigrate(
		&types.Tracer{},
		&types.TracerEvent{},
		&types.DOMContext{},
		&types.Request{},
		&types.RawEvent{},
		&types.Error{})

	// We want to disable the goroutine thread pool that is used by default since
	// this application doesn't need it and will cause performance issues.
	// https://stackoverflow.com/questions/35804884/sqlite-concurrent-writing-performance.
	DB.DB().SetMaxOpenConns(1)
	return nil
}
