(function () {
  "use strict";

  function getQuantityInput() {
    return document.querySelector('[data-field="quantity"]');
  }

  function getQuantityValue() {
    var input = getQuantityInput();
    var value = input ? Number.parseInt(input.value, 10) : 1;
    return Number.isFinite(value) && value > 0 ? value : 1;
  }

  function setQuantityValue(value) {
    var input = getQuantityInput();
    var normalizedValue = Math.max(1, value);

    if (input) {
      input.value = String(normalizedValue);
    }

    return normalizedValue;
  }

  function ensureToast() {
    var existing = document.getElementById("cartToast");
    if (existing) {
      return existing;
    }

    var container = document.createElement("div");
    container.className = "toast-container position-fixed bottom-0 end-0 p-3";
    container.innerHTML = '<div id="cartToast" class="toast align-items-center" role="status" aria-live="polite" aria-atomic="true"><div class="d-flex"><div class="toast-body">ShopLite action complete.</div><button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button></div></div>';
    document.body.appendChild(container);
    return document.getElementById("cartToast");
  }

  function showToast(message) {
    var toastElement = ensureToast();
    var toastBody = toastElement.querySelector(".toast-body");

    if (toastBody) {
      toastBody.textContent = message;
    }

    if (window.bootstrap) {
      window.bootstrap.Toast.getOrCreateInstance(toastElement, { delay: 1600 }).show();
    }
  }

  function updateCartCount() {
    var cartCount = document.getElementById("cartCount") || document.querySelector('[data-role="cart-count"]');
    var cartButton = document.getElementById("cartButton") || document.querySelector('[data-action="open-cart"]');
    var nextCount = cartCount ? Number.parseInt(cartCount.textContent || "0", 10) + getQuantityValue() : getQuantityValue();

    if (cartCount) {
      cartCount.textContent = String(nextCount);
    }

    if (cartButton) {
      cartButton.setAttribute("aria-label", "Shopping cart with " + nextCount + " items");
    }
  }

  function selectProductImage(button) {
    var thumbnail = button.querySelector("img");
    var selectedImage = document.querySelector('[data-role="selected-product-image"]');

    if (!thumbnail || !selectedImage) {
      return;
    }

    selectedImage.src = thumbnail.src;
    selectedImage.alt = thumbnail.alt;
    document.querySelectorAll('[data-action="select-product-image"]').forEach(function (thumbButton) {
      thumbButton.classList.remove("active");
    });
    button.classList.add("active");
  }

  function initProductDetailPage() {
    var productSection = document.querySelector('[data-page="product-detail"] [data-product-id]');

    if (!productSection) {
      return;
    }

    document.addEventListener("click", function (event) {
      var imageButton = event.target.closest('[data-action="select-product-image"]');
      var increaseButton = event.target.closest('[data-action="increase-quantity"]');
      var decreaseButton = event.target.closest('[data-action="decrease-quantity"]');
      var addToCartButton = event.target.closest('[data-action="add-to-cart"]');
      var buyNowButton = event.target.closest('[data-action="buy-now"]');

      if (imageButton) {
        selectProductImage(imageButton);
        return;
      }

      if (increaseButton) {
        setQuantityValue(getQuantityValue() + 1);
        return;
      }

      if (decreaseButton) {
        setQuantityValue(getQuantityValue() - 1);
        return;
      }

      if (addToCartButton) {
        updateCartCount();
        showToast("Item added to your ShopLite cart.");
        return;
      }

      if (buyNowButton) {
        showToast("Prototype checkout preview for this item.");
      }
    });

    var quantityInput = getQuantityInput();
    if (quantityInput) {
      quantityInput.addEventListener("change", function () {
        setQuantityValue(getQuantityValue());
      });
      quantityInput.addEventListener("blur", function () {
        setQuantityValue(getQuantityValue());
      });
    }

    var searchForm = document.getElementById("searchForm");
    if (searchForm) {
      searchForm.addEventListener("submit", function (event) {
        event.preventDefault();
        showToast("Prototype search is available on the home page.");
      });
    }
  }

  window.ShopLitePages = window.ShopLitePages || {};
  window.ShopLitePages["product-detail"] = initProductDetailPage;
  window.ShopLitePages.productDetail = initProductDetailPage;
}());
