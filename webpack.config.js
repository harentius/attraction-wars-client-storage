const path = require('path');

module.exports = {
  entry: "./src/index.js",
  target: 'node',
  output: {
    libraryTarget: 'commonjs2',
    path: path.resolve(__dirname, "dist"),
    filename: 'index.js',
  }
};
