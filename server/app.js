const express = require("express");
const cors = require("cors");
const path = require("path");
const { port, publicPath } = require("./config/serverConfig");
const productRoutes = require("./routes/productRoutes");
const notFoundHandler = require("./middleware/notFoundHandler");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", function (req, res) {
  res.sendFile(path.join(publicPath, "index.html"));
});

app.use(express.static(publicPath));
app.use("/api/products", productRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

if (require.main === module) {
  app.listen(port, function () {
    console.log("ShopLite server is running on port " + port);
  });
}

module.exports = app;
