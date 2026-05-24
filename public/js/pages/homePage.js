(function () {
  "use strict";

  var data = window.ShopLiteData || {};
  var templates = window.ShopLiteTemplates || {};
  var products = data.products || [];
  var productCardTemplate = templates.productCardTemplate;
  var miniCardTemplate = templates.miniCardTemplate;
  var formatPrice = templates.formatPrice;

  var featuredProductIds = [1, 2, 7, 9, 10, 17, 18, 25, 26, 33, 41, 42];
  var railIds = {
    bestSellerRail: [25, 1, 41, 9],
    dealRail: [3, 18, 33, 45],
    recommendedRail: [17, 2, 20, 42]
  };
  var recommendedPoolIds = [17, 2, 20, 42, 11, 27, 37, 46, 7, 34, 48, 24];
  var recommendationOffset = 0;

  function findProduct(id) {
    return products.find(function (product) {
      return product.id === id;
    });
  }

  function productListFromIds(ids) {
    return ids.map(findProduct).filter(Boolean);
  }

  function shouldRedirectLegacyHomeRoute() {
    var params = new URLSearchParams(window.location.search);
    return params.has("category") || params.has("query") || params.has("tag") || params.has("sort") || params.has("rating");
  }

  function redirectLegacyHomeRoute() {
    window.location.replace("products.html" + window.location.search);
  }

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
    var toastElement = ensureToast();
    var body = toastElement.querySelector(".toast-body");
    if (body) {
      body.textContent = message;
    }
    if (window.bootstrap) {
      window.bootstrap.Toast.getOrCreateInstance(toastElement, { delay: 1600 }).show();
    }
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

  function getFeaturedProducts() {
    return productListFromIds(featuredProductIds);
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

  function renderFeaturedProducts() {
    var productGrid = document.getElementById("productGrid");
    var resultCount = document.getElementById("resultCount");
    var priceRange = document.getElementById("priceRange");
    var priceValue = document.getElementById("priceValue");
    var sortSelect = document.getElementById("sortSelect");
    var maxPrice = priceRange ? Number(priceRange.value) : 800;
    var categories = getSelectedCategories();
    var minimumRating = getSelectedRating();
    var filtered = getFeaturedProducts().filter(function (product) {
      var categoryMatch = categories.length === 0 || categories.indexOf(product.category) !== -1;
      return categoryMatch && product.price <= maxPrice && product.rating >= minimumRating;
    });

    if (sortSelect && sortSelect.value === "price-low") {
      filtered.sort(function (a, b) { return a.price - b.price; });
    } else if (sortSelect && sortSelect.value === "price-high") {
      filtered.sort(function (a, b) { return b.price - a.price; });
    } else if (sortSelect && sortSelect.value === "rating") {
      filtered.sort(function (a, b) { return b.rating - a.rating; });
    }

    if (priceValue && typeof formatPrice === "function") {
      priceValue.textContent = formatPrice(maxPrice);
    }
    if (resultCount) {
      resultCount.textContent = filtered.length + " curated item" + (filtered.length === 1 ? "" : "s");
    }
    if (!productGrid) {
      return;
    }

    if (filtered.length === 0) {
      productGrid.innerHTML = '<div class="col-12"><div class="empty-state"><strong>No curated products match these filters.</strong><span>Clear filters or open the full catalog for more ShopLite items.</span><a class="btn btn-accent mt-3" href="products.html">Browse Full Catalog</a></div></div>';
      return;
    }

    productGrid.innerHTML = filtered.map(productCardTemplate).join("");
    attachImageFallbacks(productGrid);
  }

  function renderRail(railId, ids) {
    var rail = document.getElementById(railId);
    if (!rail || typeof miniCardTemplate !== "function") {
      return;
    }

    rail.innerHTML = productListFromIds(ids).map(miniCardTemplate).join("");
    attachImageFallbacks(rail);
  }

  function renderRails() {
    renderRail("bestSellerRail", railIds.bestSellerRail);
    renderRail("dealRail", railIds.dealRail);
    renderRail("recommendedRail", railIds.recommendedRail);
  }

  function refreshRecommendations() {
    recommendationOffset = (recommendationOffset + 4) % recommendedPoolIds.length;
    railIds.recommendedRail = recommendedPoolIds.slice(recommendationOffset, recommendationOffset + 4);

    if (railIds.recommendedRail.length < 4) {
      railIds.recommendedRail = railIds.recommendedRail.concat(recommendedPoolIds.slice(0, 4 - railIds.recommendedRail.length));
    }

    renderRail("recommendedRail", railIds.recommendedRail);
    showToast("Recommended products refreshed.");
  }

  function updateCart() {
    var cartCountEl = document.getElementById("cartCount");
    var cartButton = document.getElementById("cartButton");
    var currentCount = cartCountEl ? Number.parseInt(cartCountEl.textContent || "0", 10) : 0;
    var nextCount = currentCount + 1;

    if (cartCountEl) {
      cartCountEl.textContent = String(nextCount);
    }
    if (cartButton) {
      cartButton.setAttribute("aria-label", "Shopping cart with " + nextCount + " items");
    }
    showToast("Item added to your ShopLite cart.");
  }

  function buildProductsSearchUrl() {
    var categorySelect = document.getElementById("categorySelect");
    var searchInput = document.getElementById("searchInput");
    var params = new URLSearchParams();
    var category = categorySelect ? categorySelect.value : "all";
    var query = searchInput ? searchInput.value.trim() : "";

    if (query) {
      params.set("query", query);
    }
    if (category && category !== "all") {
      params.set("category", category);
    }

    return "products.html" + (params.toString() ? "?" + params.toString() : "");
  }

  function scrollForHomeAnchor() {
    var hash = window.location.hash.replace("#", "");
    var params = new URLSearchParams(window.location.search);
    var target = null;

    if (params.get("section") === "deals" || hash === "todayDeals") {
      target = document.getElementById("todayDeals");
    } else if (hash === "recommended") {
      target = document.getElementById("recommended");
    } else if (hash === "fastShipping") {
      target = document.getElementById("fastShipping");
    } else if (hash === "giftCards") {
      target = document.getElementById("giftCards");
    }

    if (target) {
      window.requestAnimationFrame(function () {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  function initHomePage() {
    var productGrid = document.getElementById("productGrid");
    if (!productGrid) {
      return;
    }

    if (shouldRedirectLegacyHomeRoute()) {
      redirectLegacyHomeRoute();
      return;
    }

    renderRails();
    renderFeaturedProducts();
    scrollForHomeAnchor();

    document.addEventListener("click", function (event) {
      var productButton = event.target.closest("[data-action='add-to-cart']");
      var refreshButton = event.target.closest("[data-action='refresh-recommendations']");

      if (productButton) {
        updateCart();
        return;
      }

      if (refreshButton) {
        event.preventDefault();
        refreshRecommendations();
        var recommended = document.getElementById("recommended");
        if (recommended) {
          recommended.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    });

    document.querySelectorAll(".category-filter, .rating-filter").forEach(function (input) {
      input.addEventListener("change", renderFeaturedProducts);
    });

    var priceRange = document.getElementById("priceRange");
    if (priceRange) {
      priceRange.addEventListener("input", renderFeaturedProducts);
    }

    var sortSelect = document.getElementById("sortSelect");
    if (sortSelect) {
      sortSelect.addEventListener("change", renderFeaturedProducts);
    }

    var clearFilters = document.getElementById("clearFilters");
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
        renderFeaturedProducts();
      });
    }

    var searchForm = document.getElementById("searchForm");
    if (searchForm) {
      searchForm.addEventListener("submit", function (event) {
        event.preventDefault();
        window.location.assign(buildProductsSearchUrl());
      });
    }
  }

  window.ShopLitePages = window.ShopLitePages || {};
  window.ShopLitePages.home = initHomePage;
  window.ShopLitePages.initHomePage = initHomePage;
}());
