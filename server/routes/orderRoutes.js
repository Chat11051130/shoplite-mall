const express = require("express");
const orderController = require("../controllers/orderController");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

const router = express.Router();
const adminRouter = express.Router();

router.use(requireAuth);
router.get("/", orderController.getOrders);
router.get("/:id", orderController.getOrderById);
router.post("/", orderController.createOrder);

adminRouter.use(requireRole("admin"));
adminRouter.get("/", orderController.getAdminOrders);
adminRouter.get("/:id", orderController.getAdminOrderById);
adminRouter.patch("/:id/status", orderController.updateAdminOrderStatus);

module.exports = router;
module.exports.adminRouter = adminRouter;
