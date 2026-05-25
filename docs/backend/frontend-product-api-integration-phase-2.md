# Frontend Product API Integration Phase 2

## Scope

This phase connects only the official product browsing pages to the Phase 1 backend product API:

- `public/products.html`
- `public/product-detail.html`

The homepage, cart, checkout, orders, auth, and admin pages remain visually and behaviorally unchanged. No cart persistence, checkout APIs, auth/session APIs, admin write APIs, database code, or `public/design-preview/` changes were introduced.

## Files Modified

- `public/products.html`
- `public/product-detail.html`
- `public/js/core/apiClient.js`
- `public/js/pages/productsPage.js`
- `public/js/pages/productDetailPage.js`

## API Client Design

`public/js/core/apiClient.js` centralizes browser API access behind:

- `getJson(url)`: performs the browser request, parses JSON, and throws a structured error for non-2xx responses.
- `buildQueryString(params)`: builds query strings while omitting empty values.

Browser `fetch` usage is intentionally isolated to this file so future API behavior can be adjusted in one place.

## Products Page Integration

`public/js/pages/productsPage.js` now requests product data from:

- `GET /api/products`

Supported query parameters passed through from page state:

- `category`
- `query`
- `sort`
- `rating`
- `maxPrice`
- `tag`

The page still preserves existing UI behavior:

- product grid rendering
- result count updates
- category filtering
- query filtering
- sort controls
- rating filtering
- price filtering
- Load More behavior
- Add to Cart toast and cart count update
- product card links to `product-detail.html?productId=<id>`

When the API succeeds, the product grid marks its data source as `api`. If the API fails, the page falls back to `window.ShopLiteData.products` and marks the grid data source as `fallback`.

## Product Detail Integration

`public/js/pages/productDetailPage.js` now reads `productId` from the URL and requests:

- `GET /api/products/:id`

The page renders API product fields into the existing detail UI:

- title
- category
- price
- old price
- discount
- rating
- reviews
- stock status
- product image gallery
- highlights
- specifications
- related products

Related products are loaded from:

- `GET /api/products?category=<category>`

If the product or related-products API request fails, the page falls back to `window.ShopLiteData.products`. Invalid product IDs display the existing clean empty state with a link back to `products.html`.

## Fallback Strategy

The local catalog remains loaded on `products.html` and `product-detail.html` as a safe offline/static preview fallback. API failures do not block rendering; the page logs a warning and renders local catalog data.

Fallback was browser-tested by aborting `/api/products` requests:

- `products.html?category=fashion` rendered 8 local fallback products.
- `product-detail.html?productId=1` rendered the local AeroBook product.

## API Endpoints Tested

Express server tested at `http://127.0.0.1:3100`:

| Endpoint | Result |
|---|---:|
| `GET /` | `200`, frontend served |
| `GET /api/products` | `48` products |
| `GET /api/products?category=electronics` | `8` products |
| `GET /api/products?query=laptop` | `3` products |
| `GET /api/products?category=home&sort=price-low` | `8` products, sorted ascending by price |
| `GET /api/products?category=beauty&rating=4` | `8` products, all rating `>= 4` |
| `GET /api/products/1` | product `1` returned |
| `GET /api/products/7` | product `7` returned |
| `GET /api/products/999999` | `404` JSON error |

## Browser Smoke Results

Browser smoke checks through the Express server passed:

- `products.html` rendered API products with 16 initial product cards.
- `Load More` increased visible product cards to 32.
- Product card image/title links target `product-detail.html?productId=<id>`.
- Add to Cart updated the cart count without navigating away.
- `products.html?category=electronics` rendered 8 electronics products.
- `products.html?query=laptop` rendered 3 matching products.
- `products.html?category=home&sort=price-low` rendered home products in ascending price order.
- `products.html?category=beauty&rating=4` rendered only products rated 4 or higher.
- `product-detail.html?productId=1` and `product-detail.html?productId=7` rendered different API products.
- Product detail related-products rail rendered 4 items.
- Normal API-backed browser checks completed with 0 console errors.
- Fallback checks rendered local catalog data when API requests were intentionally aborted.

## Static Checks

Completed checks:

- `node --check` for modified frontend JavaScript.
- `node --check` for server JavaScript.
- `git diff --check`.
- Chinese character scan on changed code files.
- Scan confirmed no React, Vue, TypeScript, Tailwind, database dependency, backend route change, or `public/design-preview/` change was introduced.
- Scan confirmed browser `fetch` usage is centralized in `public/js/core/apiClient.js`.

## Remaining Backend Integration Work

Recommended next backend/frontend phases:

- Connect homepage curated sections to product API if desired.
- Add cart persistence API and connect cart state.
- Add checkout and order creation APIs.
- Add auth/session APIs.
- Add admin read/write APIs for products and orders.
- Replace JSON file storage with a database only after route contracts stabilize.
