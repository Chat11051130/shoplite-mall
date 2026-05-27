(function () {
  "use strict";

  var apiClient = window.ShopLiteApi || {};
  var taxRate = 0.075;

  function formatPrice(value) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(value);
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

  function getValue(selector) {
    var element = document.querySelector(selector);
    return element ? element.value.trim() : "";
  }

  function getSelected(name) {
    return document.querySelector('input[name="' + name + '"]:checked');
  }

  function setSummaryNumber(selector, value, prefix) {
    var element = document.querySelector(selector);
    var amount = Number.isFinite(value) ? value : 0;

    if (!element) {
      return;
    }

    element.dataset.value = String(amount);
    element.textContent = (prefix || "") + formatPrice(amount);
  }

  function getSummaryNumber(selector, fallback) {
    var element = document.querySelector(selector);
    var value = element ? Number.parseFloat(element.dataset.value || "0") : fallback;
    return Number.isFinite(value) ? value : fallback;
  }

  function setValidationMessage(message, type) {
    var messageElement = document.querySelector('[data-component="validation-message"]');
    if (!messageElement) {
      return;
    }

    messageElement.className = "validation-message mt-3 alert alert-" + type;
    messageElement.textContent = message;
  }

  function clearValidationMessage() {
    var messageElement = document.querySelector('[data-component="validation-message"]');
    if (!messageElement) {
      return;
    }

    messageElement.className = "validation-message mt-3";
    messageElement.textContent = "";
  }

  function isAuthError(error) {
    return window.ShopLiteCart && typeof window.ShopLiteCart.isAuthError === "function" ? window.ShopLiteCart.isAuthError(error) : Boolean(error && error.status === 401);
  }

  function redirectToLogin() {
    if (window.ShopLiteCart && typeof window.ShopLiteCart.redirectToLogin === "function") {
      window.ShopLiteCart.redirectToLogin("checkout.html");
      return;
    }

    window.location.assign("login.html?returnTo=checkout.html");
  }

  function showToast(message) {
    var toast = document.getElementById("checkoutToast");
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

  function checkoutItemTemplate(item) {
    var product = item.product || {};
    var title = escapeHtml(product.title || "ShopLite product");
    var image = escapeHtml(product.image || "assets/images/placeholder-product.svg");
    var alt = escapeHtml(product.alt || title);
    var quantity = Number(item.quantity) || 1;
    var unitPrice = Number(item.unitPrice) || Number(product.price) || 0;
    var lineTotal = Number(item.lineTotal) || unitPrice * quantity;

    return [
      '<div class="d-flex gap-3 mb-3" data-role="checkout-cart-item">',
      '  <img class="order-thumb" src="' + image + '" alt="' + alt + '">',
      '  <div><strong>' + title + '</strong><p class="muted-note mb-0">Qty ' + quantity + "</p></div>",
      '  <strong class="ms-auto">' + formatPrice(lineTotal) + "</strong>",
      "</div>"
    ].join("");
  }

  function renderCheckoutItems(cart) {
    var summaryCard = document.querySelector('[data-component="checkout-summary"]');
    var heading = summaryCard ? summaryCard.querySelector("h2") : null;
    var divider = summaryCard ? summaryCard.querySelector("hr") : null;
    var items = cart && Array.isArray(cart.items) ? cart.items : [];
    var currentNode = heading ? heading.nextElementSibling : null;
    var html;

    if (!summaryCard || !heading || !divider) {
      return;
    }

    while (currentNode && currentNode !== divider) {
      var nextNode = currentNode.nextElementSibling;
      currentNode.remove();
      currentNode = nextNode;
    }

    html = items.length > 0 ? items.map(checkoutItemTemplate).join("") : '<div class="muted-note mb-3" data-role="checkout-cart-item">Your cart is empty.</div>';
    divider.insertAdjacentHTML("beforebegin", html);
  }

  function renderCheckoutSummary(cart) {
    var summary = cart && cart.summary ? cart.summary : {};
    var subtotal = Number(summary.subtotal) || 0;
    var tax = Math.round((subtotal * taxRate + Number.EPSILON) * 100) / 100;
    var savings = Number(summary.savings) || 0;

    renderCheckoutItems(cart);
    setSummaryNumber('[data-role="checkout-subtotal"]', subtotal);
    setSummaryNumber('[data-role="checkout-tax"]', tax);
    setSummaryNumber('[data-role="checkout-savings"]', savings, "-");
    updateSummary();
  }

  async function loadCheckoutCart() {
    if (typeof apiClient.getJson !== "function") {
      return;
    }

    try {
      renderCheckoutSummary(await apiClient.getJson("/api/cart"));
    } catch (error) {
      if (isAuthError(error)) {
        renderCheckoutSummary({ items: [], summary: { subtotal: 0, savings: 0 } });
        return;
      }

      if (window.console && typeof window.console.warn === "function") {
        window.console.warn("ShopLite checkout cart summary unavailable. Keeping static summary fallback.", error);
      }
    }
  }

  function updateSummary() {
    var deliveryOption = getSelected("deliveryOption");
    var subtotal = getSummaryNumber('[data-role="checkout-subtotal"]', 809.94);
    var tax = getSummaryNumber('[data-role="checkout-tax"]', 61.1);
    var savings = getSummaryNumber('[data-role="checkout-savings"]', 48.5);
    var shipping = deliveryOption ? Number.parseFloat(deliveryOption.dataset.shipping || "0") : 0;
    var shippingElement = document.querySelector('[data-role="checkout-shipping"]');
    var totalElement = document.querySelector('[data-role="checkout-total"]');

    if (!Number.isFinite(shipping)) {
      shipping = 0;
    }

    if (shippingElement) {
      shippingElement.textContent = formatPrice(shipping);
    }

    if (totalElement) {
      totalElement.textContent = formatPrice(subtotal + shipping + tax - savings);
    }
  }

  function setInvalid(selector, invalid) {
    var element = document.querySelector(selector);
    if (element) {
      element.classList.toggle("is-invalid", invalid);
    }
  }

  function validateCheckout() {
    var receiverName = getValue('[data-field="receiver-name"]');
    var shippingAddress = getValue('[data-field="shipping-address"]');
    var phone = getValue('[data-field="phone"]');
    var city = getValue('[name="shippingCity"]');
    var state = getValue('[name="shippingState"]');
    var zip = getValue('[name="shippingZip"]');
    var deliveryOption = getSelected("deliveryOption");
    var paymentMethod = getSelected("paymentMethod");
    var missing = [];

    setInvalid('[data-field="receiver-name"]', !receiverName);
    setInvalid('[data-field="shipping-address"]', !shippingAddress);
    setInvalid('[data-field="phone"]', !phone);
    setInvalid('[name="shippingCity"]', !city);
    setInvalid('[name="shippingState"]', !state);
    setInvalid('[name="shippingZip"]', !zip);

    if (!receiverName) {
      missing.push("receiver name");
    }
    if (!shippingAddress) {
      missing.push("shipping address");
    }
    if (!phone) {
      missing.push("phone");
    }
    if (!city) {
      missing.push("city");
    }
    if (!state) {
      missing.push("state");
    }
    if (!zip) {
      missing.push("ZIP code");
    }
    if (!deliveryOption) {
      missing.push("delivery option");
    }
    if (!paymentMethod) {
      missing.push("payment method");
    }

    return missing;
  }

  function buildOrderPayload() {
    var deliveryOption = getSelected("deliveryOption");
    var paymentMethod = getSelected("paymentMethod");

    return {
      customerName: getValue('[data-field="receiver-name"]'),
      phone: getValue('[data-field="phone"]'),
      shippingAddress: getValue('[data-field="shipping-address"]'),
      city: getValue('[name="shippingCity"]'),
      state: getValue('[name="shippingState"]'),
      zip: getValue('[name="shippingZip"]'),
      deliveryOption: deliveryOption ? deliveryOption.value : "",
      paymentMethod: paymentMethod ? paymentMethod.value : ""
    };
  }

  async function submitOrder(form) {
    var submitButton = form.querySelector('[data-action="place-order"]');

    if (typeof apiClient.postJson !== "function") {
      setValidationMessage("Order API is unavailable. Please try again after the server starts.", "danger");
      showToast("Order API is unavailable.");
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Placing Order...";
    }

    try {
      var response = await apiClient.postJson("/api/orders", buildOrderPayload());
      var order = response && response.data ? response.data : null;

      if (!order || !order.id) {
        throw new Error("Order API did not return an order ID.");
      }

      setValidationMessage("Order created. Opening confirmation page.", "success");
      window.location.href = "order-success.html?orderId=" + encodeURIComponent(order.id);
    } catch (error) {
      if (isAuthError(error)) {
        redirectToLogin();
        return;
      }

      var message = error && error.message ? error.message : "Unable to place this order.";
      setValidationMessage(message, "danger");
      showToast(message);

      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Place Order";
      }
    }
  }

  function initCheckoutPage() {
    var form = document.querySelector('[data-component="checkout-form"]');

    if (!form) {
      return;
    }

    document.querySelectorAll('[data-field="delivery-option"]').forEach(function (input) {
      input.addEventListener("change", function () {
        clearValidationMessage();
        updateSummary();
      });
    });

    document.querySelectorAll('[data-field="payment-method"]').forEach(function (input) {
      input.addEventListener("change", function () {
        clearValidationMessage();
      });
    });

    document.querySelectorAll('[data-field="receiver-name"], [data-field="shipping-address"], [data-field="phone"], [name="shippingCity"], [name="shippingState"], [name="shippingZip"]').forEach(function (input) {
      input.addEventListener("input", function () {
        input.classList.remove("is-invalid");
        clearValidationMessage();
      });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var missing = validateCheckout();

      if (missing.length > 0) {
        setValidationMessage("Please complete " + missing.join(", ") + " before placing the order.", "warning");
        showToast("Checkout form needs a few details.");
        return;
      }

      submitOrder(form);
    });

    updateSummary();
    loadCheckoutCart();
  }

  window.ShopLitePages = window.ShopLitePages || {};
  window.ShopLitePages.checkout = initCheckoutPage;
}());
