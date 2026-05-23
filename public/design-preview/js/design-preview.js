(function () {
  "use strict";

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
    var existing = document.getElementById("cartToast") || document.getElementById("prototypeToast");
    if (existing) {
      return existing;
    }

    var container = document.createElement("div");
    container.className = "toast-container position-fixed bottom-0 end-0 p-3";
    container.innerHTML = '<div id="prototypeToast" class="toast align-items-center" role="status" aria-live="polite" aria-atomic="true"><div class="d-flex"><div class="toast-body">Prototype action completed.</div><button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button></div></div>';
    document.body.appendChild(container);
    return document.getElementById("prototypeToast");
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

  function formatPrice(value) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(value);
  }

  function formatReviews(value) {
    return new Intl.NumberFormat("en-US").format(value);
  }

  function buildStars(rating) {
    var full = Math.floor(rating);
    var hasHalf = rating - full >= 0.5;
    var html = "";

    for (var index = 1; index <= 5; index += 1) {
      if (index <= full) {
        html += '<i class="bi bi-star-fill" aria-hidden="true"></i>';
      } else if (index === full + 1 && hasHalf) {
        html += '<i class="bi bi-star-half" aria-hidden="true"></i>';
      } else {
        html += '<i class="bi bi-star" aria-hidden="true"></i>';
      }
    }

    return html;
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

  function productCard(product) {
    return [
      '<article class="col-xl-3 col-lg-4 col-md-6">',
      '  <div class="product-card">',
      '    <div class="product-media">',
      '      <img src="' + product.image + '" alt="' + product.alt + '" loading="lazy">',
      '      <span class="discount-tag">' + product.discount + "</span>",
      "    </div>",
      '    <div class="product-body">',
      '      <div class="product-category">' + product.category + "</div>",
      '      <h3 class="product-title">' + product.title + "</h3>",
      '      <div class="rating-row" aria-label="' + product.rating + ' out of 5 stars">',
      '        <span class="stars">' + buildStars(product.rating) + "</span>",
      '        <span class="review-count">' + formatReviews(product.reviews) + "</span>",
      "      </div>",
      '      <div class="price-row-card">',
      '        <span class="current-price">' + formatPrice(product.price) + "</span>",
      '        <span class="old-price">' + formatPrice(product.oldPrice) + "</span>",
      "      </div>",
      '      <p class="shipping-info">' + product.shipping + "</p>",
      '      <button class="btn add-cart-btn" type="button" data-product-id="' + product.id + '">',
      '        <i class="bi bi-cart-plus" aria-hidden="true"></i>',
      "        Add to Cart",
      "      </button>",
      "    </div>",
      "  </div>",
      "</article>"
    ].join("");
  }

  function miniCard(product) {
    return [
      '<article class="mini-card">',
      '  <img src="' + product.image + '" alt="' + product.alt + '" loading="lazy">',
      "  <div>",
      "    <strong>" + product.title + "</strong>",
      '    <span class="stars" aria-label="' + product.rating + ' out of 5 stars">' + buildStars(product.rating) + "</span>",
      "    <span>" + formatPrice(product.price) + "</span>",
      "  </div>",
      "</article>"
    ].join("");
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

    function selectedCategories() {
      return Array.prototype.slice.call(document.querySelectorAll(".category-filter:checked")).map(function (input) {
        return input.value;
      });
    }

    function selectedRating() {
      var selected = document.querySelector(".rating-filter:checked");
      return selected ? Number(selected.value) : 0;
    }

    function applyFilters() {
      var maxPrice = priceRange ? Number(priceRange.value) : 800;
      var categories = selectedCategories();
      var minimumRating = selectedRating();
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

      productGrid.innerHTML = filtered.map(productCard).join("");
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
        rail.innerHTML = railProducts.map(miniCard).join("");
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
      var productButton = event.target.closest("[data-product-id]");
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

  function initAddToCartButtons() {
    document.querySelectorAll("[data-action='add-to-cart']").forEach(function (button) {
      button.addEventListener("click", function () {
        showToast("Item added to your ShopLite cart.");
      });
    });
  }

  function initQuantityControls() {
    document.querySelectorAll("[data-quantity-control]").forEach(function (control) {
      var input = control.querySelector("input");
      if (!input) {
        return;
      }

      control.querySelectorAll("[data-quantity-change]").forEach(function (button) {
        button.addEventListener("click", function () {
          var change = Number(button.getAttribute("data-quantity-change"));
          var current = Number(input.value || "1");
          var next = Math.max(1, current + change);
          input.value = String(next);
          showToast("Quantity updated.");
        });
      });
    });
  }

  function initPrototypeForms() {
    document.querySelectorAll("[data-prototype-form]").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var targetSelector = form.getAttribute("data-validation-target");
        var target = targetSelector ? document.querySelector(targetSelector) : null;
        if (target) {
          target.className = "validation-message alert alert-success mt-3";
          target.textContent = "Prototype validation passed. This page is ready for later final project integration.";
        } else {
          showToast("Prototype form submitted.");
        }
      });
    });
  }

  function statusClass(status) {
    var normalized = String(status || "").toLowerCase();
    if (normalized === "paid" || normalized === "active" || normalized === "delivered" || normalized === "completed") {
      return "status-badge status-" + normalized;
    }
    if (normalized === "processing" || normalized === "pending" || normalized === "shipped" || normalized === "cancelled" || normalized === "draft") {
      return "status-badge status-" + normalized;
    }
    return "status-badge status-draft";
  }

  function initStatusSelectors() {
    document.querySelectorAll("[data-status-select]").forEach(function (select) {
      select.addEventListener("change", function () {
        var row = select.closest("[data-status-row]");
        var badge = row ? row.querySelector("[data-status-badge]") : null;
        if (badge) {
          badge.textContent = select.value;
          badge.className = statusClass(select.value);
          showToast("Order status updated in the prototype.");
        }
      });
    });
  }

  function initCharts() {
    if (!window.Chart) {
      return;
    }

    var salesCanvas = document.getElementById("salesTrendChart");
    if (salesCanvas) {
      new window.Chart(salesCanvas, {
        type: "line",
        data: {
          labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          datasets: [{
            label: "Sales",
            data: [4200, 5100, 4800, 6200, 7400, 9100, 8600],
            borderColor: "#f59e0b",
            backgroundColor: "rgba(245, 158, 11, 0.16)",
            tension: 0.38,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } }
        }
      });
    }

    var categoryCanvas = document.getElementById("categorySalesChart");
    if (categoryCanvas) {
      new window.Chart(categoryCanvas, {
        type: "doughnut",
        data: {
          labels: ["Electronics", "Home", "Fashion", "Beauty", "Grocery"],
          datasets: [{
            data: [34, 22, 18, 14, 12],
            backgroundColor: ["#f59e0b", "#2563eb", "#15803d", "#c2410c", "#6b7280"]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: "bottom" } }
        }
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    initHomePage();
    initAddToCartButtons();
    initQuantityControls();
    initPrototypeForms();
    initStatusSelectors();
    initCharts();
  });
})();
