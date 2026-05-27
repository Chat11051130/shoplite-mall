const { getPool } = require("../database/database");

const productColumns = [
  "id",
  "category",
  "title",
  "rating",
  "reviews",
  "price",
  "old_price",
  "discount",
  "shipping",
  "image",
  "alt",
  "stock",
  "badge",
  "tag",
  "tags_json",
  "short_description",
  "details_json",
  "highlights_json",
  "created_at",
  "updated_at"
];

const fieldColumnMap = {
  category: "category",
  title: "title",
  rating: "rating",
  reviews: "reviews",
  price: "price",
  oldPrice: "old_price",
  discount: "discount",
  shipping: "shipping",
  image: "image",
  alt: "alt",
  stock: "stock",
  badge: "badge",
  tag: "tag",
  tags: "tags_json",
  shortDescription: "short_description",
  details: "details_json",
  highlights: "highlights_json"
};

function createHttpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function parseJsonColumn(value, fallback) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function toMysqlJson(value) {
  if (value === undefined) {
    return undefined;
  }

  return JSON.stringify(value === null ? null : value);
}

function dateToIso(value) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function rowToProduct(row) {
  if (!row) {
    return null;
  }

  return {
    id: Number(row.id),
    category: row.category,
    title: row.title,
    rating: row.rating === null || row.rating === undefined ? 0 : Number(row.rating),
    reviews: row.reviews === null || row.reviews === undefined ? 0 : Number(row.reviews),
    price: Number(row.price),
    oldPrice: row.old_price === null || row.old_price === undefined ? 0 : Number(row.old_price),
    discount: row.discount || "",
    shipping: row.shipping || "",
    image: row.image,
    alt: row.alt,
    stock: row.stock === null || row.stock === undefined ? 0 : Number(row.stock),
    badge: row.badge || "",
    tag: row.tag || "",
    tags: parseJsonColumn(row.tags_json, []),
    shortDescription: row.short_description || "",
    details: parseJsonColumn(row.details_json, {}),
    highlights: parseJsonColumn(row.highlights_json, []),
    createdAt: dateToIso(row.created_at),
    updatedAt: dateToIso(row.updated_at)
  };
}

function valuesForProduct(product, id) {
  const now = new Date();

  return [
    id,
    product.category,
    product.title,
    product.rating === undefined ? 0 : product.rating,
    product.reviews === undefined ? 0 : product.reviews,
    product.price,
    product.oldPrice === undefined ? 0 : product.oldPrice,
    product.discount || null,
    product.shipping || null,
    product.image,
    product.alt,
    product.stock === undefined ? 0 : product.stock,
    product.badge || null,
    product.tag || null,
    toMysqlJson(Array.isArray(product.tags) ? product.tags : []),
    product.shortDescription || null,
    toMysqlJson(product.details || {}),
    toMysqlJson(Array.isArray(product.highlights) ? product.highlights : []),
    now,
    null
  ];
}

function columnValueForField(fieldName, value) {
  if (fieldName === "tags" || fieldName === "details" || fieldName === "highlights") {
    return toMysqlJson(value);
  }

  return value === "" ? null : value;
}

async function findAll() {
  const [rows] = await getPool().query(
    "SELECT " + productColumns.join(", ") + " FROM products ORDER BY id ASC"
  );

  return rows.map(rowToProduct);
}

async function findById(productId) {
  const normalizedId = Number(productId);

  if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
    return null;
  }

  const [rows] = await getPool().execute(
    "SELECT " + productColumns.join(", ") + " FROM products WHERE id = ? LIMIT 1",
    [normalizedId]
  );

  return rowToProduct(rows[0]);
}

async function nextProductId(connection) {
  const [rows] = await connection.query("SELECT id FROM products ORDER BY id DESC LIMIT 1 FOR UPDATE");
  return rows.length ? Number(rows[0].id) + 1 : 1;
}

async function createProduct(productInput) {
  const pool = getPool();
  const connection = await pool.getConnection();
  let productId = Number(productInput.id);

  try {
    await connection.beginTransaction();

    if (!Number.isInteger(productId) || productId <= 0) {
      productId = await nextProductId(connection);
    }

    await connection.execute(
      [
        "INSERT INTO products",
        "(" + productColumns.join(", ") + ")",
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ].join(" "),
      valuesForProduct(productInput, productId)
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return findById(productId);
}

async function updateProduct(productId, updates) {
  const normalizedId = Number(productId);
  const fieldNames = Object.keys(updates || {}).filter(function (fieldName) {
    return Object.prototype.hasOwnProperty.call(fieldColumnMap, fieldName);
  });

  if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
    return null;
  }

  if (!fieldNames.length) {
    return findById(normalizedId);
  }

  const assignments = fieldNames.map(function (fieldName) {
    const columnName = fieldColumnMap[fieldName];
    return columnName + " = ?";
  });
  const values = fieldNames.map(function (fieldName) {
    return columnValueForField(fieldName, updates[fieldName]);
  });

  values.push(new Date(), normalizedId);

  const [result] = await getPool().execute(
    "UPDATE products SET " + assignments.join(", ") + ", updated_at = ? WHERE id = ?",
    values
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return findById(normalizedId);
}

async function deleteProduct(productId) {
  const existingProduct = await findById(productId);

  if (!existingProduct) {
    return null;
  }

  try {
    await getPool().execute("DELETE FROM products WHERE id = ?", [existingProduct.id]);
  } catch (error) {
    if (error && (error.code === "ER_ROW_IS_REFERENCED_2" || error.errno === 1451)) {
      throw createHttpError("Product cannot be deleted because it is referenced by carts or orders.", 409);
    }
    throw error;
  }

  return existingProduct;
}

async function getAllProducts() {
  return findAll();
}

async function getProductById(productId) {
  return findById(productId);
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
