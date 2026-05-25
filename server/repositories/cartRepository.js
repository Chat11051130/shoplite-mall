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

function createCartId(userId) {
  return "cart-" + userId;
}

async function getCartByUserId(userId) {
  const carts = await findAll();
  return carts.find(function (cart) {
    return cart.userId === userId;
  }) || null;
}

async function createCartForUser(userId) {
  const cart = {
    id: createCartId(userId),
    userId,
    items: []
  };

  return saveCart(cart);
}

async function saveCart(cart) {
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

async function getOrCreateCartForUser(userId) {
  const existingCart = await getCartByUserId(userId);

  if (existingCart) {
    return {
      id: existingCart.id,
      userId: existingCart.userId,
      items: Array.isArray(existingCart.items) ? existingCart.items : []
    };
  }

  return createCartForUser(userId);
}

async function clearCartForUser(userId) {
  const cart = await getOrCreateCartForUser(userId);
  cart.items = [];
  return saveCart(cart);
}

async function removeItemForUser(userId, productId) {
  const cart = await getOrCreateCartForUser(userId);
  cart.items = cart.items.filter(function (item) {
    return Number(item.productId) !== Number(productId);
  });

  return saveCart(cart);
}

async function updateItemQuantityForUser(userId, productId, quantity) {
  const cart = await getOrCreateCartForUser(userId);
  const existingItem = cart.items.find(function (item) {
    return Number(item.productId) === Number(productId);
  });

  if (!existingItem) {
    return null;
  }

  existingItem.quantity = quantity;
  await saveCart(cart);
  return cart;
}

module.exports = {
  clearCartForUser,
  createCartForUser,
  findAll,
  getCartByUserId,
  getOrCreateCartForUser,
  removeItemForUser,
  saveCart,
  updateItemQuantityForUser
};
