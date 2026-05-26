const adminDashboardService = require("../services/adminDashboardService");

async function getSummary(req, res, next) {
  try {
    return res.json(await adminDashboardService.getSummary());
  } catch (error) {
    return next(error);
  }
}

async function getCategorySales(req, res, next) {
  try {
    return res.json(await adminDashboardService.getCategorySales());
  } catch (error) {
    return next(error);
  }
}

async function getOrderStatus(req, res, next) {
  try {
    return res.json(await adminDashboardService.getOrderStatus());
  } catch (error) {
    return next(error);
  }
}

async function getRecentOrders(req, res, next) {
  try {
    return res.json(await adminDashboardService.getRecentOrders(req.query));
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getCategorySales,
  getOrderStatus,
  getRecentOrders,
  getSummary
};
