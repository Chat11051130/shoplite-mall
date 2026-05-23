const products = [
  {
    id: 1,
    category: "electronics",
    title: "AeroBook 14-inch lightweight laptop with long-life battery",
    rating: 4.7,
    reviews: 1248,
    price: 679.99,
    oldPrice: 799.99,
    discount: "15% off",
    shipping: "Free delivery tomorrow with ShopLite Express",
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=700&q=80",
    alt: "Open laptop on a work desk"
  },
  {
    id: 2,
    category: "electronics",
    title: "PulseWave wireless noise-canceling headphones",
    rating: 4.6,
    reviews: 893,
    price: 129.95,
    oldPrice: 179.95,
    discount: "28% off",
    shipping: "Ships free, arrives in 2 days",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=80",
    alt: "Black wireless headphones"
  },
  {
    id: 3,
    category: "fashion",
    title: "StrideFlex everyday running sneakers for city comfort",
    rating: 4.5,
    reviews: 542,
    price: 74.5,
    oldPrice: 99.0,
    discount: "25% off",
    shipping: "Free returns on eligible sizes",
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=700&q=80",
    alt: "Generic running sneakers"
  },
  {
    id: 4,
    category: "fashion",
    title: "Classic round dial watch with leather strap",
    rating: 4.3,
    reviews: 319,
    price: 58.0,
    oldPrice: 86.0,
    discount: "33% off",
    shipping: "Low-stock deal with tracked shipping",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=80",
    alt: "Classic wristwatch"
  },
  {
    id: 5,
    category: "home",
    title: "Nordic task chair with breathable woven seat",
    rating: 4.4,
    reviews: 778,
    price: 149.99,
    oldPrice: 199.99,
    discount: "Save $50",
    shipping: "Oversize item, doorstep delivery included",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=700&q=80",
    alt: "Modern chair in a bright room"
  },
  {
    id: 6,
    category: "home",
    title: "Compact espresso maker for weekday coffee routines",
    rating: 4.2,
    reviews: 403,
    price: 189.0,
    oldPrice: 239.0,
    discount: "21% off",
    shipping: "Ships today from a local warehouse",
    image: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=700&q=80",
    alt: "Espresso machine on a kitchen counter"
  },
  {
    id: 7,
    category: "beauty",
    title: "GlowDaily skincare set with cleanser and moisturizer",
    rating: 4.8,
    reviews: 1560,
    price: 42.99,
    oldPrice: 59.99,
    discount: "Bundle deal",
    shipping: "Eligible for subscription savings",
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=700&q=80",
    alt: "Skincare bottles and cosmetics"
  },
  {
    id: 8,
    category: "grocery",
    title: "Organic pantry starter box with snacks and grains",
    rating: 4.1,
    reviews: 228,
    price: 36.5,
    oldPrice: 45.0,
    discount: "19% off",
    shipping: "Freshness packed, delivery this week",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=700&q=80",
    alt: "Fresh groceries and packaged food"
  },
  {
    id: 9,
    category: "sports",
    title: "HydroTrail insulated stainless water bottle",
    rating: 4.6,
    reviews: 674,
    price: 24.99,
    oldPrice: 34.99,
    discount: "29% off",
    shipping: "Add-on friendly with free shipping over $35",
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=700&q=80",
    alt: "Reusable stainless steel water bottle"
  },
  {
    id: 10,
    category: "electronics",
    title: "CreatorPro mechanical keyboard with quiet tactile switches",
    rating: 4.7,
    reviews: 931,
    price: 88.75,
    oldPrice: 119.0,
    discount: "25% off",
    shipping: "Free delivery and easy replacement",
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=700&q=80",
    alt: "Mechanical keyboard close up"
  },
  {
    id: 11,
    category: "sports",
    title: "ActiveFit yoga mat with alignment marks and carry strap",
    rating: 4.4,
    reviews: 358,
    price: 31.99,
    oldPrice: 44.99,
    discount: "Save 29%",
    shipping: "Roll-packed for fast locker pickup",
    image: "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?auto=format&fit=crop&w=700&q=80",
    alt: "Yoga mat and fitness accessories"
  },
  {
    id: 12,
    category: "beauty",
    title: "Studio ceramic hair dryer with three heat settings",
    rating: 4.0,
    reviews: 186,
    price: 54.99,
    oldPrice: 74.99,
    discount: "27% off",
    shipping: "Free shipping on beauty orders over $25",
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=700&q=80",
    alt: "Beauty products on a vanity"
  }
];

const rails = {
  bestSellerRail: [7, 1, 2, 10],
  dealRail: [3, 6, 9, 12],
  recommendedRail: [5, 8, 4, 11]
};

let cartCount = 3;

const productGrid = document.getElementById("productGrid");
const resultCount = document.getElementById("resultCount");
const priceRange = document.getElementById("priceRange");
const priceValue = document.getElementById("priceValue");
const sortSelect = document.getElementById("sortSelect");
const categorySelect = document.getElementById("categorySelect");
const searchInput = document.getElementById("searchInput");
const searchForm = document.getElementById("searchForm");
const cartCountEl = document.getElementById("cartCount");
const cartButton = document.getElementById("cartButton");
const cartToastEl = document.getElementById("cartToast");
const toast = cartToastEl ? new bootstrap.Toast(cartToastEl, { delay: 1600 }) : null;

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
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.5;
  let html = "";

  for (let index = 1; index <= 5; index += 1) {
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

function productCard(product) {
  return `
    <article class="col-xl-3 col-lg-4 col-md-6">
      <div class="product-card">
        <div class="product-media">
          <img src="${product.image}" alt="${product.alt}" loading="lazy">
          <span class="discount-tag">${product.discount}</span>
        </div>
        <div class="product-body">
          <div class="product-category">${product.category}</div>
          <h3 class="product-title">${product.title}</h3>
          <div class="rating-row" aria-label="${product.rating} out of 5 stars">
            <span class="stars">${buildStars(product.rating)}</span>
            <span class="review-count">${formatReviews(product.reviews)}</span>
          </div>
          <div class="price-row-card">
            <span class="current-price">${formatPrice(product.price)}</span>
            <span class="old-price">${formatPrice(product.oldPrice)}</span>
          </div>
          <p class="shipping-info">${product.shipping}</p>
          <button class="btn add-cart-btn" type="button" data-product-id="${product.id}">
            <i class="bi bi-cart-plus" aria-hidden="true"></i>
            Add to Cart
          </button>
        </div>
      </div>
    </article>
  `;
}

function miniCard(product) {
  return `
    <article class="mini-card">
      <img src="${product.image}" alt="${product.alt}" loading="lazy">
      <div>
        <strong>${product.title}</strong>
        <span class="stars" aria-label="${product.rating} out of 5 stars">${buildStars(product.rating)}</span>
        <span>${formatPrice(product.price)}</span>
      </div>
    </article>
  `;
}

function fallbackImage(label) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="700" height="525" viewBox="0 0 700 525">
      <rect width="700" height="525" fill="#eef2f7"/>
      <rect x="54" y="58" width="592" height="409" rx="14" fill="#ffffff" stroke="#d1d5db" stroke-width="3"/>
      <circle cx="350" cy="218" r="82" fill="#f59e0b" opacity="0.18"/>
      <path d="M238 315h224l-31 50H269l-31-50Z" fill="#111827" opacity="0.9"/>
      <rect x="264" y="170" width="172" height="118" rx="10" fill="#1e2a42"/>
      <rect x="282" y="188" width="136" height="82" rx="5" fill="#f8fafc"/>
      <text x="350" y="418" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="800" fill="#111827">${label}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function selectedCategories() {
  return [...document.querySelectorAll(".category-filter:checked")].map((input) => input.value);
}

function selectedRating() {
  const selected = document.querySelector(".rating-filter:checked");
  return selected ? Number(selected.value) : 0;
}

function applyFilters() {
  const maxPrice = Number(priceRange.value);
  const categories = selectedCategories();
  const minimumRating = selectedRating();
  const categoryDropdown = categorySelect.value;
  const query = searchInput.value.trim().toLowerCase();

  let filtered = products.filter((product) => {
    const categoryMatch = categories.length === 0 || categories.includes(product.category);
    const dropdownMatch = categoryDropdown === "all" || product.category === categoryDropdown;
    const priceMatch = product.price <= maxPrice;
    const ratingMatch = product.rating >= minimumRating;
    const queryMatch = !query || product.title.toLowerCase().includes(query) || product.category.includes(query);
    return categoryMatch && dropdownMatch && priceMatch && ratingMatch && queryMatch;
  });

  if (sortSelect.value === "price-low") {
    filtered = filtered.sort((a, b) => a.price - b.price);
  } else if (sortSelect.value === "price-high") {
    filtered = filtered.sort((a, b) => b.price - a.price);
  } else if (sortSelect.value === "rating") {
    filtered = filtered.sort((a, b) => b.rating - a.rating);
  }

  priceValue.textContent = formatPrice(maxPrice);
  resultCount.textContent = `${filtered.length} item${filtered.length === 1 ? "" : "s"}`;

  if (filtered.length === 0) {
    productGrid.innerHTML = `
      <div class="col-12">
        <div class="empty-state">
          <strong>No products match these filters.</strong>
          <span>Clear filters or increase the price range to see more ShopLite items.</span>
        </div>
      </div>
    `;
    return;
  }

  productGrid.innerHTML = filtered.map(productCard).join("");
}

function renderRails() {
  Object.entries(rails).forEach(([railId, productIds]) => {
    const rail = document.getElementById(railId);
    const railProducts = productIds
      .map((id) => products.find((product) => product.id === id))
      .filter(Boolean);
    rail.innerHTML = railProducts.map(miniCard).join("");
  });
}

function attachImageFallbacks() {
  document.querySelectorAll("img").forEach((img) => {
    img.addEventListener("error", () => {
      if (img.dataset.fallbackApplied === "true") {
        return;
      }
      img.dataset.fallbackApplied = "true";
      img.src = fallbackImage(img.alt || "ShopLite product");
    });
  });
}

function updateCart() {
  cartCount += 1;
  cartCountEl.textContent = cartCount;
  cartButton.setAttribute("aria-label", `Shopping cart with ${cartCount} items`);
  if (toast) {
    toast.show();
  }
}

document.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-product-id]");
  if (addButton) {
    updateCart();
  }

  const categoryLink = event.target.closest("[data-category-link]");
  if (categoryLink) {
    event.preventDefault();
    const category = categoryLink.dataset.categoryLink;
    document.querySelectorAll("[data-category-link]").forEach((link) => link.classList.remove("active"));
    categoryLink.classList.add("active");
    categorySelect.value = category === "deals" ? "all" : category;
    if (category === "deals") {
      document.getElementById("todayDeals").scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      applyFilters();
      document.querySelector(".marketplace-shell").scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
});

document.querySelectorAll(".category-filter, .rating-filter").forEach((input) => {
  input.addEventListener("change", applyFilters);
});

priceRange.addEventListener("input", applyFilters);
sortSelect.addEventListener("change", applyFilters);
categorySelect.addEventListener("change", applyFilters);
searchInput.addEventListener("input", applyFilters);

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  applyFilters();
  document.querySelector(".marketplace-shell").scrollIntoView({ behavior: "smooth", block: "start" });
});

document.getElementById("clearFilters").addEventListener("click", () => {
  document.querySelectorAll(".category-filter").forEach((input) => {
    input.checked = false;
  });
  document.querySelector('[name="rating"][value="4"]').checked = true;
  priceRange.value = priceRange.max;
  sortSelect.value = "featured";
  categorySelect.value = "all";
  searchInput.value = "";
  document.querySelectorAll("[data-category-link]").forEach((link) => link.classList.remove("active"));
  applyFilters();
});

renderRails();
applyFilters();
attachImageFallbacks();
