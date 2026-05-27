const productRepository = require("../repositories/productRepository");

const knownCategories = ["electronics", "fashion", "home", "beauty", "grocery", "sports"];
const knownSorts = ["featured", "price-low", "price-high", "rating"];
const allowedProductFields = [
  "category",
  "title",
  "rating",
  "reviews",
  "price",
  "oldPrice",
  "discount",
  "shipping",
  "image",
  "alt",
  "stock",
  "badge",
  "tag",
  "tags",
  "shortDescription",
  "details",
  "highlights"
];
const requiredCreateFields = ["category", "title", "price", "image", "alt", "stock", "shortDescription"];

function createHttpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeOptionalString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeCategory(value, required) {
  const category = normalizeString(value);

  if (!category && !required) {
    return undefined;
  }

  if (!knownCategories.includes(category)) {
    throw createHttpError("Category must be one of: " + knownCategories.join(", ") + ".", 400);
  }

  return category;
}

function normalizeRequiredString(payload, fieldName, label) {
  const value = normalizeOptionalString(payload && payload[fieldName]);

  if (!value) {
    throw createHttpError(label + " is required.", 400);
  }

  return value;
}

function normalizePrice(value, fieldName, required) {
  if ((value === undefined || value === null || value === "") && !required) {
    return undefined;
  }

  const price = Number(value);

  if (!Number.isFinite(price) || price < 0) {
    throw createHttpError(fieldName + " must be a number greater than or equal to 0.", 400);
  }

  return Math.round((price + Number.EPSILON) * 100) / 100;
}

function normalizeInteger(value, fieldName, required) {
  if ((value === undefined || value === null || value === "") && !required) {
    return undefined;
  }

  const integer = Number(value);

  if (!Number.isInteger(integer) || integer < 0) {
    throw createHttpError(fieldName + " must be a whole number greater than or equal to 0.", 400);
  }

  return integer;
}

function normalizeArray(value) {
  if (Array.isArray(value)) {
    return value.map(function (item) {
      return typeof item === "string" ? item.trim() : item;
    }).filter(function (item) {
      return item !== "";
    });
  }

  if (typeof value === "string" && value.trim()) {
    return value.split(/\r?\n|,/).map(function (item) {
      return item.trim();
    }).filter(Boolean);
  }

  return [];
}

function normalizeDetails(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value;
  }

  return {};
}

function validateAllowedFields(payload) {
  Object.keys(payload || {}).forEach(function (fieldName) {
    if (!allowedProductFields.includes(fieldName)) {
      throw createHttpError("Unsupported product field: " + fieldName + ".", 400);
    }
  });
}

function buildProductInput(payload, options) {
  const isCreate = Boolean(options && options.create);
  const product = {};

  validateAllowedFields(payload);

  if (isCreate) {
    requiredCreateFields.forEach(function (fieldName) {
      if (payload[fieldName] === undefined || payload[fieldName] === null || payload[fieldName] === "") {
        throw createHttpError(fieldName + " is required.", 400);
      }
    });
  }

  if (payload.category !== undefined || isCreate) {
    product.category = normalizeCategory(payload.category, isCreate);
  }

  if (payload.title !== undefined || isCreate) {
    product.title = normalizeRequiredString(payload, "title", "Title");
  }

  if (payload.price !== undefined || isCreate) {
    product.price = normalizePrice(payload.price, "Price", isCreate);
  }

  if (payload.image !== undefined || isCreate) {
    product.image = normalizeRequiredString(payload, "image", "Image URL");
  }

  if (payload.alt !== undefined || isCreate) {
    product.alt = normalizeRequiredString(payload, "alt", "Image alt text");
  }

  if (payload.stock !== undefined || isCreate) {
    product.stock = normalizeInteger(payload.stock, "Stock", isCreate);
  }

  if (payload.shortDescription !== undefined || isCreate) {
    product.shortDescription = normalizeRequiredString(payload, "shortDescription", "Short description");
  }

  if (payload.rating !== undefined || isCreate) {
    product.rating = normalizePrice(payload.rating === undefined ? 0 : payload.rating, "Rating", false);
  }

  if (payload.reviews !== undefined || isCreate) {
    product.reviews = normalizeInteger(payload.reviews === undefined ? 0 : payload.reviews, "Reviews", false);
  }

  if (payload.oldPrice !== undefined || isCreate) {
    product.oldPrice = normalizePrice(payload.oldPrice === undefined || payload.oldPrice === "" ? 0 : payload.oldPrice, "Old price", false);
  }

  ["discount", "shipping", "badge", "tag"].forEach(function (fieldName) {
    if (payload[fieldName] !== undefined || isCreate) {
      product[fieldName] = normalizeOptionalString(payload[fieldName]);
    }
  });

  if (payload.tags !== undefined || isCreate) {
    product.tags = normalizeArray(payload.tags);
  }

  if (payload.details !== undefined || isCreate) {
    product.details = normalizeDetails(payload.details);
  }

  if (payload.highlights !== undefined || isCreate) {
    product.highlights = normalizeArray(payload.highlights);
  }

  Object.keys(product).forEach(function (fieldName) {
    if (product[fieldName] === undefined) {
      delete product[fieldName];
    }
  });

  return product;
}

function normalizeFilters(query) {
  const category = normalizeString(query.category);
  const sort = normalizeString(query.sort);

  return {
    category: knownCategories.includes(category) ? category : "all",
    query: typeof query.query === "string" ? query.query.trim() : "",
    sort: knownSorts.includes(sort) ? sort : "featured",
    rating: normalizeNumber(query.rating, 0),
    maxPrice: normalizeNumber(query.maxPrice, Number.POSITIVE_INFINITY),
    tag: normalizeString(query.tag)
  };
}

function productMatchesQuery(product, query) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  const searchableText = [
    product.title,
    product.category,
    product.badge,
    product.tag,
    product.shortDescription,
    product.shipping,
    Array.isArray(product.tags) ? product.tags.join(" ") : "",
    Array.isArray(product.highlights) ? product.highlights.join(" ") : "",
    product.details ? Object.values(product.details).join(" ") : ""
  ].join(" ").toLowerCase();

  return searchableText.includes(normalizedQuery);
}

function productMatchesTag(product, tag) {
  if (!tag) {
    return true;
  }

  if (normalizeString(product.tag) === tag || normalizeString(product.badge) === tag) {
    return true;
  }

  return Array.isArray(product.tags) && product.tags.map(normalizeString).includes(tag);
}

function sortProducts(products, sort) {
  const sortedProducts = products.slice();

  if (sort === "price-low") {
    sortedProducts.sort(function (a, b) {
      return a.price - b.price;
    });
  } else if (sort === "price-high") {
    sortedProducts.sort(function (a, b) {
      return b.price - a.price;
    });
  } else if (sort === "rating") {
    sortedProducts.sort(function (a, b) {
      if (b.rating === a.rating) {
        return b.reviews - a.reviews;
      }
      return b.rating - a.rating;
    });
  } else {
    sortedProducts.sort(function (a, b) {
      return a.id - b.id;
    });
  }

  return sortedProducts;
}

async function getProducts(query) {
  const filters = normalizeFilters(query);
  const products = await productRepository.findAll();
  const filteredProducts = products.filter(function (product) {
    const categoryMatches = filters.category === "all" || product.category === filters.category;
    const queryMatches = productMatchesQuery(product, filters.query);
    const ratingMatches = Number(product.rating) >= filters.rating;
    const priceMatches = Number(product.price) <= filters.maxPrice;
    const tagMatches = productMatchesTag(product, filters.tag);

    return categoryMatches && queryMatches && ratingMatches && priceMatches && tagMatches;
  });

  return {
    data: sortProducts(filteredProducts, filters.sort),
    count: filteredProducts.length,
    total: products.length,
    meta: {
      count: filteredProducts.length,
      total: products.length
    },
    filters
  };
}

async function getProductById(productId) {
  return productRepository.findById(productId);
}

async function createProduct(payload) {
  const productInput = buildProductInput(payload || {}, { create: true });
  return productRepository.createProduct(productInput);
}

async function updateProduct(productId, payload) {
  const existingProduct = await productRepository.findById(productId);

  if (!existingProduct) {
    return null;
  }

  const updates = buildProductInput(payload || {}, { create: false });

  return productRepository.updateProduct(productId, updates);
}

async function deleteProduct(productId) {
  return productRepository.deleteProduct(productId);
}

module.exports = {
  createProduct,
  deleteProduct,
  getProducts,
  getProductById,
  updateProduct
};
