package main

import (
	"fmt"
	"io/ioutil"
	"net/http"
)

func echoHandler(resp http.ResponseWriter, request *http.Request) {
	data, _ := ioutil.ReadAll(request.Body)
	fmt.Println(data)
	resp.Write(data)
}

func main() {
	http.HandleFunc("/echo", echoHandler)
	http.Handle("/", http.FileServer(http.Dir("./content")))

	http.ListenAndServe(":8882", nil)
}
