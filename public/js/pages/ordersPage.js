(function () {
  "use strict";

  function getCartCountElement() {
    return document.getElementById("cartCount") || document.querySelector('[data-role="cart-count"]');
  }

  function updateCartCount(amount) {
    var cartCount = getCartCountElement();
    var cartButton = document.getElementById("cartButton") || document.querySelector('[data-action="open-cart"]');
    var currentCount = cartCount ? Number.parseInt(cartCount.textContent || "0", 10) : 0;
    var nextCount = currentCount + amount;

    if (cartCount) {
      cartCount.textContent = String(nextCount);
    }

    if (cartButton) {
      cartButton.setAttribute("aria-label", "Shopping cart with " + nextCount + " items");
    }
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

  function setDetailText(role, value) {
    var element = document.querySelector('[data-role="' + role + '"]');
    if (element) {
      element.textContent = value;
    }
  }

  function getOrderCardDetail(card) {
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
      deliveryNote: card.dataset.deliveryNote || (noteElement ? noteElement.textContent.trim() : "Delivery information is ready for this prototype order."),
      paymentStatus: card.dataset.paymentStatus || "Prototype payment status confirmed.",
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

  function initOrdersPage() {
    var ordersList = document.querySelector('[data-component="orders-list"]');
    if (!ordersList) {
      return;
    }

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
        var itemCount = reorderCard ? Number.parseInt(reorderCard.dataset.orderItemCount || "1", 10) : 1;
        updateCartCount(Number.isNaN(itemCount) ? 1 : itemCount);
        showToast("Items from order " + (reorderCard ? reorderCard.dataset.orderId : "") + " were added to your cart preview.");
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
