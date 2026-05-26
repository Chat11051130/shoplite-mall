const express = require("express");
const adminDashboardController = require("../controllers/adminDashboardController");
const requireRole = require("../middleware/requireRole");

const router = express.Router();

router.use(requireRole("admin"));
router.get("/summary", adminDashboardController.getSummary);
router.get("/category-sales", adminDashboardController.getCategorySales);
router.get("/order-status", adminDashboardController.getOrderStatus);
router.get("/recent-orders", adminDashboardController.getRecentOrders);

module.exports = router;
