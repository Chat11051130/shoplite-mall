const path = require("path");
const { dataPath } = require("../config/serverConfig");
const { readJsonFile } = require("../utils/fileStore");

const productsFilePath = path.join(dataPath, "products.json");

async function findAll() {
  const products = await readJsonFile(productsFilePath);
  return Array.isArray(products) ? products : [];
}

async function findById(productId) {
  const products = await findAll();
  const normalizedId = Number(productId);

  if (!Number.isFinite(normalizedId)) {
    return null;
  }

  return products.find(function (product) {
    return Number(product.id) === normalizedId;
  }) || null;
}

module.exports = {
  findAll,
  findById
};
