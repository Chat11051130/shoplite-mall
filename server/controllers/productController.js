const productService = require("../services/productService");

async function getProducts(req, res, next) {
  try {
    const result = await productService.getProducts(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function getProductById(req, res, next) {
  try {
    const product = await productService.getProductById(req.params.id);

    if (!product) {
      return res.status(404).json({
        error: {
          message: "Product not found",
          status: 404
        }
      });
    }

    return res.json({
      data: product
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getProducts,
  getProductById
};
