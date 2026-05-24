# Catalog Experience Upgrade

## Purpose

The storefront now separates homepage discovery from full product browsing. The homepage stays promotional and curated, while `public/products.html` becomes the official catalog, category, search, filter, and sorting surface.

## Files Added

- `public/products.html`
- `public/js/pages/productsPage.js`
- `public/js/data/productCatalog.js`

## Product Catalog Structure

The shared mock catalog uses the existing browser-global project style:

```js
window.ShopLiteData = window.ShopLiteData || {};
window.ShopLiteData.products = [];
```

The catalog contains 48 static products:

| Category | Count |
|---|---:|
| Electronics | 8 |
| Fashion | 8 |
| Home | 8 |
| Beauty | 8 |
| Grocery | 8 |
| Sports | 8 |

Each product includes `id`, `category`, `title`, `rating`, `reviews`, `price`, `oldPrice`, `discount`, `shipping`, `image`, `alt`, `stock`, `badge`, `tags`, `shortDescription`, `highlights`, and `details`.

## Homepage Responsibility

`public/index.html` now focuses on discovery:

- Hero carousel
- Benefit strip
- Curated featured grid with 12 products
- Best Sellers rail with 4 products
- Today's Deals rail with 4 products
- Recommended for You rail with 4 products
- Category and CTA entry points into `products.html`

The homepage no longer acts as the full catalog. Legacy `index.html?category=...` or `index.html?query=...` routes redirect to `products.html` with the same query string.

## Listing Page Responsibility

`public/products.html` owns full browsing:

- Customer header and category navigation
- Dynamic page title and category label
- Filter sidebar
- Product grid
- Sort dropdown
- Result count
- Load More pagination
- Empty state
- Footer
- Add to Cart toast and cart count updates

## Supported URL Patterns

- `products.html`
- `products.html?category=electronics`
- `products.html?category=fashion`
- `products.html?category=home`
- `products.html?category=beauty`
- `products.html?category=grocery`
- `products.html?category=sports`
- `products.html?query=laptop`
- `products.html?category=home&sort=price-low`
- `products.html?category=beauty&rating=4`
- `products.html?tag=deal`
- `products.html?section=deals`

## Product Detail Behavior

`public/product-detail.html` now reads `product-detail.html?productId=<id>` and renders from `window.ShopLiteData.products`.

Updated dynamic areas include:

- Product title
- Category and breadcrumb link
- Price and old price
- Discount
- Rating and review count
- Stock status
- Main image and gallery thumbnails
- Highlights
- Specifications table
- Review summary
- Related products from the same category

If a product ID is missing or invalid, the page safely falls back to the first catalog product.

## CTA Improvements

- Hero "Shop featured deals" routes to `products.html?tag=deal`.
- Hero "Browse home deals" routes to `products.html?category=home&tag=deal`.
- Hero "See recommendations" refreshes recommendations and scrolls to the recommendation rail.
- Best Sellers "View all" routes to `products.html?tag=best-seller`.
- Today's Deals "See deals" routes to `products.html?tag=deal`.
- Deal band "Explore deals" routes to `products.html?tag=deal`.
- Recommended "Refresh" rotates four recommended products and shows a toast.
- Customer category nav links route to `products.html?category=...`.
- Customer search redirects to `products.html?query=...` with category when selected.

## Smoke Check Results

Browser smoke checks were run against `http://127.0.0.1:8767/`.

### Homepage

- Loaded with 0 local console errors.
- Rendered 12 curated product cards.
- Best Sellers rail rendered 4 cards.
- Today's Deals rail rendered 4 cards.
- Recommended rail rendered 4 cards.
- Homepage product count stayed below the 48-item catalog, confirming it is no longer the full catalog.
- Search for `laptop` redirected to `products.html?query=laptop`.
- Electronics category nav redirected to `products.html?category=electronics`.
- Recommendation refresh changed the four rendered recommendation cards.
- Deal and best-seller CTAs use real `products.html` routes.

### Products Listing

- `products.html` loaded with 0 local console errors.
- Initial listing rendered 16 of 48 products with Load More available.
- Load More increased visible products from 16 to 32.
- `products.html?category=electronics` rendered 8 electronics products.
- `products.html?category=fashion` rendered 8 fashion products.
- `products.html?category=home` rendered 8 home products.
- `products.html?category=beauty` rendered 8 beauty products.
- `products.html?category=grocery` rendered 8 grocery products.
- `products.html?category=sports` rendered 8 sports products.
- `products.html?query=laptop` rendered matching laptop-related products.
- `products.html?category=home&sort=price-low` sorted visible home products by ascending price.
- `products.html?category=beauty&rating=4` rendered only products rated at least 4.
- `products.html?maxPrice=40` rendered only visible products priced at or below 40.
- Clear Filters reset to all categories and 48 total results.
- Product card image navigation opened `product-detail.html?productId=25`.
- Add to Cart updated the cart count and stayed on `products.html`.

### Product Detail

- `product-detail.html?productId=1` rendered the AeroBook laptop with correct title, category, price, image, and 4 related products.
- `product-detail.html?productId=7` rendered the DeskHub adapter with correct title, category, price, image, and 4 related products.
- Quantity changed from 1 to 2.
- Add to Cart updated cart count.
- Buy Now showed prototype feedback.

### Regression

These pages loaded with 0 local console errors and their key components still appeared:

- `cart.html`
- `checkout.html`
- `order-success.html`
- `orders.html`
- `login.html`
- `register.html`
- `admin-products.html`
- `admin-product-form.html`
- `admin-orders.html`
- `admin-dashboard.html`

## Remaining Limitations

- Product data is still static JavaScript data, not backend data.
- Product detail uses a safe fallback product for invalid IDs instead of a backend 404.
- Cart count is still prototype-local UI state.
- No server routes, fetch calls, JSON data files, or backend persistence were added in this phase.
