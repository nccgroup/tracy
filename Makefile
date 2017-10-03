# Borrowed from:
# https://github.com/silven/go-example/blob/master/Makefile
# https://vic.demuzere.be/articles/golang-makefile-crosscompile/

#BINARY = xxterminate
#VET_REPORT = vet.report
#TEST_REPORT = tests.xml
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
all: link clean test vet linux darwin windows

link:
	BUILD_DIR=${BUILD_DIR}; \
	BUILD_DIR_LINK=${BUILD_DIR_LINK}; \
	CURRENT_DIR=${CURRENT_DIR}; \
	if [ "$${BUILD_DIR_LINK}" != "$${CURRENT_DIR}" ]; then \
		echo "Fixing symlinks for build"; \
		rm -f $${BUILD_DIR}; \
		ln -s $${CURRENT_DIR} $${BUILD_DIR}; \
	fi

linux:
	cd ${BUILD_DIR}; \
	dep ensure; \
	GOOS=linux GOARCH=${GOARCH} go build ${LDFLAGS} -o ${BINARY}-linux-${GOARCH} . ; \
	cd - >/dev/null

darwin:
	cd ${BUILD_DIR}; \
	dep ensure; \
	GOOS=darwin GOARCH=${GOARCH} go build ${LDFLAGS} -o ${BINARY}-darwin-${GOARCH} . ; \
	cd - >/dev/null

windows:
	cd ${BUILD_DIR}; \
	dep ensure; \
	GOOS=windows GOARCH=${GOARCH} go build ${LDFLAGS} -o ${BINARY}-windows-${GOARCH}.exe . ; \
	cd - >/dev/null

# Need to redo these.
#test:
#	if ! hash go2xunit 2>/dev/null; then go install github.com/tebeka/go2xunit; fi
#	cd ${BUILD_DIR}; \
#	godep go test -v ./... 2>&1 | go2xunit -output ${TEST_REPORT} ; \
#	cd - >/dev/null

# Need to redo these.
#vet:
#	-cd ${BUILD_DIR}; \
#	godep go vet ./... > ${VET_REPORT} 2>&1 ; \
#	cd - >/dev/null

fmt:
	cd ${BUILD_DIR}; \
	go fmt $$(go list ./... | grep -v /vendor/) ; \
	cd - >/dev/null

lint:
	cd ${BUILD_DIR} ; \
	golint ; \
	cd - >/dev/null

# Install the go dependency management tool
# Install the go linting tool
deps:
	go get -u github.com/golang/dep/cmd/dep; \
	go get -u github.com/golang/lint/golint;

clean:
#	-rm -f ${TEST_REPORT}
#	-rm -f ${VET_REPORT}
	-rm -f ${BINARY}-*

.PHONY: link linux darwin windows test vet fmt clean deps