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

  function initOrdersPage() {
    var ordersList = document.querySelector('[data-component="orders-list"]');
    if (!ordersList) {
      return;
    }

    document.addEventListener("click", function (event) {
      var filterButton = event.target.closest('[data-action="filter-orders"]');
      var viewButton = event.target.closest('[data-action="view-order-detail"]');
      var reorderButton = event.target.closest('[data-action="reorder"]');
      var cartButton = event.target.closest('[data-action="open-cart"]');

      if (filterButton) {
        activateFilter(filterButton);
        applyOrderFilters();
        return;
      }

      if (viewButton) {
        var detailCard = viewButton.closest("[data-order-id]");
        if (detailCard) {
          showToast("Showing prototype details for order " + detailCard.dataset.orderId + ".");
        }
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

    var searchForm = document.getElementById("searchForm");
    if (searchForm) {
      searchForm.addEventListener("submit", function (event) {
        event.preventDefault();
        showToast("Prototype product search is available on the home page.");
      });
    }

    applyOrderFilters();
  }

  window.ShopLitePages = window.ShopLitePages || {};
  window.ShopLitePages["my-orders"] = initOrdersPage;
}());
