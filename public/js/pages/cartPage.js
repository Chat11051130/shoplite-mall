(function () {
  "use strict";

  var apiClient = window.ShopLiteApi || {};
  var studentSavings = 48.5;
  var apiCartActive = false;
  var fallbackNoticeShown = false;

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

  function getCartItems() {
    return Array.prototype.slice.call(document.querySelectorAll("[data-cart-item-id]"));
  }

  function getQuantityInput(item) {
    return item.querySelector('[data-field="cart-quantity"]');
  }

  function getQuantityValue(item) {
    var input = getQuantityInput(item);
    var value = input ? Number.parseInt(input.value, 10) : 1;
    return Number.isFinite(value) && value > 0 ? value : 1;
  }

  function setQuantityValue(item, value) {
    var input = getQuantityInput(item);
    var normalizedValue = Math.max(1, value);

    if (input) {
      input.value = String(normalizedValue);
    }

    return normalizedValue;
  }

  function getUnitPrice(item) {
    var value = Number.parseFloat(item.dataset.unitPrice || "0");
    return Number.isFinite(value) ? value : 0;
  }

  function isSelected(item) {
    var checkbox = item.querySelector('[data-action="select-cart-item"]');
    return !checkbox || checkbox.checked;
  }

  function setText(selector, value) {
    var element = document.querySelector(selector);
    if (element) {
      element.textContent = value;
    }
  }

  function getSelectedSubtotal() {
    return getCartItems().reduce(function (total, item) {
      if (!isSelected(item)) {
        return total;
      }

      return total + getUnitPrice(item) * getQuantityValue(item);
    }, 0);
  }

  function getCartQuantityCount() {
    return getCartItems().reduce(function (total, item) {
      return total + getQuantityValue(item);
    }, 0);
  }

  function getShipping(subtotal) {
    if (subtotal === 0 || subtotal >= 35) {
      return 0;
    }

    return 6.99;
  }

  function getSavings(subtotal) {
    return subtotal > 0 ? Math.min(studentSavings, subtotal) : 0;
  }

  function updateEmptyState(isEmpty) {
    var emptyState = document.querySelector('[data-component="empty-cart-state"]');
    var selectAll = document.getElementById("selectAllItems");

    if (emptyState) {
      emptyState.classList.toggle("d-none", !isEmpty);
    }

    if (selectAll) {
      selectAll.disabled = isEmpty;
    }
  }

  function updateSelectAllState() {
    var selectAll = document.getElementById("selectAllItems");
    var itemCheckboxes = getCartItems().map(function (item) {
      return item.querySelector('[data-action="select-cart-item"]');
    }).filter(Boolean);
    var checkedCount = itemCheckboxes.filter(function (checkbox) {
      return checkbox.checked;
    }).length;

    if (!selectAll) {
      return;
    }

    selectAll.checked = itemCheckboxes.length > 0 && checkedCount === itemCheckboxes.length;
    selectAll.indeterminate = checkedCount > 0 && checkedCount < itemCheckboxes.length;
    selectAll.disabled = itemCheckboxes.length === 0;
  }

  function setCartSummary(summary) {
    var cartCount = document.getElementById("cartCount") || document.querySelector('[data-role="cart-count"]');
    var cartButton = document.getElementById("cartButton") || document.querySelector('[data-action="open-cart"]');
    var itemCount = Number(summary.itemCount) || 0;
    var hasGlobalCartCount = window.ShopLiteCart && typeof window.ShopLiteCart.setCount === "function";

    setText('[data-role="cart-subtotal"]', formatPrice(summary.subtotal || 0));
    setText('[data-role="cart-shipping"]', formatPrice(summary.shipping || 0));
    setText('[data-role="cart-savings"]', "-" + formatPrice(summary.savings || 0));
    setText('[data-role="cart-total"]', formatPrice(summary.total || 0));

    if (hasGlobalCartCount) {
      window.ShopLiteCart.setCount(itemCount);
    } else if (cartCount) {
      cartCount.textContent = String(itemCount);
    }

    if (!hasGlobalCartCount && cartButton) {
      cartButton.setAttribute("aria-label", "Shopping cart with " + itemCount + " items");
    }
  }

  function updateCartSummary() {
    var subtotal = getSelectedSubtotal();
    var shipping = getShipping(subtotal);
    var savings = getSavings(subtotal);
    var total = Math.max(0, subtotal + shipping - savings);

    getCartItems().forEach(function (item) {
      var lineTotal = item.querySelector('[data-role="line-total"]');
      if (lineTotal) {
        lineTotal.textContent = formatPrice(getUnitPrice(item) * getQuantityValue(item));
      }
    });

    setCartSummary({
      subtotal: subtotal,
      shipping: shipping,
      savings: savings,
      total: total,
      itemCount: getCartQuantityCount()
    });
    updateEmptyState(getCartItems().length === 0);
    updateSelectAllState();
  }

  function showToast(message) {
    var toast = document.getElementById("cartToast");
    if (!toast) {
      return;
    }

    var body = toast.querySelector(".toast-body");
    if (body) {
      body.textContent = message;
    }

    if (window.bootstrap) {
      window.bootstrap.Toast.getOrCreateInstance(toast, { delay: 1600 }).show();
    }
  }

  function showApiFallbackNotice(error) {
    apiCartActive = false;

    if (window.console && typeof window.console.warn === "function") {
      window.console.warn("ShopLite cart API unavailable. Using local cart fallback.", error);
    }

    if (!fallbackNoticeShown) {
      showToast("Cart API unavailable. Showing local cart preview.");
      fallbackNoticeShown = true;
    }
  }

  function isAuthError(error) {
    return window.ShopLiteCart && typeof window.ShopLiteCart.isAuthError === "function" ? window.ShopLiteCart.isAuthError(error) : Boolean(error && error.status === 401);
  }

  function buildLoginUrl() {
    if (window.ShopLiteCart && typeof window.ShopLiteCart.buildLoginUrl === "function") {
      return window.ShopLiteCart.buildLoginUrl("cart.html");
    }

    return "login.html?returnTo=cart.html";
  }

  function redirectToLogin() {
    if (window.ShopLiteCart && typeof window.ShopLiteCart.redirectToLogin === "function") {
      window.ShopLiteCart.redirectToLogin("cart.html");
      return;
    }

    window.location.assign(buildLoginUrl());
  }

  function showSignedOutCartMessage() {
    var cartList = document.querySelector('[data-component="cart-list"]');
    var emptyState = document.querySelector('[data-component="empty-cart-state"]');

    apiCartActive = false;

    if (cartList) {
      cartList.dataset.dataSource = "auth-required";
      cartList.innerHTML = [
        '<div class="empty-state mb-0">',
        '  <i class="bi bi-person-lock fs-1 text-secondary" aria-hidden="true"></i>',
        '  <strong>Sign in to view your cart.</strong>',
        '  <span>Your ShopLite cart is now saved to your account session.</span>',
        '  <a class="btn btn-accent mt-3" href="' + buildLoginUrl() + '">Sign In to Continue</a>',
        "</div>"
      ].join("");
    }

    if (emptyState) {
      emptyState.classList.add("d-none");
    }

    setCartSummary({
      subtotal: 0,
      shipping: 0,
      savings: 0,
      total: 0,
      itemCount: 0
    });
  }

  function cartHeaderTemplate(isEmpty) {
    return [
      '<div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">',
      '  <h2 class="card-heading fs-4">Cart items</h2>',
      '  <div class="d-flex align-items-center gap-3">',
      '    <label class="fw-bold" for="selectAllItems">',
      '      <input class="form-check-input me-2" id="selectAllItems" type="checkbox" data-action="select-cart-item"' + (isEmpty ? " disabled" : " checked") + "> Select all",
      "    </label>",
      '    <button class="btn btn-sm btn-outline-accent" type="button" data-action="clear-cart"' + (isEmpty ? " disabled" : "") + ">Clear Cart</button>",
      "  </div>",
      "</div>"
    ].join("");
  }

  function cartItemTemplate(item) {
    var product = item.product || {};
    var title = escapeHtml(product.title || "ShopLite product");
    var image = escapeHtml(product.image || "assets/images/placeholder-product.svg");
    var alt = escapeHtml(product.alt || title);
    var shipping = escapeHtml(product.shipping || "Standard ShopLite shipping.");
    var productId = Number(item.productId);
    var quantity = Number(item.quantity) || 1;
    var unitPrice = Number(item.unitPrice) || Number(product.price) || 0;
    var lineTotal = Number(item.lineTotal) || unitPrice * quantity;

    return [
      '<div class="cart-item" data-cart-item-id="cart-item-' + productId + '" data-product-id="' + productId + '" data-unit-price="' + unitPrice + '">',
      '  <div class="row g-3 align-items-center">',
      '    <div class="col-auto"><input class="form-check-input" type="checkbox" data-action="select-cart-item" checked aria-label="Select ' + title + '"></div>',
      '    <div class="col-auto"><a href="product-detail.html?productId=' + productId + '"><img class="cart-thumb" src="' + image + '" alt="' + alt + '"></a></div>',
      '    <div class="col-md"><h3 class="cart-item-title"><a class="product-detail-link" href="product-detail.html?productId=' + productId + '">' + title + '</a></h3><p class="muted-note mb-0">' + shipping + '</p></div>',
      '    <div class="col-sm-auto"><span class="current-price fs-5" data-role="line-total">' + formatPrice(lineTotal) + "</span></div>",
      '    <div class="col-sm-auto"><div class="quantity-control" data-quantity-control><button type="button" data-action="decrease-quantity" data-quantity-change="-1" aria-label="Decrease quantity">-</button><input type="text" value="' + quantity + '" data-field="cart-quantity" aria-label="Cart item quantity"><button type="button" data-action="increase-quantity" data-quantity-change="1" aria-label="Increase quantity">+</button></div></div>',
      '    <div class="col-sm-auto"><button class="btn btn-sm delete-button" type="button" data-action="remove-cart-item"><i class="bi bi-trash" aria-hidden="true"></i> Delete</button></div>',
      "  </div>",
      "</div>"
    ].join("");
  }

  function renderCart(cart) {
    var cartList = document.querySelector('[data-component="cart-list"]');
    var items = cart && Array.isArray(cart.items) ? cart.items : [];

    if (!cartList) {
      return;
    }

    cartList.dataset.dataSource = "api";
    cartList.innerHTML = cartHeaderTemplate(items.length === 0) + items.map(cartItemTemplate).join("");
    setCartSummary(cart.summary || {
      subtotal: 0,
      shipping: 0,
      savings: 0,
      total: 0,
      itemCount: 0
    });
    updateEmptyState(items.length === 0);
    updateSelectAllState();
  }

  async function loadCart() {
    if (typeof apiClient.getJson !== "function") {
      throw new Error("Cart API client is unavailable.");
    }

    return apiClient.getJson("/api/cart");
  }

  async function loadAndRenderCart() {
    try {
      var cart = await loadCart();
      apiCartActive = true;
      renderCart(cart);
    } catch (error) {
      if (isAuthError(error)) {
        showSignedOutCartMessage();
        return;
      }

      showApiFallbackNotice(error);
      updateCartSummary();
    }
  }

  async function patchCartItem(productId, quantity, fallbackAction) {
    if (apiCartActive && typeof apiClient.patchJson === "function") {
      try {
        renderCart(await apiClient.patchJson("/api/cart/items/" + encodeURIComponent(productId), {
          quantity: quantity
        }));
        showToast("Cart quantity updated.");
        return;
      } catch (error) {
        if (isAuthError(error)) {
          showSignedOutCartMessage();
          return;
        }

        showApiFallbackNotice(error);
      }
    }

    fallbackAction();
  }

  async function removeCartItem(productId, fallbackAction) {
    if (apiCartActive && typeof apiClient.deleteJson === "function") {
      try {
        renderCart(await apiClient.deleteJson("/api/cart/items/" + encodeURIComponent(productId)));
        showToast("Cart item removed.");
        return;
      } catch (error) {
        if (isAuthError(error)) {
          showSignedOutCartMessage();
          return;
        }

        showApiFallbackNotice(error);
      }
    }

    fallbackAction();
  }

  async function clearCart() {
    if (apiCartActive && typeof apiClient.deleteJson === "function") {
      try {
        renderCart(await apiClient.deleteJson("/api/cart"));
        showToast("Cart cleared.");
        return;
      } catch (error) {
        if (isAuthError(error)) {
          showSignedOutCartMessage();
          return;
        }

        showApiFallbackNotice(error);
      }
    }

    clearCartItems();
  }

  function clearCartItems() {
    getCartItems().forEach(function (item) {
      item.remove();
    });
    updateCartSummary();
    showToast("Cart preview cleared.");
  }

  function initCartPage() {
    var cartList = document.querySelector('[data-component="cart-list"]');

    if (!cartList) {
      return;
    }

    document.addEventListener("click", function (event) {
      var increaseButton = event.target.closest('[data-action="increase-quantity"]');
      var decreaseButton = event.target.closest('[data-action="decrease-quantity"]');
      var removeButton = event.target.closest('[data-action="remove-cart-item"]');
      var clearButton = event.target.closest('[data-action="clear-cart"]');
      var checkoutButton = event.target.closest('[data-action="go-to-checkout"]');

      if (increaseButton) {
        var increaseItem = increaseButton.closest("[data-cart-item-id]");
        if (increaseItem) {
          var increasedQuantity = getQuantityValue(increaseItem) + 1;
          patchCartItem(increaseItem.dataset.productId, increasedQuantity, function () {
            setQuantityValue(increaseItem, increasedQuantity);
            updateCartSummary();
          });
        }
        return;
      }

      if (decreaseButton) {
        var decreaseItem = decreaseButton.closest("[data-cart-item-id]");
        if (decreaseItem) {
          var decreasedQuantity = Math.max(1, getQuantityValue(decreaseItem) - 1);
          patchCartItem(decreaseItem.dataset.productId, decreasedQuantity, function () {
            setQuantityValue(decreaseItem, decreasedQuantity);
            updateCartSummary();
          });
        }
        return;
      }

      if (removeButton) {
        var removableItem = removeButton.closest("[data-cart-item-id]");
        if (removableItem) {
          removeCartItem(removableItem.dataset.productId, function () {
            removableItem.remove();
            updateCartSummary();
            showToast("Cart item removed.");
          });
        }
        return;
      }

      if (clearButton) {
        clearCart();
        return;
      }

      if (checkoutButton && checkoutButton.tagName !== "A") {
        showToast("Prototype checkout action is ready.");
      }
    });

    document.addEventListener("change", function (event) {
      var checkbox = event.target.closest('[data-action="select-cart-item"]');
      var quantityInput = event.target.closest('[data-field="cart-quantity"]');

      if (checkbox) {
        if (checkbox.id === "selectAllItems") {
          getCartItems().forEach(function (item) {
            var itemCheckbox = item.querySelector('[data-action="select-cart-item"]');
            if (itemCheckbox) {
              itemCheckbox.checked = checkbox.checked;
            }
          });
        }

        updateCartSummary();
        return;
      }

      if (quantityInput) {
        var item = quantityInput.closest("[data-cart-item-id]");
        if (item) {
          var normalizedQuantity = setQuantityValue(item, getQuantityValue(item));
          patchCartItem(item.dataset.productId, normalizedQuantity, function () {
            updateCartSummary();
          });
        }
      }
    });

    loadAndRenderCart();
  }

  window.ShopLitePages = window.ShopLitePages || {};
  window.ShopLitePages.cart = initCartPage;
}());
