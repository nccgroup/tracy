package rest

import (
	"github.com/elazarl/go-bindata-assetfs"
)

/* Nop used for builds. This implementation is fulfilled when the binary is build. */
func assetFS() *assetfs.AssetFS {
	panic("Don't call me. Use the --debug-ui flag instead.")
}
