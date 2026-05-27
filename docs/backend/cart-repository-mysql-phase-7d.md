# Cart Repository MySQL Phase 7D

## Goal

Phase 7D migrates cart runtime persistence from `server/data/carts.json` to the MySQL `carts` and `cart_items` tables while preserving the existing user-scoped cart API, frontend cart behavior, cart badge synchronization, and checkout compatibility.

## Files Modified

- `server/repositories/cartRepository.js`
- `public/js/pages/checkoutPage.js`
- `docs/backend/cart-repository-mysql-phase-7d.md`

`public/js/pages/checkoutPage.js` received a narrow compatibility update so the existing checkout summary card renders the current API cart instead of the old static summary rows.

## Repository Functions Migrated

`server/repositories/cartRepository.js` now uses the MySQL pool from `server/database/database.js` for:

- `findAll()`
- `getCartByUserId(userId)`
- `createCartForUser(userId)`
- `getOrCreateCartForUser(userId)`
- `saveCart(cart)`
- `updateItemQuantityForUser(userId, productId, quantity)`
- `removeItemForUser(userId, productId)`
- `clearCartForUser(userId)`

The runtime cart repository no longer reads or writes `server/data/carts.json`.

## MySQL Cart Data Model

Runtime cart data now uses:

- `carts.id`
- `carts.user_id`
- `cart_items.cart_id`
- `cart_items.product_id`
- `cart_items.quantity`

Product enrichment still happens through `cartService`, which reads product metadata from the MySQL-backed product repository.

## MySQL-to-API Field Mapping

The repository maps database rows back to the existing service contract:

- `carts.id` -> `id`
- `carts.user_id` -> `userId`
- `cart_items.product_id` -> `items[].productId`
- `cart_items.quantity` -> `items[].quantity`

`cartService` keeps returning the existing API-compatible cart shape:

- `id`
- `userId`
- `items`
- `summary.subtotal`
- `summary.shipping`
- `summary.savings`
- `summary.total`
- `summary.itemCount`

## Lazy Cart Creation

`getOrCreateCartForUser(userId)` checks for an existing cart row by `user_id`. If no row exists, it creates one with a deterministic ID in the form:

```text
cart-<userId>
```

The implementation also handles pre-seeded cart IDs safely by loading the cart by `user_id` after an insert/upsert.

## Cart Operations

- Add to Cart inserts or replaces the current user's `cart_items` through `saveCart(cart)`.
- Adding the same product increments quantity through the existing service logic.
- Quantity updates write to `cart_items.quantity`.
- Remove deletes only the matching current-user cart item.
- Clear Cart deletes only the current user's `cart_items` rows and keeps the `carts` row.
- Invalid product IDs and invalid quantities preserve the existing service error behavior.

## User Isolation

Cart access remains protected by the existing `requireAuth` middleware on `cartRoutes`.

Smoke checks confirmed:

- signed-out cart requests return 401
- user A cart rows are separate from user B cart rows
- clearing user B cart does not clear user A cart
- logging back in as user A shows user A's cart contents

## Checkout Compatibility

Order persistence remains JSON-backed in this phase. Checkout compatibility is preserved because `orderService.createOrder()` already consumes cart data through `cartService.getCart(userId)` and clears the cart through `cartService.clearCart(userId)`.

The checkout page summary card now loads `/api/cart` and renders the current user's cart items before placing an order. Successful checkout creates the order through the existing JSON-backed order implementation and clears the current user's MySQL cart.

## Schema and Seed Changes

- `server/database/schema.sql` was not changed.
- `server/database/seedDatabase.js` was not changed.
- `server/data/carts.json` was not modified.
- `server/data/orders.json` was restored after checkout smoke tests.

## Validation Commands

Passed:

```powershell
npm run db:reset
node --check server\repositories\cartRepository.js
node --check public\js\pages\checkoutPage.js
Get-ChildItem -Path server -Recurse -Filter *.js | ForEach-Object { node --check $_.FullName }
Get-ChildItem -Path public\js -Recurse -Filter *.js | ForEach-Object { node --check $_.FullName }
git diff --check
```

Static scans passed:

- no Chinese/CJK characters in changed code/comments
- no React, Vue, TypeScript, Tailwind, JWT, or ORM code introduced
- no runtime cart repository reference to `carts.json`, `readJsonFile`, `writeJsonFile`, or `dataPath`

## API Smoke Results

Passed through `http://localhost:3000`:

- signed-out `GET /api/cart` returns 401
- signed-out `POST /api/cart/items` returns 401
- seeded customer login works
- `GET /api/cart` returns the current user's MySQL cart
- `POST /api/cart/items` adds product 1
- second `POST /api/cart/items` for product 1 increments quantity
- `PATCH /api/cart/items/1` updates quantity
- `DELETE /api/cart/items/1` removes product 1
- `POST /api/cart/items` adds product 7
- `DELETE /api/cart` clears only the current user's cart
- invalid product ID returns 404
- invalid quantity returns 400
- user A and user B carts remain isolated
- product API regression still returns 48 MySQL products
- admin authorization still works with MySQL-backed users
- checkout creates an order through the current JSON-backed order implementation and clears the current user's MySQL cart

## Browser Smoke Results

Passed through `http://localhost:3000`:

- signed-out home page loads with cart count 0
- `products.html` loads products from the API
- product cards link to `product-detail.html?productId=<id>`
- `product-detail.html?productId=1` loads API product data
- signed-out Add to Cart redirects to `login.html?returnTo=...`
- seeded customer login works
- Add to Cart from products, home, and product detail updates MySQL cart count
- `cart.html` renders MySQL cart items
- quantity increase/decrease updates MySQL summary
- remove item updates MySQL summary
- clear cart updates MySQL and shows the empty state
- navigating away and back preserves MySQL cart state
- `checkout.html` renders the current MySQL cart item summary
- checkout creates an order and clears cart count
- `orders.html` still works with the current JSON-backed order implementation
- Reorder adds items back through the current user's MySQL cart API
- logout clears header state and cart count
- `admin-dashboard.html` loads backend dashboard data and category images
- `admin-products.html` loads MySQL products
- `admin-orders.html` loads current order data
- no unexpected browser console or page errors were observed

## MySQL Data Validation

During API smoke checks:

- Add to Cart created/used a row in `carts` for the current user.
- Add to Cart created a matching `cart_items` row.
- Quantity update changed `cart_items.quantity`.
- Remove item deleted the matching `cart_items` row.
- Clear Cart deleted only the current user's `cart_items` rows.
- Another user's `cart_items` rows were not deleted.

After cleanup and `npm run db:reset`, the database baseline was:

- `users`: 2
- `products`: 48
- `carts`: 2
- `cart_items`: 0
- `orders`: 4
- `order_items`: 6

`products` and `users` counts match the JSON seed files. `server/data/carts.json` remained unchanged.

## Runtime Boundary

After Phase 7D:

- products use MySQL
- users/auth use MySQL
- carts use MySQL
- orders still use JSON

No order repository migration happened in this phase.

## Remaining Phases

- Phase 7E: migrate orders repository to MySQL
- Phase 7F: final MySQL regression audit
