const path = require("path");
const { dataPath } = require("../config/serverConfig");
const { readJsonFile, writeJsonFile } = require("../utils/fileStore");

const cartsFilePath = path.join(dataPath, "carts.json");

async function findAll() {
  const carts = await readJsonFile(cartsFilePath);
  return Array.isArray(carts) ? carts : [];
}

async function saveAll(carts) {
  return writeJsonFile(cartsFilePath, Array.isArray(carts) ? carts : []);
}

async function findById(cartId) {
  const carts = await findAll();
  return carts.find(function (cart) {
    return cart.id === cartId;
  }) || null;
}

async function save(cart) {
  const carts = await findAll();
  const existingIndex = carts.findIndex(function (candidate) {
    return candidate.id === cart.id;
  });

  if (existingIndex >= 0) {
    carts[existingIndex] = cart;
  } else {
    carts.push(cart);
  }

  await saveAll(carts);
  return cart;
}

module.exports = {
  findAll,
  findById,
  save
};
