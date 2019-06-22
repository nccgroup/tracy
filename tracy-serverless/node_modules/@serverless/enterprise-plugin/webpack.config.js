const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  target: 'node',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: './index.js',
    libraryTarget: 'commonjs2',
    library: 'iopipe-serverless-plugin'
  },
  externals: [
    nodeExternals({
      whitelist: [/babel-runtime/, /regenerator-runtime/, /core-js/]
    })
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /handlerCode/,
        use: 'raw-loader'
      }
    ]
  }
};
