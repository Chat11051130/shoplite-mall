const productRepository = require("../repositories/productRepository");

const knownCategories = ["electronics", "fashion", "home", "beauty", "grocery", "sports"];
const knownSorts = ["featured", "price-low", "price-high", "rating"];

function normalizeString(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
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
    filters
  };
}

async function getProductById(productId) {
  return productRepository.findById(productId);
}

module.exports = {
  getProducts,
  getProductById
};
