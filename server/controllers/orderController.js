const orderService = require("../services/orderService");

async function getOrders(req, res, next) {
  try {
    return res.json(await orderService.getOrders(req.session.userId));
  } catch (error) {
    return next(error);
  }
}

async function getOrderById(req, res, next) {
  try {
    const order = await orderService.getOrderById(req.session.userId, req.params.id);

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
    return res.status(201).json(await orderService.createOrder(req.session.userId, req.body));
  } catch (error) {
    return next(error);
  }
}

async function getAdminOrders(req, res, next) {
  try {
    return res.json(await orderService.getAdminOrders(req.query));
  } catch (error) {
    return next(error);
  }
}

async function getAdminOrderById(req, res, next) {
  try {
    const order = await orderService.getAdminOrderById(req.params.id);

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

async function updateAdminOrderStatus(req, res, next) {
  try {
    const order = await orderService.updateAdminOrderStatus(req.params.id, req.body);

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

module.exports = {
  createOrder,
  getAdminOrderById,
  getAdminOrders,
  getOrderById,
  getOrders,
  updateAdminOrderStatus
};
