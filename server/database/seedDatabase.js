const path = require("path");
const { dataPath } = require("../config/serverConfig");
const { readJsonFile } = require("../utils/fileStore");
const { closePool, getPool } = require("./database");

const allowedCategories = ["electronics", "fashion", "home", "beauty", "grocery", "sports"];
const allowedStatuses = ["processing", "shipped", "delivered", "cancelled"];

function jsonPath(fileName) {
  return path.join(dataPath, fileName);
}

async function readJsonArray(fileName) {
  const data = await readJsonFile(jsonPath(fileName));
  return Array.isArray(data) ? data : [];
}

function toMysqlDateTime(value) {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) {
    return toMysqlDateTime();
  }

  return date.toISOString().slice(0, 19).replace("T", " ");
}

function optionalDateTime(value) {
  return value ? toMysqlDateTime(value) : null;
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

function normalizeCategory(category) {
  const normalizedCategory = typeof category === "string" ? category.trim().toLowerCase() : "";
  return allowedCategories.includes(normalizedCategory) ? normalizedCategory : "electronics";
}

function normalizeStatus(status) {
  const normalizedStatus = typeof status === "string" ? status.trim().toLowerCase() : "";
  return allowedStatuses.includes(normalizedStatus) ? normalizedStatus : "processing";
}

function jsonValue(value) {
  if (value === undefined || value === null) {
    return null;
  }

  return JSON.stringify(value);
}

function productMap(products) {
  return products.reduce(function (lookup, product) {
    lookup[String(product.id)] = product;
    return lookup;
  }, {});
}

function userMap(users) {
  return users.reduce(function (lookup, user) {
    lookup[user.id] = user;
    return lookup;
  }, {});
}

async function clearTables(connection) {
  await connection.query("DELETE FROM order_items");
  await connection.query("DELETE FROM orders");
  await connection.query("DELETE FROM cart_items");
  await connection.query("DELETE FROM carts");
  await connection.query("DELETE FROM products");
  await connection.query("DELETE FROM users");
}

async function seedUsers(connection, users) {
  for (const user of users) {
    await connection.execute(
      "INSERT INTO users (id, email, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      [
        requiredString(user.id, "user-seed"),
        requiredString(user.email, "seed@example.com").toLowerCase(),
        requiredString(user.passwordHash, ""),
        user.role === "admin" ? "admin" : "customer",
        toMysqlDateTime(user.createdAt),
        optionalDateTime(user.updatedAt)
      ]
    );
  }

  return users.length;
}

async function seedProducts(connection, products) {
  const now = toMysqlDateTime();

  for (const product of products) {
    const tag = optionalString(product.tag) || (Array.isArray(product.tags) && product.tags.length ? product.tags[0] : null);

    await connection.execute(
      [
        "INSERT INTO products",
        "(id, category, title, rating, reviews, price, old_price, discount, shipping, image, alt, stock, badge, tag, tags_json, short_description, details_json, highlights_json, created_at, updated_at)",
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ].join(" "),
      [
        Number(product.id),
        normalizeCategory(product.category),
        requiredString(product.title, "ShopLite product"),
        product.rating === undefined || product.rating === null ? null : numberOrZero(product.rating),
        integerOrZero(product.reviews),
        numberOrZero(product.price),
        product.oldPrice === undefined || product.oldPrice === null ? null : numberOrZero(product.oldPrice),
        optionalString(product.discount),
        optionalString(product.shipping),
        requiredString(product.image, ""),
        requiredString(product.alt, "ShopLite product"),
        integerOrZero(product.stock),
        optionalString(product.badge),
        optionalString(tag),
        jsonValue(Array.isArray(product.tags) ? product.tags : []),
        optionalString(product.shortDescription),
        jsonValue(product.details),
        jsonValue(product.highlights),
        toMysqlDateTime(product.createdAt || now),
        optionalDateTime(product.updatedAt)
      ]
    );
  }

  return products.length;
}

async function seedCarts(connection, carts, usersById, productsById) {
  const now = toMysqlDateTime();
  let cartCount = 0;
  let itemCount = 0;

  for (const cart of carts) {
    if (!cart.userId || !usersById[cart.userId]) {
      continue;
    }

    await connection.execute(
      "INSERT INTO carts (id, user_id, created_at, updated_at) VALUES (?, ?, ?, ?)",
      [
        requiredString(cart.id, "cart-" + cart.userId),
        cart.userId,
        toMysqlDateTime(cart.createdAt || now),
        optionalDateTime(cart.updatedAt)
      ]
    );
    cartCount += 1;

    for (const item of cart.items || []) {
      if (!productsById[String(item.productId)]) {
        continue;
      }

      await connection.execute(
        "INSERT INTO cart_items (id, cart_id, product_id, quantity, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
        [
          "cart-item-" + cart.id + "-" + item.productId,
          cart.id,
          Number(item.productId),
          Math.max(integerOrZero(item.quantity), 1),
          toMysqlDateTime(item.createdAt || now),
          optionalDateTime(item.updatedAt)
        ]
      );
      itemCount += 1;
    }
  }

  return {
    cartCount,
    itemCount
  };
}

async function seedOrders(connection, orders, users, productsById) {
  const fallbackUser = users[0] || null;
  let orderCount = 0;
  let itemCount = 0;

  for (const order of orders) {
    const userId = order.userId || (fallbackUser && fallbackUser.id);
    const summary = order.summary || {};

    if (!userId) {
      continue;
    }

    await connection.execute(
      [
        "INSERT INTO orders",
        "(id, user_id, status, customer_name, phone, shipping_address, city, state, zip, delivery_option, payment_method, subtotal, shipping, tax, savings, total, item_count, created_at, updated_at)",
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ].join(" "),
      [
        requiredString(order.id, "SL-seed-order"),
        userId,
        normalizeStatus(order.status),
        requiredString(order.customerName, "ShopLite customer"),
        requiredString(order.phone, "555-0100"),
        requiredString(order.shippingAddress, "ShopLite sample address"),
        requiredString(order.city, "Sample City"),
        requiredString(order.state, "Sample State"),
        requiredString(order.zip, "00000"),
        requiredString(order.deliveryOption, "standard"),
        requiredString(order.paymentMethod, "mock-card"),
        numberOrZero(summary.subtotal),
        numberOrZero(summary.shipping),
        numberOrZero(summary.tax),
        numberOrZero(summary.savings),
        numberOrZero(summary.total),
        integerOrZero(summary.itemCount),
        toMysqlDateTime(order.createdAt),
        optionalDateTime(order.updatedAt)
      ]
    );
    orderCount += 1;

    for (const item of order.items || []) {
      const product = productsById[String(item.productId)] || {};
      const quantity = Math.max(integerOrZero(item.quantity), 1);
      const unitPrice = numberOrZero(item.unitPrice !== undefined ? item.unitPrice : item.price);

      await connection.execute(
        [
          "INSERT INTO order_items",
          "(id, order_id, product_id, title, category, image, alt, unit_price, quantity, line_total)",
          "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        ].join(" "),
        [
          "order-item-" + order.id + "-" + (itemCount + 1),
          order.id,
          productsById[String(item.productId)] ? Number(item.productId) : null,
          requiredString(item.title, product.title || "ShopLite product"),
          optionalString(item.category || product.category),
          optionalString(item.image || product.image),
          optionalString(item.alt || product.alt),
          unitPrice,
          quantity,
          numberOrZero(item.lineTotal !== undefined ? item.lineTotal : unitPrice * quantity)
        ]
      );
      itemCount += 1;
    }
  }

  return {
    itemCount,
    orderCount
  };
}

async function seedDatabase() {
  const products = await readJsonArray("products.json");
  const users = await readJsonArray("users.json");
  const carts = await readJsonArray("carts.json");
  const orders = await readJsonArray("orders.json");
  const connection = await getPool().getConnection();
  const usersById = userMap(users);
  const productsById = productMap(products);

  try {
    await connection.beginTransaction();
    await clearTables(connection);

    const userCount = await seedUsers(connection, users);
    const productCount = await seedProducts(connection, products);
    const cartResult = await seedCarts(connection, carts, usersById, productsById);
    const orderResult = await seedOrders(connection, orders, users, productsById);

    await connection.commit();

    console.log("Database seed complete.");
    console.log("Users: " + userCount);
    console.log("Products: " + productCount);
    console.log("Carts: " + cartResult.cartCount);
    console.log("Cart items: " + cartResult.itemCount);
    console.log("Orders: " + orderResult.orderCount);
    console.log("Order items: " + orderResult.itemCount);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function main() {
  try {
    await seedDatabase();
  } finally {
    await closePool();
  }
}

if (require.main === module) {
  main().catch(function (error) {
    console.error("Database seed failed:", error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  seedDatabase
};
