(function () {
  "use strict";

  function initializeCurrentPage() {
    var page = document.body ? document.body.dataset.page : "";
    var pageInitializers = window.ShopLitePages || {};
    var initializer = pageInitializers[page];

    if (typeof initializer === "function") {
      initializer();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeCurrentPage);
  } else {
    initializeCurrentPage();
  }
}());
