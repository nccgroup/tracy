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

# Build the project for all platforms
all: clean
	dep ensure -v;
	xgo -dest ${GOPATH}/src/${PROJECT_NAME}/bin --ldflags=${LDFLAGS} --targets=windows/amd64,linux/amd64,darwin/amd64 ${GOPATH}/src/${PROJECT_NAME}

fmt:
	cd ${BUILD_DIR}; \
	go fmt $$(go list ./... | grep -v /vendor/) ; \
	cd - >/dev/null

test:
	go test ${PROJECT_NAME}/test

lint:
	cd ${BUILD_DIR} ; \
	golint $$(go list ./... | grep -v /vendor/) ; \
	cd - >/dev/null

# Install the go dependency management tool
# Install the go linting tool
deps:
	go get -u github.com/golang/dep/cmd/dep; \
	go get -u github.com/golang/lint/golint;

clean:
	-rm -f ${GOPATH}/src/${PROJECT_NAME}/bin/*

.PHONY: linux darwin windows test vet fmt clean deps
