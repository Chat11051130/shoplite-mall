const orderRepository = require("../repositories/orderRepository");
const productRepository = require("../repositories/productRepository");
const userRepository = require("../repositories/userRepository");

const categories = ["electronics", "fashion", "home", "beauty", "grocery", "sports"];
const statuses = ["processing", "shipped", "delivered", "cancelled"];

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function normalizeStatus(status) {
  const normalizedStatus = typeof status === "string" && status.trim() ? status.trim().toLowerCase() : "processing";
  return statuses.indexOf(normalizedStatus) === -1 ? "processing" : normalizedStatus;
}

function isCancelled(order) {
  return normalizeStatus(order.status) === "cancelled";
}

function orderTotal(order) {
  return order && order.summary && Number.isFinite(Number(order.summary.total)) ? Number(order.summary.total) : 0;
}

function itemCount(order) {
  if (order && order.summary && Number.isFinite(Number(order.summary.itemCount))) {
    return Number(order.summary.itemCount);
  }

  return (order.items || []).reduce(function (total, item) {
    return total + (Number(item.quantity) || 1);
  }, 0);
}

function categoryLabel(category) {
  return String(category || "").split("-").map(function (part) {
    return part.charAt(0).toUpperCase() + part.slice(1);
  }).join(" ");
}

function validImagePath(value) {
  const image = typeof value === "string" ? value.trim() : "";

  if (!image) {
    return "";
  }

  const normalizedImage = image.toLowerCase();
  if (normalizedImage === "undefined" || normalizedImage === "null" || normalizedImage === "[object object]") {
    return "";
  }

  return image;
}

function categoryAlt(category, product) {
  const alt = product && typeof product.alt === "string" ? product.alt.trim() : "";
  return alt || categoryLabel(category) + " category";
}

function sortNewestFirst(orders) {
  return orders.slice().sort(function (a, b) {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

async function getSummary() {
  const products = await productRepository.getAllProducts();
  const orders = await orderRepository.getAllOrders();
  const users = await userRepository.getAllUsers();
  const statusCounts = statuses.reduce(function (counts, status) {
    counts[status] = 0;
    return counts;
  }, {});
  const revenueOrders = orders.filter(function (order) {
    return !isCancelled(order);
  });
  const totalRevenue = revenueOrders.reduce(function (total, order) {
    return total + orderTotal(order);
  }, 0);

  orders.forEach(function (order) {
    const status = normalizeStatus(order.status);
    statusCounts[status] += 1;
  });

  return {
    data: {
      totalProducts: products.length,
      totalOrders: orders.length,
      totalRevenue: roundMoney(totalRevenue),
      processingOrders: statusCounts.processing,
      shippedOrders: statusCounts.shipped,
      deliveredOrders: statusCounts.delivered,
      cancelledOrders: statusCounts.cancelled,
      lowStockProducts: products.filter(function (product) {
        return Number(product.stock) <= 5;
      }).length,
      averageOrderValue: roundMoney(revenueOrders.length ? totalRevenue / revenueOrders.length : 0),
      registeredUsers: users.length
    }
  };
}

async function getCategorySales() {
  const products = await productRepository.getAllProducts();
  const orders = await orderRepository.getAllOrders();
  const productCategories = products.reduce(function (lookup, product) {
    lookup[String(product.id)] = product.category;
    return lookup;
  }, {});
  const representativeProducts = products.reduce(function (lookup, product) {
    const category = String(product.category || "").toLowerCase();
    if (categories.indexOf(category) !== -1 && !lookup[category] && validImagePath(product.image)) {
      lookup[category] = product;
    }
    return lookup;
  }, {});
  const fallbackProduct = products.find(function (product) {
    return validImagePath(product.image);
  }) || null;
  const categorySales = categories.reduce(function (lookup, category) {
    lookup[category] = {
      category,
      itemsSold: 0,
      revenue: 0
    };
    return lookup;
  }, {});

  orders.filter(function (order) {
    return !isCancelled(order);
  }).forEach(function (order) {
    (order.items || []).forEach(function (item) {
      const category = categories.indexOf(item.category) !== -1 ? item.category : productCategories[String(item.productId)];
      const quantity = Number(item.quantity) || 1;
      const price = Number(item.price) || 0;

      if (!categorySales[category]) {
        return;
      }

      categorySales[category].itemsSold += quantity;
      categorySales[category].revenue += price * quantity;
    });
  });

  return {
    data: categories.map(function (category) {
      const representativeProduct = representativeProducts[category] || fallbackProduct || {};
      return {
        category,
        itemsSold: categorySales[category].itemsSold,
        revenue: roundMoney(categorySales[category].revenue),
        image: validImagePath(representativeProduct.image),
        alt: categoryAlt(category, representativeProduct)
      };
    })
  };
}

async function getOrderStatus() {
  const orders = await orderRepository.getAllOrders();
  const counts = statuses.reduce(function (lookup, status) {
    lookup[status] = 0;
    return lookup;
  }, {});

  orders.forEach(function (order) {
    counts[normalizeStatus(order.status)] += 1;
  });

  return {
    data: statuses.map(function (status) {
      return {
        status,
        count: counts[status]
      };
    })
  };
}

async function getRecentOrders(query) {
  const parsedLimit = Number(query && query.limit);
  const limit = Math.min(Math.max(Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.floor(parsedLimit) : 5, 1), 10);
  const orders = sortNewestFirst(await orderRepository.getAllOrders()).slice(0, limit).map(function (order) {
    return {
      id: order.id,
      customerName: order.customerName || "ShopLite customer",
      status: normalizeStatus(order.status),
      total: roundMoney(orderTotal(order)),
      createdAt: order.createdAt || "",
      itemCount: itemCount(order)
    };
  });

  return {
    data: orders,
    meta: {
      count: orders.length
    }
  };
}

module.exports = {
  getCategorySales,
  getOrderStatus,
  getRecentOrders,
  getSummary
};
