(function () {
  "use strict";

  function showToast(message) {
    var toast = document.getElementById("adminProductsToast");
    if (!toast) {
      return;
    }

    var body = toast.querySelector(".toast-body");
    if (body) {
      body.textContent = message;
    }

    toast.classList.add("show");
    toast.style.display = "block";

    if (window.bootstrap) {
      var existingToast = window.bootstrap.Toast.getInstance(toast);
      if (existingToast) {
        existingToast.dispose();
      }
      window.bootstrap.Toast.getOrCreateInstance(toast, { autohide: false }).show();
      toast.classList.add("show");
      toast.style.display = "block";
    }
  }

  function getProductRows() {
    return Array.prototype.slice.call(document.querySelectorAll('[data-component="admin-product-table"] tbody [data-product-id]'));
  }

  function getFilterValue(selector) {
    var element = document.querySelector(selector);
    return element ? element.value : "all";
  }

  function applyProductFilters() {
    var searchInput = document.querySelector('[data-action="search-admin-products"]');
    var query = searchInput ? searchInput.value.trim().toLowerCase() : "";
    var category = getFilterValue('[data-field="admin-product-category-filter"]');
    var status = getFilterValue('[data-field="admin-product-status-filter"]');
    var visibleCount = 0;

    getProductRows().forEach(function (row) {
      var categoryMatches = category === "all" || row.dataset.category === category;
      var statusMatches = status === "all" || row.dataset.status === status;
      var textMatches = !query || row.textContent.toLowerCase().indexOf(query) !== -1;
      var shouldShow = categoryMatches && statusMatches && textMatches;

      row.classList.toggle("d-none", !shouldShow);

      if (shouldShow) {
        visibleCount += 1;
      }
    });

    var emptyState = document.getElementById("adminProductEmptyState");
    if (emptyState) {
      emptyState.classList.toggle("d-none", visibleCount !== 0);
    }

    return visibleCount;
  }

  function initAdminProductsPage() {
    var productTable = document.querySelector('[data-component="admin-product-table"]');
    if (!productTable) {
      return;
    }

    document.addEventListener("click", function (event) {
      var addButton = event.target.closest('[data-action="open-add-product-modal"]');
      var editButton = event.target.closest('[data-action="edit-product"]');
      var deleteButton = event.target.closest('[data-action="delete-product"]');
      var filterButton = event.target.closest('button[data-action="filter-admin-products"]');

      if (addButton) {
        window.location.href = "admin-product-form.html";
        return;
      }

      if (editButton) {
        var editRow = editButton.closest("[data-product-id]");
        var productId = editRow ? editRow.dataset.productId : "";
        window.location.href = "admin-product-form.html?productId=" + encodeURIComponent(productId);
        return;
      }

      if (deleteButton) {
        var deleteRow = deleteButton.closest("[data-product-id]");
        if (deleteRow) {
          var productName = deleteRow.querySelector("strong") ? deleteRow.querySelector("strong").textContent : "Product";
          deleteRow.remove();
          applyProductFilters();
          showToast(productName + " removed from this static admin preview.");
        }
        return;
      }

      if (filterButton) {
        var visibleCount = applyProductFilters();
        showToast(visibleCount + " product" + (visibleCount === 1 ? "" : "s") + " visible.");
      }
    });

    document.addEventListener("input", function (event) {
      if (event.target.closest('[data-action="search-admin-products"]')) {
        applyProductFilters();
      }
    });

    document.addEventListener("change", function (event) {
      if (event.target.closest('[data-action="filter-admin-products"]')) {
        applyProductFilters();
      }
    });

    applyProductFilters();
  }

  window.ShopLitePages = window.ShopLitePages || {};
  window.ShopLitePages["admin-products"] = initAdminProductsPage;
}());
