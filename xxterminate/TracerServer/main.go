package main

import (
	"log"
	"path/filepath"
	"xxterminator-plugin/xxterminate/TracerServer/configure"
)

func main() {
	/* Configure the server, but we won't need the router. */
	srv, _ := configure.Server()

	/* Serve it. */
	log.Fatal(srv.ListenAndServe())
}

func init() {
	/* Indicate that this is the prod database and not the test. */
	db := filepath.Join(os.TempDir(), "prod")
	/* Create the directory if it doesn't exist. */
	if _, err := os.Stat(db); os.IsNotExist(err) {
		os.Mkdir(db, 0755)
	}
	configure.Database(filepath.Join(db, "tracer-db.db"))
}
