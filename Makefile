BINARY = tracy
GOARCH = amd64

VERSION=0
COMMIT=$(shell git rev-parse HEAD)
BRANCH=$(shell git rev-parse --abbrev-ref HEAD)

# Symlink into GOPATH
PROJECT_NAME=xxterminator-plugin
BUILD_DIR=${GOPATH}/src/${PROJECT_NAME}
CURRENT_DIR=$(shell pwd)
BUILD_DIR_LINK=$(shell readlink ${BUILD_DIR})

# Setup the -ldflags option for go build here, interpolate the variable values
LDFLAGS = -ldflags "-X main.VERSION=${VERSION} -X main.COMMIT=${COMMIT} -X main.BRANCH=${BRANCH}"

# Build the project
all: link clean linux darwin windows

link:
	BUILD_DIR=${BUILD_DIR}; \
	BUILD_DIR_LINK=${BUILD_DIR_LINK}; \
	CURRENT_DIR=${CURRENT_DIR}; \
	if [ "$${BUILD_DIR_LINK}" != "$${CURRENT_DIR}" ]; then \
		echo "Fixing symlinks for build"; \
		rm -f $${BUILD_DIR}; \
		ln -s $${CURRENT_DIR} $${BUILD_DIR}; \
	fi

build-linux:
	cd ${BUILD_DIR}; \
	dep ensure; \
	GOOS=linux GOARCH=${GOARCH} go build ${LDFLAGS} -o ${BINARY}-linux-${GOARCH} . ; \
	cd - >/dev/null

build-darwin:
	cd ${BUILD_DIR}; \
	dep ensure; \
	GOOS=darwin GOARCH=${GOARCH} go build ${LDFLAGS} -o ${BINARY}-darwin-${GOARCH} . ; \
	cd - >/dev/null

build-darwinwindows:
	cd ${BUILD_DIR}; \
	dep ensure; \
	GOOS=windows GOARCH=${GOARCH} go build ${LDFLAGS} -o ${BINARY}-windows-${GOARCH}.exe . ; \
	cd - >/dev/null

install-linux:
	cd ${BUILD_DIR}; \
	dep ensure; \
	GOOS=linux GOARCH=${GOARCH} go install ${LDFLAGS} . ; \
	cd - >/dev/null

install-darwin:
	cd ${BUILD_DIR}; \
	dep ensure; \
	GOOS=darwin GOARCH=${GOARCH} go install ${LDFLAGS} . ; \
	cd - >/dev/null

install-windows:
	cd ${BUILD_DIR}; \
	dep ensure; \
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

.PHONY: link linux darwin windows test vet fmt clean deps
