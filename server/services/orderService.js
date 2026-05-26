const cartService = require("./cartService");
const orderRepository = require("../repositories/orderRepository");

const taxRate = 0.075;
const maxSavings = 48.5;

function createHttpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
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

function getRequiredString(payload, fieldName, label) {
  const value = payload && typeof payload[fieldName] === "string" ? payload[fieldName].trim() : "";

  if (!value) {
    throw createHttpError(label + " is required.", 400);
  }

  return value;
}

function getShippingForDeliveryOption(deliveryOption) {
  return deliveryOption === "priority" ? 8.99 : 0;
}

function createOrderId(createdAt) {
  const date = new Date(createdAt);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const time = String(date.getHours()).padStart(2, "0") + String(date.getMinutes()).padStart(2, "0") + String(date.getSeconds()).padStart(2, "0");
  const suffix = Math.floor(100 + Math.random() * 900);

  return "SL-" + year + month + day + "-" + time + suffix;
}

function normalizeStatus(status) {
  return typeof status === "string" && status.trim() ? status.trim().toLowerCase() : "processing";
}

function validateCheckoutPayload(payload) {
  return {
    customerName: getRequiredString(payload, "customerName", "Customer name"),
    phone: getRequiredString(payload, "phone", "Phone"),
    shippingAddress: getRequiredString(payload, "shippingAddress", "Shipping address"),
    city: getRequiredString(payload, "city", "City"),
    state: getRequiredString(payload, "state", "State"),
    zip: getRequiredString(payload, "zip", "ZIP code"),
    deliveryOption: getRequiredString(payload, "deliveryOption", "Delivery option"),
    paymentMethod: getRequiredString(payload, "paymentMethod", "Payment method")
  };
}

function buildOrderItems(cartItems) {
  return cartItems.map(function (item) {
    const product = item.product || {};

    return {
      productId: Number(item.productId),
      title: product.title || "ShopLite product",
      price: roundMoney(item.unitPrice || product.price || 0),
      quantity: Number(item.quantity) || 1,
      image: product.image || "",
      category: product.category || "general"
    };
  });
}

function buildOrderSummary(cartItems, deliveryOption) {
  const subtotal = roundMoney(cartItems.reduce(function (total, item) {
    return total + Number(item.lineTotal || 0);
  }, 0));
  const shipping = getShippingForDeliveryOption(deliveryOption);
  const tax = roundMoney(subtotal * taxRate);
  const savings = subtotal > 0 ? Math.min(maxSavings, subtotal) : 0;
  const total = Math.max(0, subtotal + shipping + tax - savings);
  const itemCount = cartItems.reduce(function (count, item) {
    return count + (Number(item.quantity) || 1);
  }, 0);

  return {
    subtotal: roundMoney(subtotal),
    shipping: roundMoney(shipping),
    tax: roundMoney(tax),
    savings: roundMoney(savings),
    total: roundMoney(total),
    itemCount
  };
}

function sortNewestFirst(orders) {
  return orders.slice().sort(function (a, b) {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

async function getOrders(userId) {
  return {
    data: sortNewestFirst(await orderRepository.getOrdersByUserId(requireUserId(userId)))
  };
}

async function getOrderById(userId, orderId) {
  return orderRepository.getOrderByIdForUser(orderId, requireUserId(userId));
}

async function createOrder(userId, payload) {
  const normalizedUserId = requireUserId(userId);
  const checkout = validateCheckoutPayload(payload);
  const cart = await cartService.getCart(normalizedUserId);

  if (!cart.items || cart.items.length === 0) {
    throw createHttpError("Cannot create an order from an empty cart.", 400);
  }

  const createdAt = new Date().toISOString();
  const order = {
    id: createOrderId(createdAt),
    userId: normalizedUserId,
    createdAt,
    status: "processing",
    customerName: checkout.customerName,
    phone: checkout.phone,
    shippingAddress: checkout.shippingAddress,
    city: checkout.city,
    state: checkout.state,
    zip: checkout.zip,
    deliveryOption: checkout.deliveryOption,
    paymentMethod: checkout.paymentMethod,
    items: buildOrderItems(cart.items),
    summary: buildOrderSummary(cart.items, checkout.deliveryOption)
  };

  await orderRepository.createOrderForUser(order);
  await cartService.clearCart(normalizedUserId);

  return {
    data: order
  };
}

module.exports = {
  createOrder,
  getOrderById,
  getOrders,
  normalizeStatus
};
