const orderService = require("../services/orderService");

async function getOrders(req, res, next) {
  try {
    return res.json(await orderService.getOrders());
  } catch (error) {
    return next(error);
  }
}

async function getOrderById(req, res, next) {
  try {
    const order = await orderService.getOrderById(req.params.id);

    if (!order) {
      return res.status(404).json({
        error: {
          message: "Order not found",
          status: 404
        }
      });
    }

    return res.json({
      data: order
    });
  } catch (error) {
    return next(error);
  }
}

async function createOrder(req, res, next) {
  try {
    return res.status(201).json(await orderService.createOrder(req.body));
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createOrder,
  getOrderById,
  getOrders
};
