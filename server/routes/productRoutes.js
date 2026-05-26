const express = require("express");
const productController = require("../controllers/productController");
const requireRole = require("../middleware/requireRole");

const router = express.Router();

router.get("/", productController.getProducts);
router.get("/:id", productController.getProductById);
router.post("/", requireRole("admin"), productController.createProduct);
router.patch("/:id", requireRole("admin"), productController.updateProduct);
router.delete("/:id", requireRole("admin"), productController.deleteProduct);

module.exports = router;
