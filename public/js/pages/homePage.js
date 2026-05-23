(function () {
  "use strict";

  var templates = window.ShopLiteTemplates || {};
  var formatPrice = templates.formatPrice;
  var miniCardTemplate = templates.miniCardTemplate;
  var productCardTemplate = templates.productCardTemplate;

var homeProducts = [
  {
    id: 1,
    category: "electronics",
    title: "AeroBook 14-inch lightweight laptop with long-life battery",
    rating: 4.7,
    reviews: 1248,
    price: 679.99,
    oldPrice: 799.99,
    discount: "15% off",
    shipping: "Free delivery tomorrow with ShopLite Express",
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=700&q=80",
    alt: "Open laptop on a work desk"
  },
  {
    id: 2,
    category: "electronics",
    title: "PulseWave wireless noise-canceling headphones",
    rating: 4.6,
    reviews: 893,
    price: 129.95,
    oldPrice: 179.95,
    discount: "28% off",
    shipping: "Ships free, arrives in 2 days",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=80",
    alt: "Black wireless headphones"
  },
  {
    id: 3,
    category: "fashion",
    title: "StrideFlex everyday running sneakers for city comfort",
    rating: 4.5,
    reviews: 542,
    price: 74.5,
    oldPrice: 99,
    discount: "25% off",
    shipping: "Free returns on eligible sizes",
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=700&q=80",
    alt: "Generic running sneakers"
  },
  {
    id: 4,
    category: "fashion",
    title: "Classic round dial watch with leather strap",
    rating: 4.3,
    reviews: 319,
    price: 58,
    oldPrice: 86,
    discount: "33% off",
    shipping: "Low-stock deal with tracked shipping",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=80",
    alt: "Classic wristwatch"
  },
  {
    id: 5,
    category: "home",
    title: "Nordic task chair with breathable woven seat",
    rating: 4.4,
    reviews: 778,
    price: 149.99,
    oldPrice: 199.99,
    discount: "Save $50",
    shipping: "Oversize item, doorstep delivery included",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=700&q=80",
    alt: "Modern chair in a bright room"
  },
  {
    id: 6,
    category: "home",
    title: "Compact espresso maker for weekday coffee routines",
    rating: 4.2,
    reviews: 403,
    price: 189,
    oldPrice: 239,
    discount: "21% off",
    shipping: "Ships today from a local warehouse",
    image: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=700&q=80",
    alt: "Espresso machine on a kitchen counter"
  },
  {
    id: 7,
    category: "beauty",
    title: "GlowDaily skincare set with cleanser and moisturizer",
    rating: 4.8,
    reviews: 1560,
    price: 42.99,
    oldPrice: 59.99,
    discount: "Bundle deal",
    shipping: "Eligible for subscription savings",
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=700&q=80",
    alt: "Skincare bottles and cosmetics"
  },
  {
    id: 8,
    category: "grocery",
    title: "Organic pantry starter box with snacks and grains",
    rating: 4.1,
    reviews: 228,
    price: 36.5,
    oldPrice: 45,
    discount: "19% off",
    shipping: "Freshness packed, delivery this week",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=700&q=80",
    alt: "Fresh groceries and packaged food"
  },
  {
    id: 9,
    category: "sports",
    title: "HydroTrail insulated stainless water bottle",
    rating: 4.6,
    reviews: 674,
    price: 24.99,
    oldPrice: 34.99,
    discount: "29% off",
    shipping: "Add-on friendly with free shipping over $35",
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=700&q=80",
    alt: "Reusable stainless steel water bottle"
  },
  {
    id: 10,
    category: "electronics",
    title: "CreatorPro mechanical keyboard with quiet tactile switches",
    rating: 4.7,
    reviews: 931,
    price: 88.75,
    oldPrice: 119,
    discount: "25% off",
    shipping: "Free delivery and easy replacement",
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=700&q=80",
    alt: "Mechanical keyboard close up"
  },
  {
    id: 11,
    category: "sports",
    title: "ActiveFit yoga mat with alignment marks and carry strap",
    rating: 4.4,
    reviews: 358,
    price: 31.99,
    oldPrice: 44.99,
    discount: "Save 29%",
    shipping: "Roll-packed for fast locker pickup",
    image: "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?auto=format&fit=crop&w=700&q=80",
    alt: "Yoga mat and fitness accessories"
  },
  {
    id: 12,
    category: "beauty",
    title: "Studio ceramic hair dryer with three heat settings",
    rating: 4,
    reviews: 186,
    price: 54.99,
    oldPrice: 74.99,
    discount: "27% off",
    shipping: "Free shipping on beauty orders over $25",
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=700&q=80",
    alt: "Beauty products on a vanity"
  }
];

var homeRails = {
  bestSellerRail: [7, 1, 2, 10],
  dealRail: [3, 6, 9, 12],
  recommendedRail: [5, 8, 4, 11]
};

function ensureToast() {
  var existing = document.getElementById("cartToast");
  if (existing) {
    return existing;
  }

  var container = document.createElement("div");
  container.className = "toast-container position-fixed bottom-0 end-0 p-3";
  container.innerHTML = '<div id="cartToast" class="toast align-items-center" role="status" aria-live="polite" aria-atomic="true"><div class="d-flex"><div class="toast-body">Item added to your ShopLite cart.</div><button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button></div></div>';
  document.body.appendChild(container);
  return document.getElementById("cartToast");
}

function showToast(message) {
  if (!window.bootstrap) {
    return;
  }

  var toastElement = ensureToast();
  var body = toastElement.querySelector(".toast-body");
  if (body) {
    body.textContent = message;
  }
  window.bootstrap.Toast.getOrCreateInstance(toastElement, { delay: 1600 }).show();
}

function fallbackImage(label) {
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="700" height="525" viewBox="0 0 700 525"><rect width="700" height="525" fill="#eef2f7"/><rect x="54" y="58" width="592" height="409" rx="14" fill="#ffffff" stroke="#d1d5db" stroke-width="3"/><circle cx="350" cy="218" r="82" fill="#f59e0b" opacity="0.18"/><path d="M238 315h224l-31 50H269l-31-50Z" fill="#111827" opacity="0.9"/><rect x="264" y="170" width="172" height="118" rx="10" fill="#1e2a42"/><rect x="282" y="188" width="136" height="82" rx="5" fill="#f8fafc"/><text x="350" y="418" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="800" fill="#111827">' + label + "</text></svg>";
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

function attachImageFallbacks(scope) {
  var root = scope || document;
  root.querySelectorAll("img").forEach(function (img) {
    img.addEventListener("error", function () {
      if (img.dataset.fallbackApplied === "true") {
        return;
      }
      img.dataset.fallbackApplied = "true";
      img.src = fallbackImage(img.alt || "ShopLite product");
    });
  });
}

function getSelectedCategories() {
  return Array.prototype.slice.call(document.querySelectorAll(".category-filter:checked")).map(function (input) {
    return input.value;
  });
}

function getSelectedRating() {
  var selected = document.querySelector(".rating-filter:checked");
  return selected ? Number(selected.value) : 0;
}

function initHomePage() {
  var productGrid = document.getElementById("productGrid");
  if (!productGrid) {
    return;
  }

  var resultCount = document.getElementById("resultCount");
  var priceRange = document.getElementById("priceRange");
  var priceValue = document.getElementById("priceValue");
  var sortSelect = document.getElementById("sortSelect");
  var categorySelect = document.getElementById("categorySelect");
  var searchInput = document.getElementById("searchInput");
  var searchForm = document.getElementById("searchForm");
  var cartCountEl = document.getElementById("cartCount");
  var cartButton = document.getElementById("cartButton");
  var clearFilters = document.getElementById("clearFilters");
  var marketplaceShell = document.querySelector(".marketplace-shell");
  var cartCount = cartCountEl ? Number(cartCountEl.textContent || "3") : 3;

  function applyFilters() {
    var maxPrice = priceRange ? Number(priceRange.value) : 800;
    var categories = getSelectedCategories();
    var minimumRating = getSelectedRating();
    var categoryDropdown = categorySelect ? categorySelect.value : "all";
    var query = searchInput ? searchInput.value.trim().toLowerCase() : "";

    var filtered = homeProducts.filter(function (product) {
      var categoryMatch = categories.length === 0 || categories.includes(product.category);
      var dropdownMatch = categoryDropdown === "all" || product.category === categoryDropdown;
      var priceMatch = product.price <= maxPrice;
      var ratingMatch = product.rating >= minimumRating;
      var queryMatch = !query || product.title.toLowerCase().includes(query) || product.category.includes(query);
      return categoryMatch && dropdownMatch && priceMatch && ratingMatch && queryMatch;
    });

    if (sortSelect && sortSelect.value === "price-low") {
      filtered = filtered.sort(function (a, b) { return a.price - b.price; });
    } else if (sortSelect && sortSelect.value === "price-high") {
      filtered = filtered.sort(function (a, b) { return b.price - a.price; });
    } else if (sortSelect && sortSelect.value === "rating") {
      filtered = filtered.sort(function (a, b) { return b.rating - a.rating; });
    }

    if (priceValue) {
      priceValue.textContent = formatPrice(maxPrice);
    }
    if (resultCount) {
      resultCount.textContent = filtered.length + " item" + (filtered.length === 1 ? "" : "s");
    }

    if (filtered.length === 0) {
      productGrid.innerHTML = '<div class="col-12"><div class="empty-state"><strong>No products match these filters.</strong><span>Clear filters or increase the price range to see more ShopLite items.</span></div></div>';
      return;
    }

    productGrid.innerHTML = filtered.map(productCardTemplate).join("");
    attachImageFallbacks(productGrid);
  }

  function renderRails() {
    Object.keys(homeRails).forEach(function (railId) {
      var rail = document.getElementById(railId);
      if (!rail) {
        return;
      }

      var railProducts = homeRails[railId].map(function (id) {
        return homeProducts.find(function (product) {
          return product.id === id;
        });
      }).filter(Boolean);

      rail.innerHTML = railProducts.map(miniCardTemplate).join("");
      attachImageFallbacks(rail);
    });
  }

  function updateCart() {
    cartCount += 1;
    if (cartCountEl) {
      cartCountEl.textContent = String(cartCount);
    }
    if (cartButton) {
      cartButton.setAttribute("aria-label", "Shopping cart with " + cartCount + " items");
    }
    showToast("Item added to your ShopLite cart.");
  }

  document.addEventListener("click", function (event) {
    var productButton = event.target.closest("[data-action='add-to-cart']");
    if (productButton) {
      updateCart();
    }

    var categoryLink = event.target.closest("[data-category-link]");
    if (categoryLink) {
      event.preventDefault();
      var category = categoryLink.dataset.categoryLink;
      document.querySelectorAll("[data-category-link]").forEach(function (link) {
        link.classList.remove("active");
      });
      categoryLink.classList.add("active");

      if (categorySelect) {
        categorySelect.value = category === "deals" ? "all" : category;
      }

      if (category === "deals") {
        var todayDeals = document.getElementById("todayDeals");
        if (todayDeals) {
          todayDeals.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      } else {
        applyFilters();
        if (marketplaceShell) {
          marketplaceShell.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    }
  });

  document.querySelectorAll(".category-filter, .rating-filter").forEach(function (input) {
    input.addEventListener("change", applyFilters);
  });

  if (priceRange) {
    priceRange.addEventListener("input", applyFilters);
  }
  if (sortSelect) {
    sortSelect.addEventListener("change", applyFilters);
  }
  if (categorySelect) {
    categorySelect.addEventListener("change", applyFilters);
  }
  if (searchInput) {
    searchInput.addEventListener("input", applyFilters);
  }
  if (searchForm) {
    searchForm.addEventListener("submit", function (event) {
      event.preventDefault();
      applyFilters();
      if (marketplaceShell) {
        marketplaceShell.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }
  if (clearFilters) {
    clearFilters.addEventListener("click", function () {
      document.querySelectorAll(".category-filter").forEach(function (input) {
        input.checked = false;
      });
      var defaultRating = document.querySelector('[name="rating"][value="4"]');
      if (defaultRating) {
        defaultRating.checked = true;
      }
      if (priceRange) {
        priceRange.value = priceRange.max;
      }
      if (sortSelect) {
        sortSelect.value = "featured";
      }
      if (categorySelect) {
        categorySelect.value = "all";
      }
      if (searchInput) {
        searchInput.value = "";
      }
      document.querySelectorAll("[data-category-link]").forEach(function (link) {
        link.classList.remove("active");
      });
      applyFilters();
    });
  }

  renderRails();
  applyFilters();
}

window.ShopLitePages = window.ShopLitePages || {};
window.ShopLitePages.home = initHomePage;
window.ShopLitePages.initHomePage = initHomePage;
}());
