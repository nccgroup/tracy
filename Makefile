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
LDFLAGS = -ldflags "-X main.VERSION=${VERSION} -X main.COMMIT=${COMMIT} -X main.BRANCH=${BRANCH}"

# Build the project
all: build-linux build-darwin build-windows

build-linux:
	cd ${BUILD_DIR}; \
	dep ensure -v; \
	GOOS=linux GOARCH=${GOARCH} go build ${LDFLAGS} -o ${BINARY}-linux-${GOARCH} . ; \
	mv ./${BINARY}-linux-${GOARCH} ${GOPATH}/src/${PROJECT_NAME}/bin/
	cd - >/dev/null

build-darwin:
	cd ${BUILD_DIR}; \
	dep ensure -v; \
	GOOS=darwin GOARCH=${GOARCH} go build ${LDFLAGS} -o ${BINARY}-darwin-${GOARCH} . ; \
	mv ./${BINARY}-linux-${GOARCH} ${GOPATH}/src/${PROJECT_NAME}/bin/
	cd - >/dev/null

build-windows:
	cd ${BUILD_DIR}; \
	dep ensure -v; \
	GOOS=windows GOARCH=${GOARCH} go build ${LDFLAGS} -o ${BINARY}-windows-${GOARCH}.exe . ; \
	mv ./${BINARY}-linux-${GOARCH} ${GOPATH}/src/${PROJECT_NAME}/bin/
	cd - >/dev/null

install-linux:
	cd ${BUILD_DIR}; \
	dep ensure -v; \
	GOOS=linux GOARCH=${GOARCH} go install ${LDFLAGS} . ; \
	cd - >/dev/null

install-darwin:
	cd ${BUILD_DIR}; \
	dep ensure -v; \
	GOOS=darwin GOARCH=${GOARCH} go install ${LDFLAGS} . ; \
	cd - >/dev/null

install-windows:
	cd ${BUILD_DIR}; \
	dep ensure -v; \
	GOOS=windows GOARCH=${GOARCH} go install ${LDFLAGS} . ; \
	cd - >/dev/null

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
	-rm -f ${BINARY}-*

.PHONY: linux darwin windows test vet fmt clean deps
