package rest

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

/* Used to order request and their corresponding tests. */
type RequestTestPair struct {
	Request *http.Request
	Test    func(*httptest.ResponseRecorder, *testing.T) error
}
