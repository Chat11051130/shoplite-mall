const express = require("express");
const cors = require("cors");
const session = require("express-session");
const path = require("path");
const { port, publicPath } = require("./config/serverConfig");
const adminDashboardRoutes = require("./routes/adminDashboardRoutes");
const authRoutes = require("./routes/authRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const productRoutes = require("./routes/productRoutes");
const notFoundHandler = require("./middleware/notFoundHandler");
const errorHandler = require("./middleware/errorHandler");
const requireRole = require("./middleware/requireRole");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  name: "shoplite.sid",
  secret: process.env.SESSION_SECRET || "shoplite-development-session-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 1000 * 60 * 60 * 2
  }
}));

app.get("/", function (req, res) {
  res.sendFile(path.join(publicPath, "index.html"));
});

app.get([
  "/admin-products.html",
  "/admin-product-form.html",
  "/admin-orders.html",
  "/admin-dashboard.html"
], requireRole("admin"), function (req, res) {
  res.sendFile(path.join(publicPath, path.basename(req.path)));
});

app.use(express.static(publicPath));
app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/admin/orders", orderRoutes.adminRouter);
app.use("/api/orders", orderRoutes);
app.use("/api/products", productRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

if (require.main === module) {
  app.listen(port, function () {
    console.log("ShopLite server is running on port " + port);
  });
}

module.exports = app;
