#!/bin/bash
set -e
rm -rf dist
mkdir -p dist
babel src -d dist --source-maps --ignore "**/*.test.js"
rsync -avz --exclude "*.js" --exclude "__tests__" --exclude "node_modules" src/ dist/
cd sdk-js && npm i && npm run build
