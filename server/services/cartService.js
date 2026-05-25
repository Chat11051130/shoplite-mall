const cartRepository = require("../repositories/cartRepository");
const productRepository = require("../repositories/productRepository");

const demoCartId = "demo-cart";
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

async function getOrCreateDemoCart() {
  const existingCart = await cartRepository.findById(demoCartId);

  if (existingCart) {
    return {
      id: demoCartId,
      items: Array.isArray(existingCart.items) ? existingCart.items : []
    };
  }

  return cartRepository.save({
    id: demoCartId,
    items: []
  });
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

async function getCart() {
  return enrichCart(await getOrCreateDemoCart());
}

async function addItem(payload) {
  const product = await getProductOrThrow(payload && payload.productId);
  const quantity = normalizeQuantity(payload && payload.quantity) || 1;
  const cart = await getOrCreateDemoCart();
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

  await cartRepository.save(cart);
  return enrichCart(cart);
}

async function updateItem(productId, payload) {
  const normalizedProductId = normalizeProductId(productId);
  const quantity = normalizeQuantity(payload && payload.quantity);

  if (!normalizedProductId) {
    throw createHttpError("A valid productId is required.", 400);
  }

  if (!quantity) {
    throw createHttpError("Quantity must be at least 1.", 400);
  }

  await getProductOrThrow(normalizedProductId);

  const cart = await getOrCreateDemoCart();
  const existingItem = cart.items.find(function (item) {
    return Number(item.productId) === normalizedProductId;
  });

  if (!existingItem) {
    throw createHttpError("Cart item not found.", 404);
  }

  existingItem.quantity = quantity;
  await cartRepository.save(cart);
  return enrichCart(cart);
}

async function removeItem(productId) {
  const normalizedProductId = normalizeProductId(productId);

  if (!normalizedProductId) {
    throw createHttpError("A valid productId is required.", 400);
  }

  const cart = await getOrCreateDemoCart();
  cart.items = cart.items.filter(function (item) {
    return Number(item.productId) !== normalizedProductId;
  });

  await cartRepository.save(cart);
  return enrichCart(cart);
}

async function clearCart() {
  const cart = await getOrCreateDemoCart();
  cart.items = [];
  await cartRepository.save(cart);
  return enrichCart(cart);
}

module.exports = {
  addItem,
  clearCart,
  getCart,
  removeItem,
  updateItem
};
