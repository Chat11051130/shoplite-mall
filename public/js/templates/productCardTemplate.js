(function () {
  "use strict";

  function formatPrice(value) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(value);
  }

  function formatReviews(value) {
    return new Intl.NumberFormat("en-US").format(value);
  }

  function buildStars(rating) {
    var full = Math.floor(rating);
    var hasHalf = rating - full >= 0.5;
    var html = "";

    for (var index = 1; index <= 5; index += 1) {
      if (index <= full) {
        html += '<i class="bi bi-star-fill" aria-hidden="true"></i>';
      } else if (index === full + 1 && hasHalf) {
        html += '<i class="bi bi-star-half" aria-hidden="true"></i>';
      } else {
        html += '<i class="bi bi-star" aria-hidden="true"></i>';
      }
    }

    return html;
  }

  function productCardTemplate(product) {
    return [
      '<article class="col-xl-3 col-lg-4 col-md-6" data-product-id="' + product.id + '" data-category="' + product.category + '" data-price="' + product.price + '" data-rating="' + product.rating + '">',
      '  <div class="product-card">',
      '    <div class="product-media">',
      '      <img src="' + product.image + '" alt="' + product.alt + '" loading="lazy">',
      '      <span class="discount-tag">' + product.discount + "</span>",
      "    </div>",
      '    <div class="product-body">',
      '      <div class="product-category">' + product.category + "</div>",
      '      <h3 class="product-title">' + product.title + "</h3>",
      '      <div class="rating-row" aria-label="' + product.rating + ' out of 5 stars">',
      '        <span class="stars">' + buildStars(product.rating) + "</span>",
      '        <span class="review-count">' + formatReviews(product.reviews) + "</span>",
      "      </div>",
      '      <div class="price-row-card">',
      '        <span class="current-price">' + formatPrice(product.price) + "</span>",
      '        <span class="old-price">' + formatPrice(product.oldPrice) + "</span>",
      "      </div>",
      '      <p class="shipping-info">' + product.shipping + "</p>",
      '      <button class="btn add-cart-btn" type="button" data-action="add-to-cart" data-product-id="' + product.id + '">',
      '        <i class="bi bi-cart-plus" aria-hidden="true"></i>',
      "        Add to Cart",
      "      </button>",
      "    </div>",
      "  </div>",
      "</article>"
    ].join("");
  }

  function miniCardTemplate(product) {
    return [
      '<article class="mini-card" data-product-id="' + product.id + '" data-category="' + product.category + '" data-price="' + product.price + '" data-rating="' + product.rating + '">',
      '  <img src="' + product.image + '" alt="' + product.alt + '" loading="lazy">',
      "  <div>",
      "    <strong>" + product.title + "</strong>",
      '    <span class="stars" aria-label="' + product.rating + ' out of 5 stars">' + buildStars(product.rating) + "</span>",
      "    <span>" + formatPrice(product.price) + "</span>",
      "  </div>",
      "</article>"
    ].join("");
  }

  window.ShopLiteTemplates = {
    buildStars: buildStars,
    formatPrice: formatPrice,
    formatReviews: formatReviews,
    miniCardTemplate: miniCardTemplate,
    productCardTemplate: productCardTemplate
  };
}());
