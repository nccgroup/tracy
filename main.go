package main

import (
	pc "xxterminator-plugin/proxy/configure"
	"xxterminator-plugin/proxy"
	"log"
	tc "xxterminator-plugin/tracer/configure"
	"path/filepath"
	"os"
)

func main() {
	/* Start the proxy. */
	go func() {
		/* Open a TCP listener. */
		ln := pc.ProxyServer()

		/* Load the configured certificates. */
		cert := pc.Certificates()

		/* Serve it. This will block until the user closes the program. */
		proxy.ListenAndServe(ln, cert)
	}()

	/* Configure and start the server, but we won't need the router. */
	srv, _ := tc.Server()

	/* Serve it. Block here so the program doesn't close. */
	log.Fatal(srv.ListenAndServe())
}

func init() {
	/* Indicate that this is the prod database and not the test. */
	db := filepath.Join(os.TempDir(), "prod")
	/* Create the directory if it doesn't exist. */
	if _, err := os.Stat(db); os.IsNotExist(err) {
		os.Mkdir(db, 0755)
	}
	tc.Database(filepath.Join(db, "tracer-db.db"))
}
