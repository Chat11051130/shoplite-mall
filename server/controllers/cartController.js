const cartService = require("../services/cartService");

async function getCart(req, res, next) {
  try {
    return res.json(await cartService.getCart(req.session.userId));
  } catch (error) {
    return next(error);
  }
}

async function addItem(req, res, next) {
  try {
    return res.status(201).json(await cartService.addItem(req.session.userId, req.body));
  } catch (error) {
    return next(error);
  }
}

async function updateItem(req, res, next) {
  try {
    return res.json(await cartService.updateItem(req.session.userId, req.params.productId, req.body));
  } catch (error) {
    return next(error);
  }
}

async function removeItem(req, res, next) {
  try {
    return res.json(await cartService.removeItem(req.session.userId, req.params.productId));
  } catch (error) {
    return next(error);
  }
}

async function clearCart(req, res, next) {
  try {
    return res.json(await cartService.clearCart(req.session.userId));
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
