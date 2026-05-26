const path = require("path");
const { dataPath } = require("../config/serverConfig");
const { readJsonFile, writeJsonFile } = require("../utils/fileStore");

const ordersFilePath = path.join(dataPath, "orders.json");

async function findAll() {
  const orders = await readJsonFile(ordersFilePath);
  return Array.isArray(orders) ? orders : [];
}

async function saveAll(orders) {
  return writeJsonFile(ordersFilePath, Array.isArray(orders) ? orders : []);
}

async function findById(orderId) {
  const orders = await findAll();
  return orders.find(function (order) {
    return order.id === orderId;
  }) || null;
}

async function getOrdersByUserId(userId) {
  const orders = await findAll();
  return orders.filter(function (order) {
    return order.userId === userId;
  });
}

async function getAllOrders() {
  return findAll();
}

async function getOrderById(orderId) {
  return findById(orderId);
}

async function getOrderByIdForUser(orderId, userId) {
  const orders = await findAll();
  return orders.find(function (order) {
    return order.id === orderId && order.userId === userId;
  }) || null;
}

async function create(order) {
  const orders = await findAll();
  orders.push(order);
  await saveAll(orders);
  return order;
}

async function createOrderForUser(orderInput) {
  return create(orderInput);
}

async function updateOrderStatus(orderId, status) {
  const orders = await findAll();
  const index = orders.findIndex(function (order) {
    return order.id === orderId;
  });

  if (index === -1) {
    return null;
  }

  orders[index] = Object.assign({}, orders[index], {
    status,
    updatedAt: new Date().toISOString()
  });

  await saveAll(orders);
  return orders[index];
}

module.exports = {
  create,
  createOrderForUser,
  findAll,
  findById,
  getAllOrders,
  getOrderById,
  getOrderByIdForUser,
  getOrdersByUserId,
  saveAll,
  updateOrderStatus
};
