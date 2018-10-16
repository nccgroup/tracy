package types

import (
	"fmt"
	"net"
)

// Server is a struct that holds a configured server that has been
// resolved to a set of IPs and a port number.
type Server struct {
	IPs      []net.IP
	Hostname string
	Port     uint
}

// Addr returns the address string of the Server to be used with libraries
// like http.Server.
func (a *Server) Addr() string {
	return fmt.Sprintf("%s:%d", a.Hostname, a.Port)
}

// Equal compares two Server objects to see if
// any of their IPs are the same and they have the same
// port number.
func (a *Server) Equal(b Server) bool {
	for _, ipa := range a.IPs {
		for _, ipb := range b.IPs {
			if ipa.Equal(ipb) && a.Port == b.Port {
				return true
			}
		}
	}
	return false
}
