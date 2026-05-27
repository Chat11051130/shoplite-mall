const { getPool } = require("../database/database");

function createCartId(userId) {
  return "cart-" + userId;
}

function createCartItemId(cartId, productId) {
  return "cart-item-" + cartId + "-" + productId;
}

function normalizeProductId(value) {
  const productId = Number(value);
  return Number.isInteger(productId) && productId > 0 ? productId : null;
}

function normalizeQuantity(value) {
  const quantity = Number(value);
  return Number.isInteger(quantity) && quantity >= 1 ? quantity : null;
}

function emptyCart(cartRow) {
  return {
    id: cartRow.id,
    userId: cartRow.user_id,
    items: []
  };
}

function rowsToCarts(rows) {
  const cartsById = {};

  rows.forEach(function (row) {
    if (!cartsById[row.id]) {
      cartsById[row.id] = emptyCart(row);
    }

    if (row.product_id !== null && row.product_id !== undefined) {
      cartsById[row.id].items.push({
        productId: Number(row.product_id),
        quantity: normalizeQuantity(row.quantity) || 1
      });
    }
  });

  return Object.keys(cartsById).map(function (cartId) {
    return cartsById[cartId];
  });
}

async function findAll() {
  const [rows] = await getPool().query(
    [
      "SELECT c.id, c.user_id, ci.product_id, ci.quantity",
      "FROM carts c",
      "LEFT JOIN cart_items ci ON ci.cart_id = c.id",
      "ORDER BY c.created_at ASC, ci.created_at ASC"
    ].join(" ")
  );

  return rowsToCarts(rows);
}

async function loadCartById(cartId) {
  const [rows] = await getPool().execute(
    [
      "SELECT c.id, c.user_id, ci.product_id, ci.quantity",
      "FROM carts c",
      "LEFT JOIN cart_items ci ON ci.cart_id = c.id",
      "WHERE c.id = ?",
      "ORDER BY ci.created_at ASC"
    ].join(" "),
    [cartId]
  );

  return rows.length ? rowsToCarts(rows)[0] : null;
}

async function getCartByUserId(userId) {
  if (!userId) {
    return null;
  }

  const [cartRows] = await getPool().execute(
    "SELECT id FROM carts WHERE user_id = ? LIMIT 1",
    [userId]
  );

  if (!cartRows.length) {
    return null;
  }

  return loadCartById(cartRows[0].id);
}

async function createCartForUser(userId) {
  const cartId = createCartId(userId);
  const now = new Date();

  await getPool().execute(
    [
      "INSERT INTO carts (id, user_id, created_at, updated_at)",
      "VALUES (?, ?, ?, ?)",
      "ON DUPLICATE KEY UPDATE updated_at = updated_at"
    ].join(" "),
    [cartId, userId, now, null]
  );

  return getCartByUserId(userId);
}

async function getOrCreateCartForUser(userId) {
  const existingCart = await getCartByUserId(userId);

  if (existingCart) {
    return existingCart;
  }

  return createCartForUser(userId);
}

async function replaceCartItems(connection, cart) {
  const now = new Date();
  const items = Array.isArray(cart.items) ? cart.items : [];

  await connection.execute("DELETE FROM cart_items WHERE cart_id = ?", [cart.id]);

  for (const item of items) {
    const productId = normalizeProductId(item.productId);
    const quantity = normalizeQuantity(item.quantity);

    if (!productId || !quantity) {
      continue;
    }

    await connection.execute(
      [
        "INSERT INTO cart_items",
        "(id, cart_id, product_id, quantity, created_at, updated_at)",
        "VALUES (?, ?, ?, ?, ?, ?)"
      ].join(" "),
      [
        createCartItemId(cart.id, productId),
        cart.id,
        productId,
        quantity,
        now,
        null
      ]
    );
  }
}

async function saveCart(cart) {
  const pool = getPool();
  const connection = await pool.getConnection();
  const cartId = cart.id || createCartId(cart.userId);

  try {
    await connection.beginTransaction();
    await connection.execute(
      [
        "INSERT INTO carts (id, user_id, created_at, updated_at)",
        "VALUES (?, ?, ?, ?)",
        "ON DUPLICATE KEY UPDATE updated_at = VALUES(updated_at)"
      ].join(" "),
      [cartId, cart.userId, new Date(), new Date()]
    );
    await replaceCartItems(connection, {
      id: cartId,
      userId: cart.userId,
      items: cart.items
    });
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return loadCartById(cartId);
}

async function clearCartForUser(userId) {
  const cart = await getOrCreateCartForUser(userId);

  await getPool().execute("DELETE FROM cart_items WHERE cart_id = ?", [cart.id]);

  return loadCartById(cart.id);
}

async function removeItemForUser(userId, productId) {
  const cart = await getOrCreateCartForUser(userId);
  const normalizedProductId = normalizeProductId(productId);

  if (normalizedProductId) {
    await getPool().execute(
      "DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?",
      [cart.id, normalizedProductId]
    );
  }

  return loadCartById(cart.id);
}

async function updateItemQuantityForUser(userId, productId, quantity) {
  const cart = await getOrCreateCartForUser(userId);
  const normalizedProductId = normalizeProductId(productId);
  const normalizedQuantity = normalizeQuantity(quantity);

  if (!normalizedProductId || !normalizedQuantity) {
    return null;
  }

  const [result] = await getPool().execute(
    [
      "UPDATE cart_items",
      "SET quantity = ?, updated_at = ?",
      "WHERE cart_id = ? AND product_id = ?"
    ].join(" "),
    [normalizedQuantity, new Date(), cart.id, normalizedProductId]
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return loadCartById(cart.id);
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
