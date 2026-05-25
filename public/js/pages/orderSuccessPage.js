(function () {
  "use strict";

  var apiClient = window.ShopLiteApi || {};

  function formatPrice(value) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(value);
  }

  function formatDate(value) {
    var date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Today";
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

  function getOrderIdFromUrl() {
    var params = new URLSearchParams(window.location.search);
    return params.get("orderId") || "";
  }

  function showToast(message) {
    var toast = document.getElementById("orderSuccessToast");
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

  function setText(selector, value) {
    var element = document.querySelector(selector);
    if (element) {
      element.textContent = value;
    }
  }

  function setCartCount(itemCount) {
    var cartCount = document.getElementById("cartCount") || document.querySelector('[data-role="cart-count"]');
    var cartButton = document.getElementById("cartButton") || document.querySelector('[data-action="open-cart"]');
    var nextCount = Number.isFinite(itemCount) ? itemCount : 0;

    if (window.ShopLiteCart && typeof window.ShopLiteCart.setCount === "function") {
      window.ShopLiteCart.setCount(nextCount);
      return;
    }

    if (cartCount) {
      cartCount.textContent = String(nextCount);
    }

    if (cartButton) {
      cartButton.setAttribute("aria-label", "Shopping cart with " + nextCount + " items");
    }
  }

  function updateCartCount() {
    var cartCount = document.getElementById("cartCount") || document.querySelector('[data-role="cart-count"]');
    var nextCount = cartCount ? Number.parseInt(cartCount.textContent || "0", 10) + 1 : 1;

    setCartCount(nextCount);
  }

  async function addProductToCart(button) {
    var productId = Number(button ? button.dataset.productId : 0);

    if (typeof apiClient.postJson === "function" && Number.isInteger(productId) && productId > 0) {
      try {
        var cart = await apiClient.postJson("/api/cart/items", {
          productId: productId,
          quantity: 1
        });
        var itemCount = cart && cart.summary ? Number(cart.summary.itemCount) : NaN;
        setCartCount(itemCount);
        showToast("Recommended product added to your ShopLite cart.");
        return;
      } catch (error) {
        if (window.console && typeof window.console.warn === "function") {
          window.console.warn("ShopLite cart API unavailable. Using local cart count fallback.", error);
        }
      }
    }

    updateCartCount();
    showToast("Recommended product added to your ShopLite cart.");
  }

  function itemTemplate(item) {
    var title = escapeHtml(item.title);
    var image = escapeHtml(item.image || "assets/images/placeholder-product.svg");
    var category = escapeHtml(item.category || "ShopLite");
    var quantity = Number(item.quantity) || 1;
    var price = Number(item.price) || 0;

    return [
      '<div class="d-flex gap-3 align-items-center mb-3">',
      '  <img class="order-thumb" src="' + image + '" alt="' + title + '">',
      '  <div><strong>' + title + '</strong><p class="muted-note mb-0">' + category + " - Quantity " + quantity + "</p></div>",
      '  <span class="ms-auto fw-bold">' + formatPrice(price * quantity) + "</span>",
      "</div>"
    ].join("");
  }

  function renderOrderSummary(order) {
    var summary = document.querySelector('[data-component="order-summary"]');
    var itemsHtml = order.items.map(itemTemplate).join("");
    var orderTotal = order.summary ? order.summary.total : 0;

    if (!summary) {
      return;
    }

    summary.innerHTML = [
      '<h2 class="card-heading fs-4 mb-3">Order summary</h2>',
      itemsHtml,
      "<hr>",
      '<div class="summary-line"><span>Subtotal</span><strong>' + formatPrice(order.summary.subtotal) + "</strong></div>",
      '<div class="summary-line"><span>Shipping</span><strong>' + formatPrice(order.summary.shipping) + "</strong></div>",
      '<div class="summary-line"><span>Estimated tax</span><strong>' + formatPrice(order.summary.tax) + "</strong></div>",
      '<div class="summary-line"><span>Savings</span><strong class="text-success">-' + formatPrice(order.summary.savings) + "</strong></div>",
      '<div class="summary-total mt-3"><span class="fw-bold">Total paid</span><span class="current-price" data-role="order-total">' + formatPrice(orderTotal) + "</span></div>"
    ].join("");
  }

  function deliveryEstimate(order) {
    var created = new Date(order.createdAt);
    if (Number.isNaN(created.getTime())) {
      return "Processing";
    }

    var start = new Date(created);
    var end = new Date(created);
    start.setDate(start.getDate() + 2);
    end.setDate(end.getDate() + (order.deliveryOption === "priority" ? 3 : 5));

    return start.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " to " + end.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  function renderOrder(order) {
    document.title = "ShopLite Mall - Order " + order.id;
    setText('[data-role="order-id"]', order.id);
    setText('[data-role="delivery-estimate"]', deliveryEstimate(order));
    setText('[data-role="payment-status"]', "Mock payment recorded");
    renderOrderSummary(order);
  }

  function renderMissingOrderState(message) {
    var successCard = document.querySelector('[data-component="success-card"]');
    var summary = document.querySelector('[data-component="order-summary"]');

    if (successCard) {
      successCard.innerHTML = [
        '<span class="icon-tile success-icon"><i class="bi bi-receipt" aria-hidden="true"></i></span>',
        '<p class="eyebrow">Order lookup</p>',
        '<h1 class="section-heading display-6 mb-3">Order details unavailable</h1>',
        '<p class="lead text-secondary mb-4">' + escapeHtml(message) + "</p>",
        '<div class="d-flex flex-wrap justify-content-center gap-3">',
        '  <a class="btn btn-accent btn-lg" href="orders.html">View My Orders</a>',
        '  <a class="btn btn-outline-accent btn-lg" href="products.html">Continue Shopping</a>',
        "</div>"
      ].join("");
    }

    if (summary) {
      summary.innerHTML = '<div class="empty-state"><strong>No order summary to show.</strong><span>Open My Orders to review available order history.</span></div>';
    }
  }

  async function loadOrder(orderId) {
    if (!orderId) {
      renderMissingOrderState("No order ID was provided in the confirmation URL.");
      return;
    }

    if (typeof apiClient.getJson !== "function") {
      renderMissingOrderState("The order API is unavailable.");
      return;
    }

    try {
      var response = await apiClient.getJson("/api/orders/" + encodeURIComponent(orderId));
      var order = response && response.data ? response.data : null;

      if (!order) {
        renderMissingOrderState("This order could not be found.");
        return;
      }

      renderOrder(order);
    } catch (error) {
      renderMissingOrderState(error && error.message ? error.message : "This order could not be loaded.");
    }
  }

  function initOrderSuccessPage() {
    var successCard = document.querySelector('[data-component="success-card"]');

    if (!successCard) {
      return;
    }

    loadOrder(getOrderIdFromUrl());

    document.addEventListener("click", function (event) {
      var ordersButton = event.target.closest('[data-action="view-my-orders"]');
      var addToCartButton = event.target.closest('[data-action="add-to-cart"]');

      if (ordersButton) {
        event.preventDefault();
        window.location.assign("orders.html");
        return;
      }

      if (addToCartButton) {
        addProductToCart(addToCartButton);
      }
    });
  }

  window.ShopLitePages = window.ShopLitePages || {};
  window.ShopLitePages["order-success"] = initOrderSuccessPage;
}());
