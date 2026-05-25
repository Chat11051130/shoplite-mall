(function () {
  "use strict";

  var data = window.ShopLiteData || {};
  var templates = window.ShopLiteTemplates || {};
  var apiClient = window.ShopLiteApi || {};
  var products = data.products || [];
  var miniCardTemplate = templates.miniCardTemplate;
  var formatCategory = templates.formatCategory;
  var formatPrice = templates.formatPrice;
  var formatReviews = templates.formatReviews;
  var buildStars = templates.buildStars;
  var currentProductSource = "fallback";

  function getProductIdFromUrl() {
    var params = new URLSearchParams(window.location.search);
    return Number.parseInt(params.get("productId") || "1", 10);
  }

  function findProductById(productId) {
    return products.find(function (product) {
      return product.id === productId;
    }) || null;
  }

  function getFallbackProduct(productId) {
    return findProductById(productId);
  }

  async function loadProduct(productId) {
    if (typeof apiClient.getJson === "function") {
      try {
        var payload = await apiClient.getJson("/api/products/" + encodeURIComponent(productId));
        currentProductSource = "api";
        return payload && payload.data ? payload.data : null;
      } catch (error) {
        if (window.console && typeof window.console.warn === "function") {
          window.console.warn("ShopLite product detail API unavailable. Using local fallback.", error);
        }
      }
    }

    currentProductSource = "fallback";
    return getFallbackProduct(productId);
  }

  function getFallbackRelatedProducts(product) {
    return products.filter(function (candidate) {
      return candidate.category === product.category && candidate.id !== product.id;
    }).slice(0, 4);
  }

  async function loadRelatedProducts(product) {
    if (typeof apiClient.getJson === "function" && typeof apiClient.buildQueryString === "function") {
      try {
        var queryString = apiClient.buildQueryString({ category: product.category });
        var payload = await apiClient.getJson("/api/products" + queryString);
        var related = payload && Array.isArray(payload.data) ? payload.data : [];

        return related.filter(function (candidate) {
          return candidate.id !== product.id;
        }).slice(0, 4);
      } catch (error) {
        if (window.console && typeof window.console.warn === "function") {
          window.console.warn("ShopLite related products API unavailable. Using local fallback.", error);
        }
      }
    }

    return getFallbackRelatedProducts(product);
  }

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

  function setText(selector, value) {
    var element = document.querySelector(selector);
    if (element) {
      element.textContent = value;
    }
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

  function relatedProductsFor(product) {
    return getFallbackRelatedProducts(product);
  }

  function galleryImagesFor(product, relatedProducts) {
    var related = (relatedProducts || relatedProductsFor(product)).slice(0, 3);
    return [product].concat(related).map(function (item) {
      return {
        src: item.image,
        alt: item.alt || item.title
      };
    });
  }

  function renderGallery(product, relatedProducts) {
    var mainImage = document.querySelector('[data-role="selected-product-image"]');
    var thumbs = document.querySelector(".gallery-thumbs");
    var images = galleryImagesFor(product, relatedProducts);

    if (mainImage) {
      mainImage.src = product.image;
      mainImage.alt = product.alt || product.title;
    }

    if (thumbs) {
      thumbs.innerHTML = images.map(function (image, index) {
        return [
          '<button class="' + (index === 0 ? "active" : "") + '" type="button" data-action="select-product-image" aria-label="Show product image ' + (index + 1) + '">',
          '  <img src="' + image.src + '" alt="' + image.alt + '">',
          "</button>"
        ].join("");
      }).join("");
    }
  }

  function renderHighlights(product) {
    var list = document.querySelector('[data-role="product-highlights"]');
    var highlights = Array.isArray(product.highlights) && product.highlights.length > 0 ? product.highlights : [product.shortDescription];

    if (list) {
      list.innerHTML = highlights.map(function (highlight) {
        return "<li>" + highlight + "</li>";
      }).join("");
    }
  }

  function renderSpecifications(product) {
    var body = document.querySelector('[data-role="product-specifications"]');
    var details = product.details || {};
    var keys = Object.keys(details);

    if (!body) {
      return;
    }

    if (keys.length === 0) {
      body.innerHTML = '<tr><th scope="row">Overview</th><td>' + product.shortDescription + "</td></tr>";
      return;
    }

    body.innerHTML = keys.map(function (key) {
      return '<tr><th scope="row">' + key + "</th><td>" + details[key] + "</td></tr>";
    }).join("");
  }

  function renderRelatedProducts(product, relatedProducts) {
    var rail = document.querySelector('[data-component="related-products"] .recommendation-rail');
    var related = relatedProducts || relatedProductsFor(product);

    if (rail && typeof miniCardTemplate === "function") {
      rail.innerHTML = related.map(miniCardTemplate).join("");
    }
  }

  function renderProduct(product, relatedProducts, source) {
    var section = document.querySelector('[data-page="product-detail"] [data-product-id]');
    var categoryLabel = typeof formatCategory === "function" ? formatCategory(product.category) : product.category;
    var categoryLink = document.querySelector('[data-role="product-category-link"]');
    var starsHtml = typeof buildStars === "function" ? buildStars(product.rating) : "";
    var reviewText = (typeof formatReviews === "function" ? formatReviews(product.reviews) : product.reviews) + " reviews";
    var stockStatus = document.querySelector('[data-role="stock-status"]');

    if (section) {
      section.dataset.productId = String(product.id);
      section.dataset.dataSource = source || "local";
    }

    document.title = "ShopLite Mall - " + product.title;
    setText('[data-role="product-breadcrumb-title"]', product.title);
    setText('[data-role="product-category"]', categoryLabel);
    setText('[data-role="product-title"]', product.title);
    setText('[data-role="product-review-count"]', reviewText);
    setText('[data-role="product-price"]', typeof formatPrice === "function" ? formatPrice(product.price) : "$" + product.price);
    setText('[data-role="product-old-price"]', typeof formatPrice === "function" ? formatPrice(product.oldPrice) : "$" + product.oldPrice);
    setText('[data-role="product-discount"]', product.discount);
    setText('[data-role="product-shipping"]', product.shipping + " Secure checkout and simple returns on eligible orders.");
    setText('[data-role="review-score"]', String(product.rating.toFixed(1)));
    setText('[data-role="review-summary-text"]', "Strong ratings for " + product.shortDescription.toLowerCase());

    if (categoryLink) {
      categoryLink.textContent = categoryLabel;
      categoryLink.href = "products.html?category=" + encodeURIComponent(product.category);
    }

    document.querySelectorAll("[data-category-link]").forEach(function (link) {
      link.classList.toggle("active", link.dataset.categoryLink === product.category);
    });

    var headerCategory = document.getElementById("categorySelect");
    if (headerCategory) {
      headerCategory.value = product.category;
    }

    var productStars = document.querySelector('[data-role="product-stars"]');
    var reviewStars = document.querySelector('[data-role="review-stars"]');
    if (productStars) {
      productStars.innerHTML = starsHtml;
      productStars.setAttribute("aria-label", product.rating + " out of 5 stars");
    }
    if (reviewStars) {
      reviewStars.innerHTML = starsHtml;
    }

    if (stockStatus) {
      if (product.stock > 20) {
        stockStatus.innerHTML = '<i class="bi bi-check-circle" aria-hidden="true"></i> In stock and ready to ship';
      } else if (product.stock > 0) {
        stockStatus.innerHTML = '<i class="bi bi-exclamation-circle" aria-hidden="true"></i> Low stock, ' + product.stock + " left";
      } else {
        stockStatus.innerHTML = '<i class="bi bi-x-circle" aria-hidden="true"></i> Temporarily out of stock';
      }
    }

    renderGallery(product, relatedProducts);
    renderHighlights(product);
    renderSpecifications(product);
    renderRelatedProducts(product, relatedProducts);
  }

  function renderInvalidProductState() {
    var section = document.querySelector(".section-space");
    if (section) {
      section.innerHTML = '<div class="container-fluid px-4"><div class="empty-state"><strong>Product not found.</strong><span>This prototype product is not available in the current catalog.</span><a class="btn btn-accent mt-3" href="products.html">Browse Products</a></div></div>';
    }
  }

  async function initProductDetailPage() {
    var productId = getProductIdFromUrl();
    var product = await loadProduct(productId);

    if (!product) {
      renderInvalidProductState();
      return;
    }

    renderProduct(product, await loadRelatedProducts(product), currentProductSource);

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
        setQuantityValue(getQuantityValue());
        window.location.href = "checkout.html";
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
  }

  window.ShopLitePages = window.ShopLitePages || {};
  window.ShopLitePages["product-detail"] = initProductDetailPage;
  window.ShopLitePages.productDetail = initProductDetailPage;
}());
