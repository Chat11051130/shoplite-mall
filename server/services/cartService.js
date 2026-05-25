const cartRepository = require("../repositories/cartRepository");
const productRepository = require("../repositories/productRepository");

const shippingFee = 6.99;
const maxSavings = 48.5;

function createHttpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeProductId(value) {
  const productId = Number(value);
  return Number.isInteger(productId) && productId > 0 ? productId : null;
}

function normalizeQuantity(value) {
  const quantity = Number(value);
  return Number.isInteger(quantity) && quantity >= 1 ? quantity : null;
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function requireUserId(userId) {
  if (!userId) {
    throw createHttpError("Authentication required.", 401);
  }

  return userId;
}

async function getProductOrThrow(productId) {
  const normalizedProductId = normalizeProductId(productId);

  if (!normalizedProductId) {
    throw createHttpError("A valid productId is required.", 400);
  }

  const product = await productRepository.findById(normalizedProductId);

  if (!product) {
    throw createHttpError("Product not found.", 404);
  }

  return product;
}

async function enrichCart(cart) {
  const products = await Promise.all(cart.items.map(function (item) {
    return productRepository.findById(item.productId);
  }));

  const items = cart.items.map(function (item, index) {
    const product = products[index];

    if (!product) {
      return null;
    }

    const quantity = normalizeQuantity(item.quantity) || 1;
    const unitPrice = Number(product.price) || 0;

    return {
      productId: Number(product.id),
      quantity,
      unitPrice,
      lineTotal: roundMoney(unitPrice * quantity),
      product
    };
  }).filter(Boolean);

  const subtotal = roundMoney(items.reduce(function (total, item) {
    return total + item.lineTotal;
  }, 0));
  const shipping = subtotal === 0 || subtotal >= 35 ? 0 : shippingFee;
  const savings = subtotal > 0 ? Math.min(maxSavings, subtotal) : 0;
  const total = Math.max(0, subtotal + shipping - savings);
  const itemCount = items.reduce(function (count, item) {
    return count + item.quantity;
  }, 0);

  return {
    id: cart.id,
    userId: cart.userId,
    items,
    summary: {
      subtotal: roundMoney(subtotal),
      shipping: roundMoney(shipping),
      savings: roundMoney(savings),
      total: roundMoney(total),
      itemCount
    }
  };
}

async function getCart(userId) {
  return enrichCart(await cartRepository.getOrCreateCartForUser(requireUserId(userId)));
}

async function addItem(userId, payload) {
  const normalizedUserId = requireUserId(userId);
  const product = await getProductOrThrow(payload && payload.productId);
  const quantity = normalizeQuantity(payload && payload.quantity) || 1;
  const cart = await cartRepository.getOrCreateCartForUser(normalizedUserId);
  const existingItem = cart.items.find(function (item) {
    return Number(item.productId) === Number(product.id);
  });

  if (existingItem) {
    existingItem.quantity = (normalizeQuantity(existingItem.quantity) || 1) + quantity;
  } else {
    cart.items.push({
      productId: Number(product.id),
      quantity
    });
  }

  await cartRepository.saveCart(cart);
  return enrichCart(cart);
}

async function updateItem(userId, productId, payload) {
  const normalizedUserId = requireUserId(userId);
  const normalizedProductId = normalizeProductId(productId);
  const quantity = normalizeQuantity(payload && payload.quantity);

  if (!normalizedProductId) {
    throw createHttpError("A valid productId is required.", 400);
  }

  if (!quantity) {
    throw createHttpError("Quantity must be at least 1.", 400);
  }

  await getProductOrThrow(normalizedProductId);

  const cart = await cartRepository.updateItemQuantityForUser(normalizedUserId, normalizedProductId, quantity);

  if (!cart) {
    throw createHttpError("Cart item not found.", 404);
  }

  return enrichCart(cart);
}

async function removeItem(userId, productId) {
  const normalizedUserId = requireUserId(userId);
  const normalizedProductId = normalizeProductId(productId);

  if (!normalizedProductId) {
    throw createHttpError("A valid productId is required.", 400);
  }

  const cart = await cartRepository.removeItemForUser(normalizedUserId, normalizedProductId);
  return enrichCart(cart);
}

async function clearCart(userId) {
  return enrichCart(await cartRepository.clearCartForUser(requireUserId(userId)));
}

module.exports = {
  addItem,
  clearCart,
  getCart,
  removeItem,
  updateItem
};
