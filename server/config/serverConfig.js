const path = require("path");

const rootPath = path.resolve(__dirname, "..", "..");

module.exports = {
  port: Number(process.env.PORT) || 3000,
  rootPath,
  publicPath: path.join(rootPath, "public"),
  dataPath: path.join(rootPath, "server", "data")
};
