const path = require('path')
const webpack = require('webpack')

module.exports = {
  target: 'node',
  mode: 'production',
  entry: {
    app: [path.resolve(__dirname, './src/index.js')]
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: `index.js`,
    libraryTarget: 'umd',
  }
}
