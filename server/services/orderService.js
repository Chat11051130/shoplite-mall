const cartService = require("./cartService");
const orderRepository = require("../repositories/orderRepository");

const taxRate = 0.075;
const maxSavings = 48.5;
const allowedAdminStatuses = ["processing", "shipped", "delivered", "cancelled"];

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

function normalizeAdminFilter(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function validateAdminStatus(status) {
  if (typeof status !== "string" || !status.trim()) {
    throw createHttpError("Status is required.", 400);
  }

  const normalizedStatus = normalizeStatus(status);

  if (allowedAdminStatuses.indexOf(normalizedStatus) === -1) {
    throw createHttpError("Status must be one of: " + allowedAdminStatuses.join(", ") + ".", 400);
  }

  return normalizedStatus;
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
    const quantity = Number(item.quantity) || 1;
    const unitPrice = roundMoney(item.unitPrice || product.price || 0);

    return {
      productId: Number(item.productId),
      title: product.title || "ShopLite product",
      price: unitPrice,
      unitPrice,
      quantity,
      image: product.image || "",
      alt: product.alt || product.title || "ShopLite product",
      category: product.category || "general",
      lineTotal: roundMoney(unitPrice * quantity)
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

function orderSearchText(order) {
  return [
    order.id,
    order.customerName,
    order.email,
    order.customerEmail,
    order.status,
    (order.items || []).map(function (item) {
      return item.title;
    }).join(" ")
  ].filter(Boolean).join(" ").toLowerCase();
}

function orderDateValue(order) {
  if (!order.createdAt) {
    return "";
  }

  return String(order.createdAt).slice(0, 10);
}

function filterAdminOrders(orders, query) {
  const status = normalizeAdminFilter(query && query.status);
  const searchQuery = normalizeAdminFilter(query && query.query);
  const date = typeof (query && query.date) === "string" ? query.date.trim() : "";

  return orders.filter(function (order) {
    const orderStatus = normalizeStatus(order.status);
    const statusMatches = !status || status === "all" || orderStatus === status;
    const queryMatches = !searchQuery || orderSearchText(order).indexOf(searchQuery) !== -1;
    const dateMatches = !date || orderDateValue(order) === date;

    return statusMatches && queryMatches && dateMatches;
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

async function getAdminOrders(query) {
  const orders = sortNewestFirst(filterAdminOrders(await orderRepository.getAllOrders(), query || {}));

  return {
    data: orders,
    meta: {
      count: orders.length
    }
  };
}

async function getAdminOrderById(orderId) {
  return orderRepository.getOrderById(orderId);
}

async function updateAdminOrderStatus(orderId, payload) {
  const status = validateAdminStatus(payload && payload.status);
  const order = await orderRepository.updateOrderStatus(orderId, status);

  if (!order) {
    return null;
  }

  return order;
}

module.exports = {
  createOrder,
  getAdminOrderById,
  getAdminOrders,
  getOrderById,
  getOrders,
  normalizeStatus,
  updateAdminOrderStatus
};
