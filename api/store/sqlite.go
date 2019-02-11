package store

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/jinzhu/gorm" // Blank import used to initialize the register the sqlite database driver.
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	"github.com/nccgroup/tracy/api/types"
	"github.com/nccgroup/tracy/configure"
	"github.com/nccgroup/tracy/log"
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
	if err := DB.AutoMigrate(
		&types.Tracer{},
		&types.TracerEvent{},
		&types.DOMContext{},
		&types.ReproductionTest{},
		&types.Request{},
		&types.RawEvent{},
		&types.Error{}).Error; err != nil {
		fp := filepath.Join(configure.Current.TracyPath, "archives", filepath.Base(path))
		fmt.Printf(`
It looks like you are running a Tracy binary with an outdated database file.
This happens when you upgrade Tracy to a new version that modified the database
schema. We are going to move your old database out of the way and create a new
database for you based on the current version of Tracy. If you want to make use
of the data in your old database, stop this program and  use the version of tracy
that created the database with the "-database" flag:

tracy -database %s

`, fp)
		DB.Close()
		os.Rename(path, fp)
		err := Open(filepath.Join(configure.Current.TracyPath, "prod-tracer-db.db"), logMode)
		if err != nil {
			log.Error.Fatal(err)
		}
		return nil
	}

	// We want to disable the goroutine thread pool that is used by default since
	// this application doesn't need it and will cause performance issues.
	// https://stackoverflow.com/questions/35804884/sqlite-concurrent-writing-performance.
	DB.DB().SetMaxOpenConns(1)
	return nil
}
