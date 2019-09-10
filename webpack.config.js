const path = require('path');

module.exports = {
  entry: {
    Client: "./src/Client.js",
    Storage: "./src/Storage.js",
    KeysPressState: "./src/KeysPressState.js"
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: '[name].js',
  }
};
