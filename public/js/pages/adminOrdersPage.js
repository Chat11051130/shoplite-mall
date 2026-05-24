(function () {
  "use strict";

  var orderDetails = {
    "SL-2026-0523-1048": [
      { name: "AeroBook laptop", meta: "Qty 1, $679.99", image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=120&q=80", alt: "Laptop" },
      { name: "PulseWave headphones", meta: "Qty 1, $129.95", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=120&q=80", alt: "Headphones" }
    ],
    "SL-2026-0518-0921": [
      { name: "StrideFlex everyday running sneakers", meta: "Qty 1, $74.50", image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=120&q=80", alt: "Sneakers" }
    ],
    "SL-2026-0506-2188": [
      { name: "Organic pantry starter snack box", meta: "Qty 1, $36.50", image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=120&q=80", alt: "Grocery box" }
    ],
    "SL-2026-0502-6410": [
      { name: "USB desk hub", meta: "Qty 1", image: "https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=120&q=80", alt: "Desk hub" },
      { name: "Commuter backpack", meta: "Qty 1", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=120&q=80", alt: "Backpack" },
      { name: "Coffee sampler", meta: "Qty 1", image: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=120&q=80", alt: "Coffee sampler" }
    ]
  };

  function toTitleCase(value) {
    return value.split("-").map(function (part) {
      return part.charAt(0).toUpperCase() + part.slice(1);
    }).join(" ");
  }

  function statusClass(status) {
    return "status-" + status;
  }

  function getOrderRows() {
    return Array.prototype.slice.call(document.querySelectorAll('[data-component="admin-order-table"] tbody [data-order-id]'));
  }

  function setText(selector, value) {
    var element = document.querySelector(selector);
    if (element) {
      element.textContent = value;
    }
  }

  function showToast(message) {
    var toast = document.getElementById("adminOrdersToast");
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

  function updateBadge(row, status) {
    var badge = row.querySelector('[data-role="admin-order-status"]');
    if (!badge) {
      return;
    }

    badge.className = "status-badge " + statusClass(status);
    badge.textContent = toTitleCase(status);
    row.dataset.orderStatus = status;
  }

  function applyOrderFilters() {
    var queryField = document.querySelector('[data-field="admin-order-search-query"]');
    var statusField = document.querySelector('[data-field="admin-order-status-filter"]');
    var dateField = document.querySelector('[data-field="admin-order-date-filter"]');
    var query = queryField ? queryField.value.trim().toLowerCase() : "";
    var status = statusField ? statusField.value : "all";
    var date = dateField ? dateField.value : "";
    var visibleCount = 0;

    getOrderRows().forEach(function (row) {
      var textMatches = !query || row.textContent.toLowerCase().indexOf(query) !== -1 || (row.dataset.orderId || "").toLowerCase().indexOf(query) !== -1;
      var statusMatches = status === "all" || row.dataset.orderStatus === status;
      var dateMatches = !date || row.dataset.orderDate === date;
      var shouldShow = textMatches && statusMatches && dateMatches;

      row.classList.toggle("d-none", !shouldShow);

      if (shouldShow) {
        visibleCount += 1;
      }
    });

    var emptyState = document.getElementById("adminOrderEmptyState");
    if (emptyState) {
      emptyState.classList.toggle("d-none", visibleCount !== 0);
    }

    return visibleCount;
  }

  function renderDetailItems(orderId) {
    var container = document.querySelector('[data-role="detail-items"]');
    if (!container) {
      return;
    }

    var items = orderDetails[orderId] || [];
    container.innerHTML = items.map(function (item) {
      return '<div class="d-flex gap-3 mb-3"><img class="order-thumb" src="' + item.image + '" alt="' + item.alt + '"><div><strong>' + item.name + '</strong><p class="muted-note mb-0">' + item.meta + '</p></div></div>';
    }).join("");
  }

  function updateDetailPanel(row) {
    var orderId = row.dataset.orderId || "";
    var status = row.dataset.orderStatus || "processing";
    var statusBadge = document.querySelector('[data-role="detail-status"]');
    var total = row.querySelector('[data-role="admin-order-total"]');

    setText('[data-role="detail-order-id"]', orderId);
    setText('[data-role="detail-customer"]', row.dataset.customer || "");
    setText('[data-role="detail-address"]', "Shipping to " + (row.dataset.address || ""));
    setText('[data-role="detail-total"]', total ? total.textContent : "");

    if (statusBadge) {
      statusBadge.className = "status-badge " + statusClass(status);
      statusBadge.textContent = toTitleCase(status);
    }

    renderDetailItems(orderId);
  }

  function initAdminOrdersPage() {
    var orderTable = document.querySelector('[data-component="admin-order-table"]');
    if (!orderTable) {
      return;
    }

    document.addEventListener("click", function (event) {
      var filterButton = event.target.closest('button[data-action="filter-admin-orders"]');
      var detailButton = event.target.closest('[data-action="view-admin-order-detail"]');

      if (filterButton) {
        var visibleCount = applyOrderFilters();
        showToast(visibleCount + " order" + (visibleCount === 1 ? "" : "s") + " visible.");
        return;
      }

      if (detailButton) {
        var detailRow = detailButton.closest("[data-order-id]");
        if (detailRow) {
          updateDetailPanel(detailRow);
        }
      }
    });

    document.addEventListener("input", function (event) {
      if (event.target.closest('[data-field="admin-order-search-query"]')) {
        applyOrderFilters();
      }
    });

    document.addEventListener("change", function (event) {
      var statusSelect = event.target.closest('[data-action="update-order-status"]');
      var filterControl = event.target.closest('[data-action="filter-admin-orders"]');

      if (statusSelect) {
        var row = statusSelect.closest("[data-order-id]");
        if (row) {
          updateBadge(row, statusSelect.value);
          updateDetailPanel(row);
          applyOrderFilters();
          showToast("Order " + row.dataset.orderId + " status updated to " + toTitleCase(statusSelect.value) + ".");
        }
        return;
      }

      if (filterControl) {
        applyOrderFilters();
      }
    });

    var firstRow = getOrderRows()[0];
    if (firstRow) {
      updateDetailPanel(firstRow);
    }

    applyOrderFilters();
  }

  window.ShopLitePages = window.ShopLitePages || {};
  window.ShopLitePages["admin-orders"] = initAdminOrdersPage;
}());
