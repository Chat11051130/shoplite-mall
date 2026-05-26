(function () {
  "use strict";

  var apiClient = window.ShopLiteApi || {};
  var orders = [];
  var orderCache = {};
  var staticTableMarkup = "";

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

  function formatDate(value) {
    if (!value) {
      return "Unknown date";
    }

    var date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value).slice(0, 10);
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }

  function dateValue(value) {
    return value ? String(value).slice(0, 10) : "";
  }

  function toTitleCase(value) {
    return String(value || "processing").split("-").map(function (part) {
      return part.charAt(0).toUpperCase() + part.slice(1);
    }).join(" ");
  }

  function statusClass(status) {
    return "status-" + String(status || "processing").toLowerCase();
  }

  function fullAddress(order) {
    return [order.shippingAddress, order.city, order.state, order.zip].filter(Boolean).join(", ");
  }

  function itemCount(order) {
    if (order.summary && Number.isFinite(Number(order.summary.itemCount))) {
      return Number(order.summary.itemCount);
    }

    return (order.items || []).reduce(function (count, item) {
      return count + (Number(item.quantity) || 1);
    }, 0);
  }

  function orderTotal(order) {
    return order.summary && Number.isFinite(Number(order.summary.total)) ? Number(order.summary.total) : 0;
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

  function getOrderRows() {
    return Array.prototype.slice.call(document.querySelectorAll('[data-component="admin-order-table"] tbody [data-order-id]'));
  }

  function setText(selector, value) {
    var element = document.querySelector(selector);
    if (element) {
      element.textContent = value;
    }
  }

  function updateStatusBadgeElement(element, status) {
    if (!element) {
      return;
    }

    element.className = "status-badge " + statusClass(status);
    element.textContent = toTitleCase(status);
  }

  function statusOptions(currentStatus) {
    return ["processing", "shipped", "delivered", "cancelled"].map(function (status) {
      return '<option value="' + status + '"' + (status === currentStatus ? " selected" : "") + ">" + toTitleCase(status) + "</option>";
    }).join("");
  }

  function orderRowTemplate(order) {
    var status = String(order.status || "processing").toLowerCase();
    var orderId = String(order.id || "");
    var customer = order.customerName || "ShopLite customer";
    var date = dateValue(order.createdAt);
    var items = itemCount(order);

    return [
      '<tr data-order-id="' + escapeHtml(orderId) + '" data-order-status="' + escapeHtml(status) + '" data-order-date="' + escapeHtml(date) + '" data-customer="' + escapeHtml(customer) + '" data-address="' + escapeHtml(fullAddress(order)) + '">',
      '  <td><div class="fw-bold">' + escapeHtml(orderId) + '</div><small class="text-muted">' + escapeHtml(formatDate(order.createdAt)) + "</small></td>",
      "  <td>" + escapeHtml(customer) + "</td>",
      "  <td>" + items + "</td>",
      '  <td class="fw-bold" data-role="admin-order-total">' + formatPrice(orderTotal(order)) + "</td>",
      '  <td><span data-status-badge data-role="admin-order-status" class="status-badge ' + statusClass(status) + '">' + toTitleCase(status) + "</span></td>",
      "  <td>",
      '    <select class="form-select form-select-sm" data-action="update-order-status" data-field="admin-order-status-update" aria-label="Update status for order ' + escapeHtml(orderId) + '">',
      statusOptions(status),
      "    </select>",
      "  </td>",
      '  <td class="text-end"><button class="btn btn-sm btn-outline-primary" type="button" data-action="view-admin-order-detail" data-bs-toggle="offcanvas" data-bs-target="#orderDetailPanel">View Details</button></td>',
      "</tr>"
    ].join("");
  }

  function updateDateFilterOptions() {
    var dateField = document.querySelector('[data-field="admin-order-date-filter"]');
    var existingValue = dateField ? dateField.value : "";
    var dates = {};

    if (!dateField) {
      return;
    }

    orders.forEach(function (order) {
      var date = dateValue(order.createdAt);
      if (date) {
        dates[date] = true;
      }
    });

    dateField.innerHTML = '<option value="">All dates</option>' + Object.keys(dates).sort().reverse().map(function (date) {
      return '<option value="' + escapeHtml(date) + '">' + escapeHtml(formatDate(date)) + "</option>";
    }).join("");

    if (existingValue && dates[existingValue]) {
      dateField.value = existingValue;
    }
  }

  function renderOrders(nextOrders) {
    var tableBody = document.querySelector('[data-component="admin-order-table"] tbody');
    orders = Array.isArray(nextOrders) ? nextOrders : [];
    orderCache = {};

    orders.forEach(function (order) {
      orderCache[order.id] = order;
    });

    if (!tableBody) {
      return;
    }

    tableBody.innerHTML = orders.map(orderRowTemplate).join("");
    updateDateFilterOptions();
    applyOrderFilters();

    if (orders[0]) {
      updateDetailPanel(orders[0]);
    }
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

  function renderDetailItems(order) {
    var container = document.querySelector('[data-role="detail-items"]');
    var items = order && Array.isArray(order.items) ? order.items : [];

    if (!container) {
      return;
    }

    container.innerHTML = items.map(function (item) {
      return [
        '<div class="d-flex gap-3 mb-3">',
        '  <img class="order-thumb" src="' + escapeHtml(item.image || "assets/images/placeholder-product.svg") + '" alt="' + escapeHtml(item.title || "ShopLite product") + '">',
        "  <div>",
        "    <strong>" + escapeHtml(item.title || "ShopLite product") + "</strong>",
        '    <p class="muted-note mb-0">Qty ' + (Number(item.quantity) || 1) + ", " + formatPrice(item.price) + "</p>",
        "  </div>",
        "</div>"
      ].join("");
    }).join("");
  }

  function updateDetailPanel(order) {
    var statusBadge = document.querySelector('[data-role="detail-status"]');
    var paymentMethod = order && order.paymentMethod ? toTitleCase(order.paymentMethod) : "Mock payment";

    if (!order) {
      return;
    }

    setText('[data-role="detail-order-id"]', order.id || "");
    setText('[data-role="detail-customer"]', order.customerName || "ShopLite customer");
    setText('[data-role="detail-address"]', "Shipping to " + fullAddress(order));
    setText('[data-role="detail-total"]', formatPrice(orderTotal(order)));
    updateStatusBadgeElement(statusBadge, order.status || "processing");
    renderDetailItems(order);

    var summaryLines = document.querySelectorAll('[data-component="order-detail-panel"] .summary-line strong');
    if (summaryLines[0]) {
      summaryLines[0].textContent = paymentMethod + " confirmed";
    }
    if (summaryLines[1]) {
      summaryLines[1].textContent = "Backend order detail";
    }
  }

  async function loadOrders() {
    if (typeof apiClient.getJson !== "function") {
      showToast("Order API is unavailable.");
      return;
    }

    try {
      var response = await apiClient.getJson("/api/admin/orders");
      renderOrders(response && Array.isArray(response.data) ? response.data : []);
      showToast("Loaded " + (response && response.meta ? response.meta.count : orders.length) + " backend orders.");
    } catch (error) {
      var tableBody = document.querySelector('[data-component="admin-order-table"] tbody');
      if (tableBody && staticTableMarkup) {
        tableBody.innerHTML = staticTableMarkup;
        applyOrderFilters();
      }
      showToast(error && error.message ? error.message : "Unable to load backend orders.");
    }
  }

  async function openOrderDetail(row) {
    var orderId = row ? row.dataset.orderId : "";
    var order = orderCache[orderId];

    if (!orderId) {
      return;
    }

    if (typeof apiClient.getJson === "function") {
      try {
        var response = await apiClient.getJson("/api/admin/orders/" + encodeURIComponent(orderId));
        order = response && response.data ? response.data : order;
        orderCache[orderId] = order;
      } catch (error) {
        showToast(error && error.message ? error.message : "Unable to load order detail.");
      }
    }

    if (order) {
      updateDetailPanel(order);
    }
  }

  function updateRowStatus(row, order) {
    var status = String(order.status || "processing").toLowerCase();
    var statusSelect = row.querySelector('[data-action="update-order-status"]');
    row.dataset.orderStatus = status;
    updateStatusBadgeElement(row.querySelector('[data-role="admin-order-status"]'), status);

    if (statusSelect) {
      statusSelect.value = status;
    }
  }

  async function updateOrderStatus(row, status) {
    var orderId = row ? row.dataset.orderId : "";

    if (!orderId || typeof apiClient.patchJson !== "function") {
      return;
    }

    try {
      var response = await apiClient.patchJson("/api/admin/orders/" + encodeURIComponent(orderId) + "/status", {
        status: status
      });
      var order = response && response.data ? response.data : null;

      if (order) {
        orderCache[order.id] = order;
        orders = orders.map(function (nextOrder) {
          return nextOrder.id === order.id ? order : nextOrder;
        });
        updateRowStatus(row, order);
        updateDetailPanel(order);
        applyOrderFilters();
        showToast("Order " + order.id + " status updated to " + toTitleCase(order.status) + ".");
      }
    } catch (error) {
      showToast(error && error.message ? error.message : "Unable to update order status.");
      if (row && orderCache[orderId]) {
        updateRowStatus(row, orderCache[orderId]);
      }
    }
  }

  function initAdminOrdersPage() {
    var orderTable = document.querySelector('[data-component="admin-order-table"]');
    var tableBody = orderTable ? orderTable.querySelector("tbody") : null;
    if (!orderTable) {
      return;
    }

    staticTableMarkup = tableBody ? tableBody.innerHTML : "";

    document.addEventListener("click", function (event) {
      var filterButton = event.target.closest('button[data-action="filter-admin-orders"]');
      var detailButton = event.target.closest('[data-action="view-admin-order-detail"]');

      if (filterButton) {
        var visibleCount = applyOrderFilters();
        showToast(visibleCount + " order" + (visibleCount === 1 ? "" : "s") + " visible.");
        return;
      }

      if (detailButton) {
        openOrderDetail(detailButton.closest("[data-order-id]"));
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
        updateOrderStatus(statusSelect.closest("[data-order-id]"), statusSelect.value);
        return;
      }

      if (filterControl) {
        applyOrderFilters();
      }
    });

    loadOrders();
  }

  window.ShopLitePages = window.ShopLitePages || {};
  window.ShopLitePages["admin-orders"] = initAdminOrdersPage;
}());
