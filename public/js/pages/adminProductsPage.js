(function () {
  "use strict";

  var apiClient = window.ShopLiteApi || {};
  var products = [];

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[character];
    });
  }

  function formatPrice(value) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(Number(value) || 0);
  }

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

  function productStatus(product) {
    var tag = String(product.tag || product.badge || "").toLowerCase();
    var stock = Number(product.stock) || 0;

    if (tag === "draft" || stock === 0) {
      return "draft";
    }

    if (tag === "low-stock" || stock <= 20) {
      return "low-stock";
    }

    return "active";
  }

  function statusLabel(status) {
    if (status === "low-stock") {
      return "Low stock";
    }

    return status === "draft" ? "Draft" : "Active";
  }

  function statusClass(status) {
    if (status === "low-stock") {
      return "status-low";
    }

    return status === "draft" ? "status-draft" : "status-active";
  }

  function productRowTemplate(product) {
    var status = productStatus(product);
    var title = escapeHtml(product.title);
    var category = escapeHtml(product.category);
    var image = escapeHtml(product.image || "assets/images/placeholder-product.svg");
    var alt = escapeHtml(product.alt || product.title || "ShopLite product");

    return [
      '<tr data-product-id="' + Number(product.id) + '" data-category="' + category + '" data-status="' + status + '">',
      "  <td>",
      '    <div class="d-flex align-items-center gap-3">',
      '      <img class="table-thumb" src="' + image + '" alt="' + alt + '">',
      '      <div><strong>' + title + '</strong><p class="muted-note mb-0">SKU SL-' + category.slice(0, 2).toUpperCase() + "-" + Number(product.id).toString().padStart(4, "0") + "</p></div>",
      "    </div>",
      "  </td>",
      "  <td>" + category.charAt(0).toUpperCase() + category.slice(1) + "</td>",
      '  <td class="fw-bold">' + formatPrice(product.price) + "</td>",
      "  <td>" + Number(product.stock || 0) + "</td>",
      '  <td><span class="status-badge ' + statusClass(status) + '" data-role="product-status">' + statusLabel(status) + "</span></td>",
      '  <td class="text-end">',
      '    <button class="btn btn-sm btn-outline-primary" type="button" data-action="edit-product"><i class="bi bi-pencil" aria-hidden="true"></i> Edit</button>',
      '    <button class="btn btn-sm btn-outline-danger" type="button" data-action="delete-product"><i class="bi bi-trash" aria-hidden="true"></i> Delete</button>',
      "  </td>",
      "</tr>"
    ].join("");
  }

  function getProductRows() {
    return Array.prototype.slice.call(document.querySelectorAll('[data-component="admin-product-table"] tbody [data-product-id]'));
  }

  function getFilterValue(selector) {
    var element = document.querySelector(selector);
    return element ? element.value : "all";
  }

  function renderProducts(nextProducts) {
    var tableBody = document.querySelector('[data-component="admin-product-table"] tbody');
    products = Array.isArray(nextProducts) ? nextProducts : [];

    if (!tableBody) {
      return;
    }

    tableBody.innerHTML = products.map(productRowTemplate).join("");
    applyProductFilters();
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

  async function loadProducts() {
    if (typeof apiClient.getJson !== "function") {
      showToast("Product API is unavailable.");
      return;
    }

    try {
      var response = await apiClient.getJson("/api/products");
      renderProducts(response && Array.isArray(response.data) ? response.data : []);
      showToast("Loaded " + (response && response.data ? response.data.length : 0) + " products from the backend.");
    } catch (error) {
      showToast(error && error.message ? error.message : "Unable to load backend products.");
    }
  }

  async function deleteProduct(row) {
    var productId = row ? row.dataset.productId : "";
    var productName = row && row.querySelector("strong") ? row.querySelector("strong").textContent : "Product";

    if (!productId || typeof apiClient.deleteJson !== "function") {
      return;
    }

    try {
      await apiClient.deleteJson("/api/products/" + encodeURIComponent(productId));
      products = products.filter(function (product) {
        return Number(product.id) !== Number(productId);
      });
      renderProducts(products);
      showToast(productName + " was deleted from the backend catalog.");
    } catch (error) {
      showToast(error && error.message ? error.message : "Unable to delete this product.");
    }
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
        deleteProduct(deleteButton.closest("[data-product-id]"));
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

    loadProducts();
  }

  window.ShopLitePages = window.ShopLitePages || {};
  window.ShopLitePages["admin-products"] = initAdminProductsPage;
}());
