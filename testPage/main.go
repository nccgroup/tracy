package main

import (
	"fmt"
	"io"
	"net/http"
)

func handler(w http.ResponseWriter, r *http.Request) {
	buf := make([]byte, 1000)
	io.ReadFull(r.Body, buf)
	w.Write(buf)
	test_bob := "test"
	fmt.Println(test_bob)
}

func main() {
	http.HandleFunc("/echo", handler)
	http.Handle("/", http.StripPrefix("/", http.FileServer(http.Dir("./public"))))
	http.ListenAndServe(":8083", nil)
}
