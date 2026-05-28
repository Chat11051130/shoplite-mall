const { getPool } = require("../database/database");

const orderSelectColumns = [
  "o.id AS order_id",
  "o.user_id",
  "o.status",
  "o.customer_name",
  "o.phone",
  "o.shipping_address",
  "o.city",
  "o.state",
  "o.zip",
  "o.delivery_option",
  "o.payment_method",
  "o.subtotal",
  "o.shipping",
  "o.tax",
  "o.savings",
  "o.total",
  "o.item_count",
  "o.created_at AS order_created_at",
  "o.updated_at AS order_updated_at",
  "oi.id AS item_id",
  "oi.order_id AS item_order_id",
  "oi.product_id",
  "oi.title AS item_title",
  "oi.category AS item_category",
  "oi.image AS item_image",
  "oi.alt AS item_alt",
  "oi.unit_price",
  "oi.quantity",
  "oi.line_total"
];

function dateToIso(value) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toMysqlDate(value) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function integerOrZero(value) {
  const number = Number(value);
  return Number.isInteger(number) ? number : 0;
}

function optionalString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function requiredString(value, fallback) {
  return optionalString(value) || fallback;
}

function normalizeProductId(value) {
  const productId = Number(value);
  return Number.isInteger(productId) && productId > 0 ? productId : null;
}

function createOrderItemId(orderId, index) {
  return "order-item-" + orderId + "-" + (index + 1);
}

function summaryFromOrder(order) {
  const summary = order.summary || {};

  return {
    subtotal: numberOrZero(summary.subtotal !== undefined ? summary.subtotal : order.subtotal),
    shipping: numberOrZero(summary.shipping !== undefined ? summary.shipping : order.shipping),
    tax: numberOrZero(summary.tax !== undefined ? summary.tax : order.tax),
    savings: numberOrZero(summary.savings !== undefined ? summary.savings : order.savings),
    total: numberOrZero(summary.total !== undefined ? summary.total : order.total),
    itemCount: integerOrZero(summary.itemCount !== undefined ? summary.itemCount : order.itemCount)
  };
}

function emptyOrder(row) {
  const summary = {
    subtotal: numberOrZero(row.subtotal),
    shipping: numberOrZero(row.shipping),
    tax: numberOrZero(row.tax),
    savings: numberOrZero(row.savings),
    total: numberOrZero(row.total),
    itemCount: integerOrZero(row.item_count)
  };

  return {
    id: row.order_id,
    userId: row.user_id,
    status: row.status || "processing",
    customerName: row.customer_name || "",
    phone: row.phone || "",
    shippingAddress: row.shipping_address || "",
    city: row.city || "",
    state: row.state || "",
    zip: row.zip || "",
    deliveryOption: row.delivery_option || "",
    paymentMethod: row.payment_method || "",
    subtotal: summary.subtotal,
    shipping: summary.shipping,
    tax: summary.tax,
    savings: summary.savings,
    total: summary.total,
    itemCount: summary.itemCount,
    summary,
    items: [],
    createdAt: dateToIso(row.order_created_at),
    updatedAt: dateToIso(row.order_updated_at)
  };
}

function rowToItem(row) {
  const unitPrice = numberOrZero(row.unit_price);
  const quantity = integerOrZero(row.quantity) || 1;
  const lineTotal = numberOrZero(row.line_total);

  return {
    id: row.item_id,
    orderId: row.item_order_id,
    productId: row.product_id === null || row.product_id === undefined ? null : Number(row.product_id),
    title: row.item_title || "ShopLite product",
    category: row.item_category || "",
    image: row.item_image || "",
    alt: row.item_alt || row.item_title || "ShopLite product",
    unitPrice,
    price: unitPrice,
    quantity,
    lineTotal
  };
}

function rowsToOrders(rows) {
  const ordersById = {};
  const orderIds = [];

  rows.forEach(function (row) {
    if (!ordersById[row.order_id]) {
      ordersById[row.order_id] = emptyOrder(row);
      orderIds.push(row.order_id);
    }

    if (row.item_id) {
      ordersById[row.order_id].items.push(rowToItem(row));
    }
  });

  return orderIds.map(function (orderId) {
    return ordersById[orderId];
  });
}

async function selectOrders(whereClause, params) {
  const sql = [
    "SELECT " + orderSelectColumns.join(", "),
    "FROM orders o",
    "LEFT JOIN order_items oi ON oi.order_id = o.id",
    whereClause || "",
    "ORDER BY o.created_at DESC, oi.id ASC"
  ].filter(Boolean).join(" ");
  const [rows] = await getPool().execute(sql, params || []);

  return rowsToOrders(rows);
}

async function findAll() {
  return selectOrders("", []);
}

async function findById(orderId) {
  const orders = await selectOrders("WHERE o.id = ?", [orderId]);
  return orders[0] || null;
}

async function getOrdersByUserId(userId) {
  return selectOrders("WHERE o.user_id = ?", [userId]);
}

async function getAllOrders() {
  return findAll();
}

async function getOrderById(orderId) {
  return findById(orderId);
}

async function getOrderByIdForUser(orderId, userId) {
  const orders = await selectOrders("WHERE o.id = ? AND o.user_id = ?", [orderId, userId]);
  return orders[0] || null;
}

async function insertOrder(connection, order) {
  const summary = summaryFromOrder(order);

  await connection.execute(
    [
      "INSERT INTO orders",
      "(id, user_id, status, customer_name, phone, shipping_address, city, state, zip, delivery_option, payment_method, subtotal, shipping, tax, savings, total, item_count, created_at, updated_at)",
      "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ].join(" "),
    [
      requiredString(order.id, "SL-order"),
      requiredString(order.userId, ""),
      requiredString(order.status, "processing"),
      requiredString(order.customerName, "ShopLite customer"),
      requiredString(order.phone, "555-0100"),
      requiredString(order.shippingAddress, "ShopLite address"),
      requiredString(order.city, "Sample City"),
      requiredString(order.state, "Sample State"),
      requiredString(order.zip, "00000"),
      requiredString(order.deliveryOption, "standard"),
      requiredString(order.paymentMethod, "mock-card"),
      summary.subtotal,
      summary.shipping,
      summary.tax,
      summary.savings,
      summary.total,
      summary.itemCount,
      toMysqlDate(order.createdAt),
      order.updatedAt ? toMysqlDate(order.updatedAt) : null
    ]
  );
}

async function insertOrderItems(connection, order) {
  const items = Array.isArray(order.items) ? order.items : [];

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const productId = normalizeProductId(item.productId);
    const quantity = integerOrZero(item.quantity) || 1;
    const unitPrice = numberOrZero(item.unitPrice !== undefined ? item.unitPrice : item.price);
    const lineTotal = numberOrZero(item.lineTotal !== undefined ? item.lineTotal : unitPrice * quantity);

    await connection.execute(
      [
        "INSERT INTO order_items",
        "(id, order_id, product_id, title, category, image, alt, unit_price, quantity, line_total)",
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ].join(" "),
      [
        item.id || createOrderItemId(order.id, index),
        order.id,
        productId,
        requiredString(item.title, "ShopLite product"),
        optionalString(item.category),
        optionalString(item.image),
        optionalString(item.alt || item.title),
        unitPrice,
        quantity,
        lineTotal
      ]
    );
  }
}

async function create(order) {
  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await insertOrder(connection, order);
    await insertOrderItems(connection, order);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return findById(order.id);
}

async function createOrderForUser(orderInput) {
  return create(orderInput);
}

async function saveAll(orders) {
  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await connection.query("DELETE FROM order_items");
    await connection.query("DELETE FROM orders");

    for (const order of Array.isArray(orders) ? orders : []) {
      await insertOrder(connection, order);
      await insertOrderItems(connection, order);
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return findAll();
}

async function updateOrderStatus(orderId, status) {
  const updatedAt = new Date();
  const [result] = await getPool().execute(
    "UPDATE orders SET status = ?, updated_at = ? WHERE id = ?",
    [status, updatedAt, orderId]
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return findById(orderId);
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
