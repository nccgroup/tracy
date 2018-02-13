package rest

import (
	"fmt"
	"math/rand"
)

/*ServerError is the common function for logging an internal server error and serving back something generic. */
func ServerError(err error) []byte {
	/* TODO: need to do something with this number. */
	ref := rand.Intn(100000)
	return []byte(fmt.Sprintf(`{"Message":"Internal Server Error", "Reference":"%d"}`, ref))
}
