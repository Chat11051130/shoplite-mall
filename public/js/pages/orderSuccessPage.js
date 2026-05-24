(function () {
  "use strict";

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

  function updateCartCount() {
    var cartCount = document.getElementById("cartCount") || document.querySelector('[data-role="cart-count"]');
    var cartButton = document.getElementById("cartButton") || document.querySelector('[data-action="open-cart"]');
    var nextCount = cartCount ? Number.parseInt(cartCount.textContent || "0", 10) + 1 : 1;

    if (cartCount) {
      cartCount.textContent = String(nextCount);
    }

    if (cartButton) {
      cartButton.setAttribute("aria-label", "Shopping cart with " + nextCount + " items");
    }
  }

  function initOrderSuccessPage() {
    var successCard = document.querySelector('[data-component="success-card"]');

    if (!successCard) {
      return;
    }

    document.addEventListener("click", function (event) {
      var ordersButton = event.target.closest('[data-action="view-my-orders"]');
      var addToCartButton = event.target.closest('[data-action="add-to-cart"]');

      if (ordersButton) {
        event.preventDefault();
        window.location.assign("orders.html");
        return;
      }

      if (addToCartButton) {
        updateCartCount();
        showToast("Recommended product added to your ShopLite cart.");
      }
    });

  }

  window.ShopLitePages = window.ShopLitePages || {};
  window.ShopLitePages["order-success"] = initOrderSuccessPage;
}());
