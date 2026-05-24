(function () {
  "use strict";

  function initializeCurrentPage() {
    var page = document.body ? document.body.dataset.page : "";
    var pageInitializers = window.ShopLitePages || {};
    var initializer = pageInitializers[page];

    initializeGlobalNavigation(page);

    if (typeof initializer === "function") {
      initializer();
    }
  }

  function buildHomeUrlFromSearch(form) {
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
    return "index.html" + (queryString ? "?" + queryString : "");
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

      if (!searchForm || page === "home") {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      window.location.assign(buildHomeUrlFromSearch(searchForm));
    }, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeCurrentPage);
  } else {
    initializeCurrentPage();
  }
}());
