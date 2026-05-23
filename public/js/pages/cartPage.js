(function () {
  "use strict";

  var studentSavings = 48.5;

  function formatPrice(value) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(value);
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
  }

  function updateCartSummary() {
    var subtotal = getSelectedSubtotal();
    var shipping = getShipping(subtotal);
    var savings = getSavings(subtotal);
    var total = Math.max(0, subtotal + shipping - savings);
    var cartCount = document.getElementById("cartCount") || document.querySelector('[data-role="cart-count"]');
    var cartButton = document.getElementById("cartButton") || document.querySelector('[data-action="open-cart"]');
    var itemCount = getCartQuantityCount();

    getCartItems().forEach(function (item) {
      var lineTotal = item.querySelector('[data-role="line-total"]');
      if (lineTotal) {
        lineTotal.textContent = formatPrice(getUnitPrice(item) * getQuantityValue(item));
      }
    });

    setText('[data-role="cart-subtotal"]', formatPrice(subtotal));
    setText('[data-role="cart-shipping"]', formatPrice(shipping));
    setText('[data-role="cart-savings"]', "-" + formatPrice(savings));
    setText('[data-role="cart-total"]', formatPrice(total));

    if (cartCount) {
      cartCount.textContent = String(itemCount);
    }

    if (cartButton) {
      cartButton.setAttribute("aria-label", "Shopping cart with " + itemCount + " items");
    }

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
          setQuantityValue(increaseItem, getQuantityValue(increaseItem) + 1);
          updateCartSummary();
        }
        return;
      }

      if (decreaseButton) {
        var decreaseItem = decreaseButton.closest("[data-cart-item-id]");
        if (decreaseItem) {
          setQuantityValue(decreaseItem, getQuantityValue(decreaseItem) - 1);
          updateCartSummary();
        }
        return;
      }

      if (removeButton) {
        var removableItem = removeButton.closest("[data-cart-item-id]");
        if (removableItem) {
          removableItem.remove();
          updateCartSummary();
          showToast("Cart item removed.");
        }
        return;
      }

      if (clearButton) {
        clearCartItems();
        return;
      }

      if (checkoutButton) {
        event.preventDefault();
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
          setQuantityValue(item, getQuantityValue(item));
          updateCartSummary();
        }
      }
    });

    var searchForm = document.getElementById("searchForm");
    if (searchForm) {
      searchForm.addEventListener("submit", function (event) {
        event.preventDefault();
        showToast("Prototype search is available on the home page.");
      });
    }

    updateCartSummary();
  }

  window.ShopLitePages = window.ShopLitePages || {};
  window.ShopLitePages.cart = initCartPage;
}());
