(function () {
  "use strict";

  var apiClient = window.ShopLiteApi || {};
  var orderCache = {};
  var staticOrdersMarkup = "";

  function formatPrice(value) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(value);
  }

  function formatDate(value) {
    var date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value || "Today";
    }

    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric"
    });
  }

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

  function getCartCountElement() {
    return document.getElementById("cartCount") || document.querySelector('[data-role="cart-count"]');
  }

  function setCartCount(itemCount) {
    var cartCount = getCartCountElement();
    var cartButton = document.getElementById("cartButton") || document.querySelector('[data-action="open-cart"]');
    var nextCount = Number.isFinite(itemCount) ? itemCount : 0;

    if (cartCount) {
      cartCount.textContent = String(nextCount);
    }

    if (cartButton) {
      cartButton.setAttribute("aria-label", "Shopping cart with " + nextCount + " items");
    }
  }

  function updateCartCount(amount) {
    var cartCount = getCartCountElement();
    var currentCount = cartCount ? Number.parseInt(cartCount.textContent || "0", 10) : 0;

    setCartCount(currentCount + amount);
  }

  function showToast(message) {
    var toast = document.getElementById("ordersToast");
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

  function getOrderCards() {
    return Array.prototype.slice.call(document.querySelectorAll('[data-component="orders-list"] [data-order-id]'));
  }

  function getActiveFilter() {
    var activeButton = document.querySelector('[data-action="filter-orders"].active');
    return activeButton ? activeButton.dataset.orderFilter || "all" : "all";
  }

  function applyOrderFilters() {
    var searchInput = document.querySelector('[data-field="order-search-query"]');
    var query = searchInput ? searchInput.value.trim().toLowerCase() : "";
    var filter = getActiveFilter();
    var visibleCount = 0;

    getOrderCards().forEach(function (card) {
      var cardStatus = card.dataset.orderStatus || "";
      var statusMatches = filter === "all" || filter === cardStatus;
      var textMatches = !query || card.textContent.toLowerCase().indexOf(query) !== -1 || (card.dataset.orderId || "").toLowerCase().indexOf(query) !== -1;
      var shouldShow = statusMatches && textMatches;

      card.classList.toggle("d-none", !shouldShow);

      if (shouldShow) {
        visibleCount += 1;
      }
    });

    var emptyState = document.getElementById("ordersEmptyState");
    if (emptyState) {
      emptyState.classList.toggle("d-none", visibleCount !== 0);
    }

    return visibleCount;
  }

  function activateFilter(button) {
    document.querySelectorAll('[data-action="filter-orders"]').forEach(function (filterButton) {
      var isActive = filterButton === button;
      filterButton.classList.toggle("active", isActive);
      filterButton.setAttribute("aria-selected", isActive ? "true" : "false");
    });
  }

  function formatStatus(status) {
    return status ? status.charAt(0).toUpperCase() + status.slice(1) : "Processing";
  }

  function orderTitle(order) {
    if (!order.items || order.items.length === 0) {
      return "ShopLite order";
    }

    if (order.items.length === 1) {
      return order.items[0].title;
    }

    return order.items[0].title + " and " + (order.items.length - 1) + " more item" + (order.items.length === 2 ? "" : "s");
  }

  function deliveryNote(order) {
    return order.status === "processing" ? "Order is being prepared for shipment." : "Order status is " + formatStatus(order.status).toLowerCase() + ".";
  }

  function fullShippingAddress(order) {
    return [order.shippingAddress, order.city, order.state, order.zip].filter(Boolean).join(", ");
  }

  function orderCardTemplate(order) {
    var status = order.status || "processing";
    var title = orderTitle(order);
    var total = order.summary ? order.summary.total : 0;
    var itemCount = order.summary ? order.summary.itemCount : (order.items || []).length;
    var images = (order.items || []).slice(0, 3).map(function (item) {
      return '<img class="order-thumb" src="' + escapeHtml(item.image || "assets/images/placeholder-product.svg") + '" alt="' + escapeHtml(item.title) + '">';
    }).join("");

    return [
      '<section class="surface-card order-card" data-order-id="' + escapeHtml(order.id) + '" data-order-status="' + escapeHtml(status) + '" data-order-item-count="' + itemCount + '" data-order-date="' + escapeHtml(formatDate(order.createdAt)) + '" data-order-title="' + escapeHtml(title) + '" data-order-total="' + escapeHtml(formatPrice(total)) + '" data-delivery-note="' + escapeHtml(deliveryNote(order)) + '" data-payment-status="Mock payment recorded" data-shipping-address="' + escapeHtml(fullShippingAddress(order)) + '">',
      '  <div class="order-card-header">',
      "    <div>",
      "      <strong>Order " + escapeHtml(order.id) + "</strong>",
      '      <p class="muted-note mb-0">Placed ' + escapeHtml(formatDate(order.createdAt)) + "</p>",
      "    </div>",
      '    <div class="text-end">',
      '      <span class="status-badge status-' + escapeHtml(status) + '" data-role="order-status">' + escapeHtml(formatStatus(status)) + "</span>",
      '      <div class="current-price fs-5 mt-2" data-role="order-total">' + formatPrice(total) + "</div>",
      "    </div>",
      "  </div>",
      '  <div class="d-flex flex-wrap gap-3 align-items-center">',
      images,
      '    <div class="flex-grow-1">',
      "      <strong>" + escapeHtml(title) + "</strong>",
      '      <p class="muted-note mb-0">' + itemCount + " item" + (itemCount === 1 ? "" : "s") + ". " + escapeHtml(deliveryNote(order)) + "</p>",
      "    </div>",
      '    <div class="order-card-actions">',
      '      <button class="btn btn-outline-accent" type="button" data-action="view-order-detail">View Details</button>',
      '      <button class="btn btn-accent" type="button" data-action="reorder">Reorder</button>',
      "    </div>",
      "  </div>",
      "</section>"
    ].join("");
  }

  function renderOrders(orders) {
    var ordersList = document.querySelector('[data-component="orders-list"]');
    if (!ordersList) {
      return;
    }

    orderCache = {};
    orders.forEach(function (order) {
      orderCache[order.id] = order;
    });

    ordersList.dataset.dataSource = "api";
    ordersList.innerHTML = orders.map(orderCardTemplate).join("");
    applyOrderFilters();
  }

  async function loadOrders() {
    var ordersList = document.querySelector('[data-component="orders-list"]');

    if (typeof apiClient.getJson !== "function") {
      return;
    }

    try {
      var response = await apiClient.getJson("/api/orders");
      var orders = response && Array.isArray(response.data) ? response.data : [];
      renderOrders(orders);
    } catch (error) {
      if (ordersList && staticOrdersMarkup) {
        ordersList.dataset.dataSource = "fallback";
        ordersList.innerHTML = staticOrdersMarkup;
      }
      if (window.console && typeof window.console.warn === "function") {
        window.console.warn("ShopLite orders API unavailable. Using static order fallback.", error);
      }
      showToast("Orders API unavailable. Showing local order preview.");
      applyOrderFilters();
    }
  }

  function setDetailText(role, value) {
    var element = document.querySelector('[data-role="' + role + '"]');
    if (element) {
      element.textContent = value;
    }
  }

  function getOrderDetailFromApiOrder(order) {
    var total = order.summary ? formatPrice(order.summary.total) : "$0.00";
    var itemCount = order.summary ? order.summary.itemCount : (order.items || []).length;
    var title = orderTitle(order);

    return {
      id: order.id,
      status: order.status || "processing",
      statusLabel: formatStatus(order.status || "processing"),
      date: formatDate(order.createdAt),
      title: title,
      total: total,
      itemCount: itemCount,
      deliveryNote: deliveryNote(order),
      paymentStatus: "Mock payment recorded",
      shippingAddress: fullShippingAddress(order)
    };
  }

  function getOrderCardDetail(card) {
    var apiOrder = orderCache[card.dataset.orderId || ""];

    if (apiOrder) {
      return getOrderDetailFromApiOrder(apiOrder);
    }

    var titleElement = card.querySelector(".flex-grow-1 strong");
    var totalElement = card.querySelector('[data-role="order-total"]');
    var noteElement = card.querySelector(".flex-grow-1 .muted-note");
    var statusElement = card.querySelector('[data-role="order-status"]');
    var status = card.dataset.orderStatus || (statusElement ? statusElement.textContent.trim().toLowerCase() : "processing");
    var itemCount = Number.parseInt(card.dataset.orderItemCount || "1", 10);

    return {
      id: card.dataset.orderId || "Unknown order",
      status: status,
      statusLabel: statusElement ? statusElement.textContent.trim() : formatStatus(status),
      date: card.dataset.orderDate || "May 2026",
      title: card.dataset.orderTitle || (titleElement ? titleElement.textContent.trim() : "ShopLite order items"),
      total: card.dataset.orderTotal || (totalElement ? totalElement.textContent.trim() : "$0.00"),
      itemCount: Number.isNaN(itemCount) ? 1 : itemCount,
      deliveryNote: card.dataset.deliveryNote || (noteElement ? noteElement.textContent.trim() : "Delivery information is ready for this order."),
      paymentStatus: card.dataset.paymentStatus || "Mock payment status confirmed.",
      shippingAddress: card.dataset.shippingAddress || "Campus District saved address placeholder."
    };
  }

  function openOrderDetailPanel(card) {
    var panel = document.querySelector('[data-component="order-detail-panel"]');
    var detail = getOrderCardDetail(card);
    var statusBadge = document.querySelector('[data-role="detail-order-status"]');

    if (!panel) {
      return;
    }

    setDetailText("detail-order-id", detail.id);
    setDetailText("detail-order-date", detail.date);
    setDetailText("detail-order-items", detail.title + ", " + detail.itemCount + " item" + (detail.itemCount === 1 ? "" : "s"));
    setDetailText("detail-order-total", detail.total);
    setDetailText("detail-delivery-note", detail.deliveryNote);
    setDetailText("detail-shipping-address", detail.shippingAddress);
    setDetailText("detail-payment-status", detail.paymentStatus);

    if (statusBadge) {
      statusBadge.className = "status-badge status-" + detail.status;
      statusBadge.textContent = detail.statusLabel;
    }

    if (window.bootstrap && window.bootstrap.Offcanvas) {
      window.bootstrap.Offcanvas.getOrCreateInstance(panel).show();
    } else {
      panel.classList.add("show");
      panel.style.visibility = "visible";
    }
  }

  function closeOrderDetailPanel() {
    var panel = document.querySelector('[data-component="order-detail-panel"]');
    if (!panel) {
      return;
    }

    if (window.bootstrap && window.bootstrap.Offcanvas) {
      window.bootstrap.Offcanvas.getOrCreateInstance(panel).hide();
    } else {
      panel.classList.remove("show");
      panel.style.visibility = "hidden";
    }
  }

  async function reorderFromApiOrder(order) {
    if (!order || !Array.isArray(order.items) || typeof apiClient.postJson !== "function") {
      return false;
    }

    var latestCart = null;

    for (var index = 0; index < order.items.length; index += 1) {
      latestCart = await apiClient.postJson("/api/cart/items", {
        productId: order.items[index].productId,
        quantity: order.items[index].quantity || 1
      });
    }

    if (latestCart && latestCart.summary) {
      setCartCount(Number(latestCart.summary.itemCount));
    }

    return true;
  }

  function initOrdersPage() {
    var ordersList = document.querySelector('[data-component="orders-list"]');
    if (!ordersList) {
      return;
    }

    staticOrdersMarkup = ordersList.innerHTML;
    loadOrders();

    document.addEventListener("click", function (event) {
      var filterButton = event.target.closest('[data-action="filter-orders"]');
      var viewButton = event.target.closest('[data-action="view-order-detail"]');
      var reorderButton = event.target.closest('[data-action="reorder"]');
      var closeDetailButton = event.target.closest('[data-action="close-order-detail"]');
      var cartButton = event.target.closest('[data-action="open-cart"]');

      if (filterButton) {
        activateFilter(filterButton);
        applyOrderFilters();
        return;
      }

      if (viewButton) {
        var detailCard = viewButton.closest("[data-order-id]");
        if (detailCard) {
          openOrderDetailPanel(detailCard);
        }
        return;
      }

      if (closeDetailButton) {
        closeOrderDetailPanel();
        return;
      }

      if (reorderButton) {
        var reorderCard = reorderButton.closest("[data-order-id]");
        var order = reorderCard ? orderCache[reorderCard.dataset.orderId] : null;
        var itemCount = reorderCard ? Number.parseInt(reorderCard.dataset.orderItemCount || "1", 10) : 1;

        reorderFromApiOrder(order).then(function (apiUpdated) {
          if (!apiUpdated) {
            updateCartCount(Number.isNaN(itemCount) ? 1 : itemCount);
          }
          showToast("Items from order " + (reorderCard ? reorderCard.dataset.orderId : "") + " were added to your cart.");
        }).catch(function (error) {
          if (window.console && typeof window.console.warn === "function") {
            window.console.warn("ShopLite reorder API unavailable. Using local cart count fallback.", error);
          }
          updateCartCount(Number.isNaN(itemCount) ? 1 : itemCount);
          showToast("Items from order " + (reorderCard ? reorderCard.dataset.orderId : "") + " were added to your cart preview.");
        });
        return;
      }

      if (cartButton) {
        window.location.href = "cart.html";
      }
    });

    var orderSearchForm = document.getElementById("orderSearchForm");
    if (orderSearchForm) {
      orderSearchForm.addEventListener("submit", function (event) {
        event.preventDefault();
        var visibleCount = applyOrderFilters();
        showToast(visibleCount + " matching order" + (visibleCount === 1 ? "" : "s") + " found.");
      });
    }

    var orderSearchInput = document.querySelector('[data-field="order-search-query"]');
    if (orderSearchInput) {
      orderSearchInput.addEventListener("input", applyOrderFilters);
    }

    applyOrderFilters();
  }

  window.ShopLitePages = window.ShopLitePages || {};
  window.ShopLitePages["my-orders"] = initOrdersPage;
}());
