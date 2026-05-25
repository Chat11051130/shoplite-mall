# Cart API Phase 3

## Scope

This phase adds a JSON-backed cart API and connects the existing cart-related frontend behavior to it. The implementation uses the fixed demo cart:

```text
cartId = "demo-cart"
```

No real authentication, checkout/order creation, admin APIs, database code, frontend redesign, or `public/design-preview/` changes were introduced.

## Files Created Or Modified

Backend:

- `server/app.js`
- `server/data/carts.json`
- `server/routes/cartRoutes.js`
- `server/controllers/cartController.js`
- `server/services/cartService.js`
- `server/repositories/cartRepository.js`

Frontend:

- `public/cart.html`
- `public/order-success.html`
- `public/js/core/apiClient.js`
- `public/js/pages/productsPage.js`
- `public/js/pages/productDetailPage.js`
- `public/js/pages/cartPage.js`
- `public/js/pages/orderSuccessPage.js`

## Cart API Design

The cart API is mounted under:

```text
/api/cart
```

Available endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/cart` | Return the enriched demo cart and summary |
| `POST` | `/api/cart/items` | Add an item or increment an existing item |
| `PATCH` | `/api/cart/items/:productId` | Update one item quantity |
| `DELETE` | `/api/cart/items/:productId` | Remove one item |
| `DELETE` | `/api/cart` | Clear the demo cart |

Cart repository access is isolated in `server/repositories/cartRepository.js`. Cart business rules and product enrichment are isolated in `server/services/cartService.js`.

## Data Shape

`server/data/carts.json` stores the fixed demo cart:

```json
[
  {
    "id": "demo-cart",
    "items": [
      { "productId": 1, "quantity": 1 },
      { "productId": 2, "quantity": 1 },
      { "productId": 17, "quantity": 1 }
    ]
  }
]
```

`GET /api/cart` returns:

- cart id
- enriched items with product data
- summary totals

## Summary Rules

The backend summary matches the current frontend prototype rules:

- `shipping = 0` when subtotal is `0` or subtotal is at least `35`
- `shipping = 6.99` otherwise
- `savings = min(48.50, subtotal)` when subtotal is greater than `0`
- `total = max(0, subtotal + shipping - savings)`
- `itemCount` is the sum of item quantities

## Frontend Integration Points

Add to Cart now calls `POST /api/cart/items` from:

- `public/js/pages/productsPage.js`
- `public/js/pages/productDetailPage.js`
- `public/js/pages/orderSuccessPage.js`

`public/js/pages/cartPage.js` now:

- loads cart data from `GET /api/cart`
- renders cart item rows from API data
- patches quantity changes with `PATCH /api/cart/items/:productId`
- removes rows with `DELETE /api/cart/items/:productId`
- clears the cart with `DELETE /api/cart`
- updates subtotal, shipping, savings, total, and cart count from API summaries
- preserves `checkout.html` navigation for Proceed to Checkout

`public/js/core/apiClient.js` now centralizes JSON requests for `GET`, `POST`, `PATCH`, and `DELETE`.

## Fallback Strategy

If the cart API fails:

- Add to Cart keeps the existing local cart-count fallback.
- `cart.html` keeps the existing static prototype DOM behavior where possible.
- A non-blocking toast warns that the local cart preview is being used.

Checkout remains static in this phase. No order is created from the cart yet.

## API Smoke Results

Express server tested at `http://127.0.0.1:3100`:

| Check | Result |
|---|---|
| `GET /api/cart` | returned `demo-cart` with 3 items and `itemCount=3` |
| `POST /api/cart/items` with `productId=1` | incremented product 1 and returned updated cart |
| `POST /api/cart/items` with `productId=999999` | returned `404` validation error |
| `PATCH /api/cart/items/1` with `quantity=2` | updated product 1 quantity |
| `DELETE /api/cart/items/1` | removed product 1 |
| `DELETE /api/cart` | returned empty cart summary |
| Reseed | restored products `1`, `2`, and `17` to `demo-cart` |

## Browser Smoke Results

Browser checks through the Express server passed:

- `products.html` Add to Cart updated cart count through the API to `4`.
- `product-detail.html?productId=1` Add to Cart updated cart count through the API to `4`.
- `order-success.html` recommended Add to Cart updated cart count through the API to `4`.
- `cart.html` rendered API cart items.
- Cart quantity increase and decrease updated API summary values.
- Removing a cart item updated API summary values.
- Clearing the cart rendered the empty state.
- Proceed to Checkout navigated to `checkout.html`.
- `products.html?query=laptop` still returned 3 product API results.
- `product-detail.html?productId=7` still rendered product API data.
- `checkout.html`, `order-success.html`, `orders.html`, `admin-products.html`, `admin-product-form.html`, `admin-orders.html`, and `admin-dashboard.html` loaded after the cart integration.

## Static Checks

Completed checks:

- `node --check` for server cart files and modified frontend scripts.
- `git diff --check`.
- Chinese character scan on changed code and documentation.
- Scan confirmed no React, Vue, TypeScript, Tailwind, database dependency, unrelated frontend redesign, or `public/design-preview/` change was introduced.
- Browser `fetch` usage remains centralized in `public/js/core/apiClient.js`.

## Remaining Backend Work

Recommended next phases:

- Add checkout/order creation APIs.
- Connect checkout to the cart API.
- Add auth/session and replace the fixed `demo-cart` with user-scoped carts.
- Add admin APIs after customer purchase flow contracts stabilize.
- Replace JSON file storage with a database only after route and data contracts are stable.
