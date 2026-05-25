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

async function create(order) {
  const orders = await findAll();
  orders.push(order);
  await saveAll(orders);
  return order;
}

module.exports = {
  create,
  findAll,
  findById,
  saveAll
};
