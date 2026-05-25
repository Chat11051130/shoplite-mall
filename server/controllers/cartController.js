const cartService = require("../services/cartService");

async function getCart(req, res, next) {
  try {
    return res.json(await cartService.getCart());
  } catch (error) {
    return next(error);
  }
}

async function addItem(req, res, next) {
  try {
    return res.status(201).json(await cartService.addItem(req.body));
  } catch (error) {
    return next(error);
  }
}

async function updateItem(req, res, next) {
  try {
    return res.json(await cartService.updateItem(req.params.productId, req.body));
  } catch (error) {
    return next(error);
  }
}

async function removeItem(req, res, next) {
  try {
    return res.json(await cartService.removeItem(req.params.productId));
  } catch (error) {
    return next(error);
  }
}

async function clearCart(req, res, next) {
  try {
    return res.json(await cartService.clearCart());
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  addItem,
  clearCart,
  getCart,
  removeItem,
  updateItem
};
