(function () {
  "use strict";

  function getCartCountElements() {
    var elements = [];

    document.querySelectorAll('[data-role="cart-count"], #cartCount, .cart-count').forEach(function (element) {
      if (elements.indexOf(element) === -1) {
        elements.push(element);
      }
    });

    return elements;
  }

  function setGlobalCartCount(itemCount) {
    var nextCount = Number.isFinite(itemCount) ? itemCount : 0;

    getCartCountElements().forEach(function (element) {
      element.textContent = String(nextCount);
    });

    document.querySelectorAll('[data-action="open-cart"], #cartButton, .cart-link').forEach(function (cartLink) {
      cartLink.setAttribute("aria-label", "Shopping cart with " + nextCount + " items");
    });
  }

  async function syncGlobalCartCount() {
    var cartCountElements = getCartCountElements();
    var apiClient = window.ShopLiteApi || {};

    if (cartCountElements.length === 0) {
      return;
    }

    if (typeof apiClient.getJson !== "function") {
      return;
    }

    try {
      var cart = await apiClient.getJson("/api/cart");
      var itemCount = cart && cart.summary ? Number(cart.summary.itemCount) : NaN;

      if (Number.isFinite(itemCount)) {
        setGlobalCartCount(itemCount);
      }
    } catch (error) {
      if (window.console && typeof window.console.warn === "function") {
        window.console.warn("ShopLite cart count sync unavailable. Keeping static cart count fallback.", error);
      }
    }
  }

  function initializeCurrentPage() {
    var page = document.body ? document.body.dataset.page : "";
    var pageInitializers = window.ShopLitePages || {};
    var initializer = pageInitializers[page];

    initializeGlobalNavigation(page);
    syncGlobalCartCount();

    if (typeof initializer === "function") {
      initializer();
    }
  }

  function buildProductsUrlFromSearch(form) {
    var categoryField = form.querySelector('[data-field="search-category"]');
    var queryField = form.querySelector('[data-field="search-query"]');
    var params = new URLSearchParams();
    var category = categoryField ? categoryField.value : "all";
    var query = queryField ? queryField.value.trim() : "";

    if (category && category !== "all") {
      params.set("category", category);
    }

    if (query) {
      params.set("query", query);
    }

    var queryString = params.toString();
    return "products.html" + (queryString ? "?" + queryString : "");
  }

  function initializeGlobalNavigation(page) {
    document.addEventListener("click", function (event) {
      var cartEntry = event.target.closest('[data-action="open-cart"]');

      if (cartEntry) {
        event.preventDefault();
        window.location.assign("cart.html");
      }
    });

    document.addEventListener("submit", function (event) {
      var searchForm = event.target.closest('form[data-action="search-products"]');

      if (!searchForm || page === "products") {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      window.location.assign(buildProductsUrlFromSearch(searchForm));
    }, true);
  }

  window.ShopLiteCart = {
    setCount: setGlobalCartCount,
    syncCount: syncGlobalCartCount
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeCurrentPage);
  } else {
    initializeCurrentPage();
  }
}());
