module.exports = {
  coverageDirectory: '../coverage/',
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.js'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  testEnvironment: 'node'
}
