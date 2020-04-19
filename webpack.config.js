const path = require("path");
const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const packageJSON = require("./package.json");
const fileExtensions = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "eot",
  "otf",
  "svg",
  "ttf",
  "woff",
  "woff2",
];
const srcPath = [__dirname, "src"];
const jsPath = [...srcPath, "js"];
const htmlPath = [...srcPath, "html"];

const config = (mode) => {
  const isDevelopment = mode === "development";
  return {
    watch: isDevelopment ? true : false,
    devtool: isDevelopment ? "inline-source-map" : "",
    mode: mode,
    entry: {
      page: path.join(...[...jsPath, "page.js"]),
      content: path.join(...[...jsPath, "content.js"]),
      searchWorker: path.join(...[...jsPath, "search-worker.js"]),
      databaseWorker: path.join(...[...jsPath, "database-worker.js"]),
      background: path.join(...[...jsPath, "background.js"]),
      ui: path.join(...[...jsPath, "ui.js"]),
      test: path.join(...[...jsPath, "test.js"]),
    },
    output: {
      path: path.join(__dirname, "build"),
      filename: "[name].bundle.js",
    },
    module: {
      rules: [
        {
          test: /\.css$/,
          loader: "style-loader!css-loader",
        },
        {
          test: new RegExp(".(" + fileExtensions.join("|") + ")$"),
          loader: "file-loader?name=[name].[ext]",
          exclude: /node_modules/,
        },
        {
          test: /\.html$/,
          loader: "html-loader",
          exclude: /node_modules/,
        },
        {
          test: /\.(js|jsx)$/,
          loader: "babel-loader",
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: fileExtensions
        .map((extension) => "." + extension)
        .concat([".jsx", ".js", ".css"]),
    },
    plugins: [
      new webpack.DefinePlugin({
        DEV: isDevelopment,
      }),
      new CopyWebpackPlugin([
        {
          from: "src/manifest.json",
          transform: function (content) {
            // Generates the manifest file using the package.json informations
            // and also modifies some of the permissions based on the mode.
            const manifestJSON = JSON.parse(content.toString());
            return Buffer.from(
              JSON.stringify({
                ...manifestJSON,
                name: packageJSON.name,
                description: packageJSON.description,
                version: packageJSON.version,
                permissions: isDevelopment
                  ? manifestJSON.permissions.concat(["management"])
                  : manifestJSON.permissions,
              })
            );
          },
        },
        {
          from: "src/img/*",
          flatten: true,
        },
        {
          from: "src/css/*",
          flatten: true,
        },
      ]),
      new HtmlWebpackPlugin({
        template: path.join(...[...htmlPath, "ui.html"]),
        filename: "ui.html",
        chunks: ["ui"],
      }),
      new HtmlWebpackPlugin({
        template: path.join(...[...htmlPath, "test.html"]),
        filename: "test.html",
        chunks: ["test"],
      }),
    ],
  };
};

module.exports = (env, argv) => {
  const { mode } = argv;
  return config(mode);
};
