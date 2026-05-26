const path = require("path");
const { dataPath } = require("../config/serverConfig");
const { readJsonFile, writeJsonFile } = require("../utils/fileStore");

const productsFilePath = path.join(dataPath, "products.json");

async function findAll() {
  const products = await readJsonFile(productsFilePath);
  return Array.isArray(products) ? products : [];
}

async function saveAll(products) {
  return writeJsonFile(productsFilePath, Array.isArray(products) ? products : []);
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

async function getAllProducts() {
  return findAll();
}

async function getProductById(productId) {
  return findById(productId);
}

async function createProduct(productInput) {
  const products = await findAll();
  products.push(productInput);
  await saveAll(products);
  return productInput;
}

async function updateProduct(productId, updates) {
  const products = await findAll();
  const normalizedId = Number(productId);
  const index = products.findIndex(function (product) {
    return Number(product.id) === normalizedId;
  });

  if (index === -1) {
    return null;
  }

  products[index] = Object.assign({}, products[index], updates, {
    id: products[index].id
  });

  await saveAll(products);
  return products[index];
}

async function deleteProduct(productId) {
  const products = await findAll();
  const normalizedId = Number(productId);
  const index = products.findIndex(function (product) {
    return Number(product.id) === normalizedId;
  });

  if (index === -1) {
    return null;
  }

  const deletedProduct = products.splice(index, 1)[0];
  await saveAll(products);
  return deletedProduct;
}

module.exports = {
  createProduct,
  deleteProduct,
  findAll,
  findById,
  getAllProducts,
  getProductById,
  updateProduct
};
