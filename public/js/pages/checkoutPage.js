(function () {
  "use strict";

  function formatPrice(value) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(value);
  }

  function getValue(selector) {
    var element = document.querySelector(selector);
    return element ? element.value.trim() : "";
  }

  function getSelected(name) {
    return document.querySelector('input[name="' + name + '"]:checked');
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
    var deliveryOption = getSelected("deliveryOption");
    var paymentMethod = getSelected("paymentMethod");
    var missing = [];

    setInvalid('[data-field="receiver-name"]', !receiverName);
    setInvalid('[data-field="shipping-address"]', !shippingAddress);
    setInvalid('[data-field="phone"]', !phone);

    if (!receiverName) {
      missing.push("receiver name");
    }
    if (!shippingAddress) {
      missing.push("shipping address");
    }
    if (!phone) {
      missing.push("phone");
    }
    if (!deliveryOption) {
      missing.push("delivery option");
    }
    if (!paymentMethod) {
      missing.push("payment method");
    }

    return missing;
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

    document.querySelectorAll('[data-field="receiver-name"], [data-field="shipping-address"], [data-field="phone"]').forEach(function (input) {
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

      setValidationMessage("Prototype order is ready. No real payment was processed.", "success");
      showToast("Prototype order placed successfully.");
    });

    updateSummary();
  }

  window.ShopLitePages = window.ShopLitePages || {};
  window.ShopLitePages.checkout = initCheckoutPage;
}());
