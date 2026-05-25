(function () {
  "use strict";

  var data = window.ShopLiteData || {};
  var templates = window.ShopLiteTemplates || {};
  var apiClient = window.ShopLiteApi || {};
  var productCardTemplate = templates.productCardTemplate;
  var formatCategory = templates.formatCategory;
  var formatPrice = templates.formatPrice;
  var products = data.products || [];
  var productsPerPage = 16;
  var latestProductResult = null;
  var latestRequestId = 0;
  var fallbackNoticeShown = false;

  function getProductsPageState() {
    var params = new URLSearchParams(window.location.search);
    var section = (params.get("section") || "").toLowerCase();
    var tag = (params.get("tag") || "").toLowerCase();

    if (section === "deals") {
      tag = "deal";
    }

    return {
      category: (params.get("category") || "all").toLowerCase(),
      query: params.get("query") || "",
      sort: params.get("sort") || "featured",
      rating: Number(params.get("rating") || "0"),
      maxPrice: Number(params.get("maxPrice") || "800"),
      tag: tag,
      visibleCount: productsPerPage
    };
  }

  function isKnownCategory(category) {
    return ["electronics", "fashion", "home", "beauty", "grocery", "sports"].includes(category);
  }

  function normalizeState(state) {
    state.category = isKnownCategory(state.category) ? state.category : "all";
    state.sort = ["featured", "price-low", "price-high", "rating"].includes(state.sort) ? state.sort : "featured";
    state.rating = Number.isFinite(state.rating) ? state.rating : 0;
    state.maxPrice = Number.isFinite(state.maxPrice) ? state.maxPrice : 800;
    state.visibleCount = Number.isFinite(state.visibleCount) ? state.visibleCount : productsPerPage;
    return state;
  }

  function buildStarsFallback(rating) {
    if (typeof templates.buildStars === "function") {
      return templates.buildStars(rating);
    }

    return Array(Math.round(rating) + 1).join("*");
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

  function getCheckedCategories() {
    return Array.prototype.slice.call(document.querySelectorAll(".category-filter:checked")).map(function (input) {
      return input.value;
    });
  }

  function getSelectedRating() {
    var selected = document.querySelector(".rating-filter:checked");
    return selected ? Number(selected.value) : 0;
  }

  function setCartCount(itemCount) {
    var cartCount = document.getElementById("cartCount") || document.querySelector('[data-role="cart-count"]');
    var cartButton = document.getElementById("cartButton") || document.querySelector('[data-action="open-cart"]');
    var nextCount = Number.isFinite(itemCount) ? itemCount : 0;

    if (cartCount) {
      cartCount.textContent = String(nextCount);
    }

    if (cartButton) {
      cartButton.setAttribute("aria-label", "Shopping cart with " + nextCount + " items");
    }
  }

  function updateCartCount() {
    var cartCount = document.getElementById("cartCount") || document.querySelector('[data-role="cart-count"]');
    var nextCount = cartCount ? Number.parseInt(cartCount.textContent || "0", 10) + 1 : 1;

    setCartCount(nextCount);
    showToast("Item added to your ShopLite cart.");
  }

  async function addProductToCart(button) {
    var productId = Number(button ? button.dataset.productId : 0);

    if (typeof apiClient.postJson === "function" && Number.isInteger(productId) && productId > 0) {
      try {
        var cart = await apiClient.postJson("/api/cart/items", {
          productId: productId,
          quantity: 1
        });
        var itemCount = cart && cart.summary ? Number(cart.summary.itemCount) : NaN;
        setCartCount(itemCount);
        showToast("Item added to your ShopLite cart.");
        return;
      } catch (error) {
        if (window.console && typeof window.console.warn === "function") {
          window.console.warn("ShopLite cart API unavailable. Using local cart count fallback.", error);
        }
      }
    }

    updateCartCount();
  }

  function productMatchesQuery(product, query) {
    var normalizedQuery = query.trim().toLowerCase();
    var haystack = [
      product.title,
      product.category,
      product.badge,
      product.shortDescription,
      Array.isArray(product.highlights) ? product.highlights.join(" ") : ""
    ].join(" ").toLowerCase();

    return !normalizedQuery || haystack.indexOf(normalizedQuery) !== -1;
  }

  function productMatchesTag(product, tag) {
    if (!tag) {
      return true;
    }

    return Array.isArray(product.tags) && product.tags.indexOf(tag) !== -1;
  }

  function sortProducts(items, sortValue) {
    var sorted = items.slice();

    if (sortValue === "price-low") {
      sorted.sort(function (a, b) { return a.price - b.price; });
    } else if (sortValue === "price-high") {
      sorted.sort(function (a, b) { return b.price - a.price; });
    } else if (sortValue === "rating") {
      sorted.sort(function (a, b) {
        if (b.rating === a.rating) {
          return b.reviews - a.reviews;
        }
        return b.rating - a.rating;
      });
    } else {
      sorted.sort(function (a, b) {
        var aFeatured = Array.isArray(a.tags) && a.tags.indexOf("featured") !== -1 ? 1 : 0;
        var bFeatured = Array.isArray(b.tags) && b.tags.indexOf("featured") !== -1 ? 1 : 0;
        if (bFeatured === aFeatured) {
          return b.reviews - a.reviews;
        }
        return bFeatured - aFeatured;
      });
    }

    return sorted;
  }

  function buildFilteredProducts(state) {
    var selectedCategories = getCheckedCategories();
    var categorySet = selectedCategories.length > 0 ? selectedCategories : (state.category !== "all" ? [state.category] : []);

    return sortProducts(products.filter(function (product) {
      var categoryMatches = categorySet.length === 0 || categorySet.indexOf(product.category) !== -1;
      var priceMatches = product.price <= state.maxPrice;
      var ratingMatches = product.rating >= state.rating;
      return categoryMatches && priceMatches && ratingMatches && productMatchesQuery(product, state.query) && productMatchesTag(product, state.tag);
    }), state.sort);
  }

  function buildProductApiParams(state) {
    return {
      category: state.category !== "all" ? state.category : "",
      query: state.query,
      sort: state.sort !== "featured" ? state.sort : "",
      rating: state.rating > 0 ? state.rating : "",
      maxPrice: state.maxPrice !== 800 ? state.maxPrice : "",
      tag: state.tag
    };
  }

  function normalizeApiProductResult(payload) {
    var items = payload && Array.isArray(payload.data) ? payload.data : [];

    return {
      products: items,
      count: typeof payload.count === "number" ? payload.count : items.length,
      total: typeof payload.total === "number" ? payload.total : items.length,
      source: "api"
    };
  }

  async function loadProductsFromApi(state) {
    if (typeof apiClient.getJson !== "function" || typeof apiClient.buildQueryString !== "function") {
      throw new Error("Product API client is unavailable.");
    }

    var queryString = apiClient.buildQueryString(buildProductApiParams(state));
    var payload = await apiClient.getJson("/api/products" + queryString);
    return normalizeApiProductResult(payload);
  }

  function getFallbackProductResult(state) {
    var filtered = buildFilteredProducts(state);

    return {
      products: filtered,
      count: filtered.length,
      total: products.length,
      source: "fallback"
    };
  }

  function applyClientCategoryFilters(result) {
    var selectedCategories = getCheckedCategories();

    if (selectedCategories.length <= 1) {
      return result;
    }

    var filtered = result.products.filter(function (product) {
      return selectedCategories.indexOf(product.category) !== -1;
    });

    return {
      products: filtered,
      count: filtered.length,
      total: result.total,
      source: result.source
    };
  }

  function showApiFallbackNotice(error) {
    if (window.console && typeof window.console.warn === "function") {
      window.console.warn("ShopLite product API unavailable. Showing local catalog fallback.", error);
    }

    if (!fallbackNoticeShown) {
      showToast("Product API unavailable. Showing local preview catalog.");
      fallbackNoticeShown = true;
    }
  }

  async function loadProductResult(state) {
    try {
      return applyClientCategoryFilters(await loadProductsFromApi(state));
    } catch (error) {
      showApiFallbackNotice(error);
      return getFallbackProductResult(state);
    }
  }

  function updateActiveCategory(state) {
    document.querySelectorAll("[data-category-link]").forEach(function (link) {
      var isActive = state.tag === "deal" ? link.dataset.categoryLink === "deals" : link.dataset.categoryLink === state.category;
      link.classList.toggle("active", isActive);
    });
  }

  function titleForState(state) {
    if (state.query && state.category !== "all") {
      return 'Search results for "' + state.query + '" in ' + formatCategory(state.category);
    }
    if (state.query) {
      return 'Search results for "' + state.query + '"';
    }
    if (state.tag === "deal") {
      return "Today's Deals";
    }
    if (state.tag === "best-seller") {
      return "Best Sellers";
    }
    if (state.category !== "all") {
      return formatCategory(state.category);
    }
    return "All Products";
  }

  function subtitleForState(state, total) {
    if (state.tag === "deal") {
      return "Limited-time marketplace offers with orange savings tags.";
    }
    if (state.query) {
      return total + " item" + (total === 1 ? "" : "s") + " matched your search.";
    }
    if (state.category !== "all") {
      return "Browse all " + formatCategory(state.category).toLowerCase() + " products in the ShopLite catalog.";
    }
    return "Browse the full ShopLite catalog across every marketplace category.";
  }

  function updatePageHeading(state, total) {
    var title = document.getElementById("listingTitle");
    var subtitle = document.getElementById("listingSubtitle");
    var categoryLabel = document.querySelector('[data-role="current-category-label"]');

    if (title) {
      title.textContent = titleForState(state);
    }
    if (subtitle) {
      subtitle.textContent = subtitleForState(state, total);
    }
    if (categoryLabel) {
      categoryLabel.textContent = state.category !== "all" ? formatCategory(state.category) : (state.tag === "deal" ? "Deals" : "All categories");
    }
  }

  function updateUrl(state) {
    var params = new URLSearchParams();

    if (state.category !== "all") {
      params.set("category", state.category);
    }
    if (state.query) {
      params.set("query", state.query);
    }
    if (state.sort !== "featured") {
      params.set("sort", state.sort);
    }
    if (state.rating > 0) {
      params.set("rating", String(state.rating));
    }
    if (state.tag) {
      params.set("tag", state.tag);
    }
    if (state.maxPrice !== 800) {
      params.set("maxPrice", String(state.maxPrice));
    }

    var nextUrl = "products.html" + (params.toString() ? "?" + params.toString() : "");
    window.history.replaceState(null, "", nextUrl);
  }

  function applyStateToControls(state) {
    var categorySelect = document.getElementById("categorySelect");
    var searchInput = document.getElementById("searchInput");
    var sortSelect = document.getElementById("sortSelect");
    var priceRange = document.getElementById("priceRange");
    var priceValue = document.getElementById("priceValue");

    if (categorySelect) {
      categorySelect.value = state.category;
    }
    if (searchInput) {
      searchInput.value = state.query;
    }
    if (sortSelect) {
      sortSelect.value = state.sort;
    }
    if (priceRange) {
      priceRange.value = String(state.maxPrice);
    }
    if (priceValue && typeof formatPrice === "function") {
      priceValue.textContent = formatPrice(state.maxPrice);
    }

    document.querySelectorAll(".category-filter").forEach(function (input) {
      input.checked = state.category !== "all" && input.value === state.category;
    });

    var ratingInput = document.querySelector('.rating-filter[value="' + state.rating + '"]');
    if (ratingInput) {
      ratingInput.checked = true;
    }
  }

  function syncStateFromControls(state) {
    var categorySelect = document.getElementById("categorySelect");
    var searchInput = document.getElementById("searchInput");
    var sortSelect = document.getElementById("sortSelect");
    var priceRange = document.getElementById("priceRange");
    var selectedCategories = getCheckedCategories();

    state.category = selectedCategories.length === 1 ? selectedCategories[0] : (categorySelect ? categorySelect.value : "all");
    if (selectedCategories.length > 1) {
      state.category = "all";
    }
    state.query = searchInput ? searchInput.value.trim() : "";
    state.sort = sortSelect ? sortSelect.value : "featured";
    state.rating = getSelectedRating();
    state.maxPrice = priceRange ? Number(priceRange.value) : 800;
    state.visibleCount = productsPerPage;
    state.tag = "";

    if (categorySelect) {
      categorySelect.value = state.category;
    }

    return normalizeState(state);
  }

  function renderProducts(state, productResult) {
    var productGrid = document.getElementById("productGrid");
    var resultCount = document.getElementById("resultCount");
    var priceValue = document.getElementById("priceValue");
    var loadMoreButton = document.getElementById("loadMoreProducts");
    var currentResult = productResult || latestProductResult || getFallbackProductResult(state);
    var filtered = currentResult.products || [];
    var visibleProducts = filtered.slice(0, state.visibleCount);
    var resultTotal = typeof currentResult.count === "number" ? currentResult.count : filtered.length;

    if (priceValue && typeof formatPrice === "function") {
      priceValue.textContent = formatPrice(state.maxPrice);
    }
    if (resultCount) {
      resultCount.textContent = resultTotal + " item" + (resultTotal === 1 ? "" : "s");
    }

    updateActiveCategory(state);
    updatePageHeading(state, resultTotal);

    if (!productGrid) {
      return;
    }

    if (filtered.length === 0) {
      productGrid.innerHTML = '<div class="col-12"><div class="empty-state"><strong>No products match these filters.</strong><span>Try clearing filters, changing the category, or searching another term.</span></div></div>';
    } else if (typeof productCardTemplate === "function") {
      productGrid.innerHTML = visibleProducts.map(productCardTemplate).join("");
    } else {
      productGrid.innerHTML = visibleProducts.map(function (product) {
        return '<article class="col-xl-3 col-lg-4 col-md-6" data-product-id="' + product.id + '"><div class="product-card p-3"><h3 class="product-title">' + product.title + '</h3><span class="stars">' + buildStarsFallback(product.rating) + '</span></div></article>';
      }).join("");
    }

    productGrid.dataset.dataSource = currentResult.source || "local";

    if (loadMoreButton) {
      loadMoreButton.classList.toggle("d-none", state.visibleCount >= filtered.length);
      loadMoreButton.textContent = state.visibleCount >= filtered.length ? "All products loaded" : "Load More Products";
    }

    attachImageFallbacks(productGrid);
  }

  async function loadAndRenderProducts(state) {
    var requestId = latestRequestId + 1;
    latestRequestId = requestId;
    var productResult = await loadProductResult(state);

    if (requestId !== latestRequestId) {
      return;
    }

    latestProductResult = productResult;
    renderProducts(state, latestProductResult);
  }

  function initProductsPage() {
    var productListing = document.querySelector('[data-component="product-listing"]');
    if (!productListing) {
      return;
    }

    var state = normalizeState(getProductsPageState());
    applyStateToControls(state);
    loadAndRenderProducts(state);

    document.addEventListener("click", function (event) {
      var addToCartButton = event.target.closest('[data-action="add-to-cart"]');
      var clearButton = event.target.closest('[data-action="clear-filters"]');
      var loadMoreButton = event.target.closest('[data-action="load-more-products"]');

      if (addToCartButton) {
        event.preventDefault();
        addProductToCart(addToCartButton);
        return;
      }

      if (clearButton) {
        document.querySelectorAll(".category-filter").forEach(function (input) {
          input.checked = false;
        });
        var anyRating = document.querySelector('.rating-filter[value="0"]');
        if (anyRating) {
          anyRating.checked = true;
        }
        state = normalizeState({ category: "all", query: "", sort: "featured", rating: 0, maxPrice: 800, tag: "", visibleCount: productsPerPage });
        applyStateToControls(state);
        updateUrl(state);
        loadAndRenderProducts(state);
        return;
      }

      if (loadMoreButton) {
        state.visibleCount += productsPerPage;
        renderProducts(state, latestProductResult);
      }
    });

    document.addEventListener("change", function (event) {
      if (event.target.closest(".category-filter")) {
        state = syncStateFromControls(state);
        updateUrl(state);
        loadAndRenderProducts(state);
        return;
      }

      if (event.target.closest(".rating-filter")) {
        state = syncStateFromControls(state);
        updateUrl(state);
        loadAndRenderProducts(state);
        return;
      }

      if (event.target.closest('[data-action="sort-products"]')) {
        state = syncStateFromControls(state);
        updateUrl(state);
        loadAndRenderProducts(state);
      }
    });

    document.addEventListener("input", function (event) {
      if (event.target.closest('[data-field="max-price"]')) {
        state = syncStateFromControls(state);
        updateUrl(state);
        loadAndRenderProducts(state);
      }
    });

    var categorySelect = document.getElementById("categorySelect");
    if (categorySelect) {
      categorySelect.addEventListener("change", function () {
        document.querySelectorAll(".category-filter").forEach(function (input) {
          input.checked = input.value === categorySelect.value;
        });
        state = syncStateFromControls(state);
        updateUrl(state);
        loadAndRenderProducts(state);
      });
    }

    var searchInput = document.getElementById("searchInput");
    if (searchInput) {
      searchInput.addEventListener("input", function () {
        state.query = searchInput.value.trim();
      });
    }

    var searchForm = document.getElementById("searchForm");
    if (searchForm) {
      searchForm.addEventListener("submit", function (event) {
        event.preventDefault();
        state = syncStateFromControls(state);
        updateUrl(state);
        loadAndRenderProducts(state);
        productListing.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  window.ShopLitePages = window.ShopLitePages || {};
  window.ShopLitePages.products = initProductsPage;
}());
