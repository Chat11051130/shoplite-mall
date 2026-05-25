# Order API Phase 4

## Scope

This phase adds JSON-backed order creation and order reading, then connects checkout, order success, and My Orders pages to the order API.

The implementation still uses the fixed demo cart:

```text
cartId = "demo-cart"
```

No real payment processing, real authentication/session, admin write APIs, database code, frontend redesign, or `public/design-preview/` changes were introduced.

## Files Created Or Modified

Backend:

- `server/app.js`
- `server/data/carts.json`
- `server/data/orders.json`
- `server/routes/orderRoutes.js`
- `server/controllers/orderController.js`
- `server/services/orderService.js`
- `server/repositories/orderRepository.js`

Frontend:

- `public/checkout.html`
- `public/order-success.html`
- `public/orders.html`
- `public/js/pages/checkoutPage.js`
- `public/js/pages/orderSuccessPage.js`
- `public/js/pages/ordersPage.js`

## Order API Design

The order API is mounted under:

```text
/api/orders
```

Available endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/orders` | Return all orders, sorted newest first |
| `GET` | `/api/orders/:id` | Return one order by ID |
| `POST` | `/api/orders` | Create an order from the current demo cart |

Invalid order IDs return a `404` JSON error.

## Order Data Shape

Orders are stored in `server/data/orders.json`. Each created order includes:

- `id`
- `createdAt`
- `status`
- `customerName`
- `phone`
- `shippingAddress`
- `city`
- `state`
- `zip`
- `deliveryOption`
- `paymentMethod`
- `items`
- `summary`

Each order item stores:

- `productId`
- `title`
- `price`
- `quantity`
- `image`
- `category`

## Fixed Demo Cart Limitation

`POST /api/orders` always reads from the fixed `demo-cart`. There is no user-scoped cart yet because real authentication/session is intentionally out of scope for this phase.

After a successful order is created, the demo cart is cleared with the existing cart service.

## Order Summary Rules

Order totals use these Phase 4 rules:

- `subtotal` comes from current cart items.
- `shipping = 0` for `standard` delivery.
- `shipping = 8.99` for `priority` delivery.
- `tax = round(subtotal * 0.075)` to 2 decimals.
- `savings = min(48.50, subtotal)` if subtotal is greater than `0`.
- `total = max(0, subtotal + shipping + tax - savings)`.

## Checkout Integration

`public/js/pages/checkoutPage.js` now:

- keeps existing invalid-form validation on `checkout.html`
- sends valid checkout form data to `POST /api/orders`
- sends `customerName`, `phone`, `shippingAddress`, `city`, `state`, `zip`, `deliveryOption`, and `paymentMethod`
- navigates to `order-success.html?orderId=<createdOrder.id>` on success
- stays on `checkout.html` with validation/toast feedback on API failure

No real payment processing was added.

## Order Success Integration

`public/js/pages/orderSuccessPage.js` now:

- reads `orderId` from the confirmation URL
- calls `GET /api/orders/:id`
- renders the order ID, delivery estimate, payment status, order items, and order total
- shows a clean fallback state when `orderId` is missing or invalid
- keeps View My Orders navigation to `orders.html`
- keeps recommended-product Add to Cart behavior through the cart API

## Orders Page Integration

`public/js/pages/ordersPage.js` now:

- calls `GET /api/orders`
- renders backend orders into the existing order-card layout
- keeps status tab filtering
- keeps order search filtering
- keeps the View Details offcanvas and fills it with backend order data
- reorders backend order items through `POST /api/cart/items`
- falls back to the static order cards if the orders API is unavailable

## Fallback Strategy

Fallback behavior remains local and non-blocking:

- Checkout shows an error and stays on the page if order creation fails.
- Order success shows a clean order lookup fallback if the order is missing or cannot be loaded.
- My Orders keeps the original static order cards only if the orders API request fails.

## API Smoke Results

Express server tested at `http://127.0.0.1:3100`:

| Check | Result |
|---|---|
| `GET /api/orders` | returned order list JSON |
| `POST /api/orders` with valid payload and non-empty cart | created order `SL-...` |
| `GET /api/orders/:createdId` | returned created order with status `processing` |
| `GET /api/orders/invalid-id` | returned `404` JSON |
| `GET /api/cart` after successful order | returned empty cart with `itemCount=0` |
| `POST /api/orders` with empty cart | returned `400` validation error |

After testing, `server/data/orders.json` was restored to `[]` and `server/data/carts.json` was restored to the fixed demo cart seed.

## Browser Smoke Results

Browser checks through the Express server passed:

- Added a product to cart from `products.html` through the cart API.
- Opened `cart.html` and confirmed API cart items rendered.
- Proceeded from cart to `checkout.html`.
- Submitted valid default checkout form.
- Confirmed navigation to `order-success.html?orderId=<createdId>`.
- Confirmed order success rendered the created order ID and total.
- Confirmed `GET /api/cart` was empty after successful order creation.
- Clicked View My Orders and confirmed `orders.html` included the created backend order.
- Clicked View Details and confirmed the detail panel showed the created order.
- Clicked Reorder and confirmed cart count updated through the cart API.
- Regression checks passed for `products.html?query=laptop`, `product-detail.html?productId=7`, `cart.html`, `login.html`, `register.html`, and admin pages.

## Static Checks

Completed checks:

- `node --check` for server JavaScript files.
- `node --check` for modified public JavaScript files.
- `git diff --check`.
- Chinese character scan on changed code and documentation.
- Scan confirmed no React, Vue, TypeScript, Tailwind, database dependency, unrelated frontend redesign, or `public/design-preview/` change was introduced.

## Remaining Backend Work

Recommended next phases:

- Add auth/session and replace fixed `demo-cart` with user-scoped carts and orders.
- Connect checkout summary display to the current cart API before submission.
- Add admin order management APIs.
- Add order status update APIs.
- Add real payment only after auth, cart, and order contracts are stable.
- Replace JSON file storage with a database only after route and data contracts are finalized.
