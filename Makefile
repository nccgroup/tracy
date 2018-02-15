BINARY = tracy
GOARCH = amd64

VERSION=0
COMMIT=$(shell git rev-parse HEAD)
BRANCH=$(shell git rev-parse --abbrev-ref HEAD)

# Symlink into GOPATH
PROJECT_NAME=tracy
BUILD_DIR=${GOPATH}/src/${PROJECT_NAME}
CURRENT_DIR=$(shell pwd)
BUILD_DIR_LINK=$(shell readlink ${BUILD_DIR})

# Setup the -ldflags option for go build here, interpolate the variable values
LDFLAGS = "-X main.VERSION=${VERSION} -X main.COMMIT=${COMMIT} -X main.BRANCH=${BRANCH}"

# Build the project for all platforms. Really only for CI or builders.
all: test view bins
	
# Build the cross-compiled binaries with xgo. Really only for CI or builders.
bins:
	dep ensure -v;
	xgo -dest ${GOPATH}/src/${PROJECT_NAME}/bin --ldflags=${LDFLAGS} --targets=windows/amd64,linux/amd64,darwin/amd64 ${GOPATH}/src/${PROJECT_NAME}

# Build the view and static assets into a Go file
view:
	npm --prefix ${GOPATH}/src/${PROJECT_NAME}/api/view run build; \
	cd ${GOPATH}/src/${PROJECT_NAME}/api/view/; \
	go-bindata-assetfs -pkg rest ./build/...; \
	mv ./bindata_assetfs.go ${GOPATH}/src/${PROJECT_NAME}/api/rest/

# Format all the Go code
fmt:
	cd ${BUILD_DIR}; \
	go fmt $$(go list ./... | grep -v /vendor/) ; \
	cd - >/dev/null

test:
	go test ./...

lint:
	cd ${BUILD_DIR} ; \
	golint $$(go list ./... | grep -v /vendor/) ; \
	cd - >/dev/null

# Install the dependencies for the builder.
build-deps:
	go get github.com/golang/dep/cmd/dep; \
	go get github.com/golang/lint/golint; \
	go get github.com/karalabe/xgo; \
	go get github.com/jteeuwen/go-bindata/...; \
	go get github.com/elazarl/go-bindata-assetfs/...
	
# Install the dependencies for a developer.
dev-deps:
	go get github.com/golang/dep/cmd/dep

.PHONY: all bins view test fmt build-deps dev-deps
