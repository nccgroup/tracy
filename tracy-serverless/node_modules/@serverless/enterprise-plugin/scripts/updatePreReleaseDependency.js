// This is only for use in CI to set the version of platform-sdk in package.json
// for publishing prerelease versions to npm

const { spawnSync } = require('child_process')
const { writeFileSync, readFileSync } = require('fs')

const packageJson = JSON.parse(readFileSync('package.json').toString())

packageJson.dependencies['@serverless/platform-sdk'] = 'next'
writeFileSync('package.json', JSON.stringify(packageJson, null, 2) + '\n')
