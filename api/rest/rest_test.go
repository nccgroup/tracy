package rest

import (
	"testing"
)

// TestAllRest combines all the rest package tests into a table
// to avoid odd state things like database files.
func TestAllRest(t *testing.T) {
	Configure()
	var table = [][]RequestTestPair{
		testAddEvent(t),
		testDuplicateEvent(t),
		testGetAllConfig(t),
		testAddTracer(t),
		testSwitchProject(t),
		testDeleteProject(t),
	}

	serverTestHelperBulk(table, t)
}
