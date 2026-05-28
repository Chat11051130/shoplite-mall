# Order Repository MySQL Phase 7E

## Goal

Phase 7E migrates order runtime persistence from `server/data/orders.json` to the MySQL `orders` and `order_items` tables while preserving checkout, order success, My Orders, admin order management, admin dashboard summaries, user-scoped ownership, admin authorization, and existing frontend behavior.

This is the final runtime business data migration phase before the final MySQL audit.

## Files Modified

- `server/repositories/orderRepository.js`
- `server/services/orderService.js`
- `docs/backend/order-repository-mysql-phase-7e.md`

No frontend files were changed in this phase.

## Repository Functions Migrated

`server/repositories/orderRepository.js` now uses the MySQL pool from `server/database/database.js` for:

- `findAll()`
- `findById(orderId)`
- `getAllOrders()`
- `getOrdersByUserId(userId)`
- `getOrderById(orderId)`
- `getOrderByIdForUser(orderId, userId)`
- `create(order)`
- `createOrderForUser(orderInput)`
- `saveAll(orders)`
- `updateOrderStatus(orderId, status)`

The runtime order repository no longer reads or writes `server/data/orders.json`.

## MySQL Order Data Model

Runtime order data now uses:

- `orders.id`
- `orders.user_id`
- `orders.status`
- `orders.customer_name`
- `orders.phone`
- `orders.shipping_address`
- `orders.city`
- `orders.state`
- `orders.zip`
- `orders.delivery_option`
- `orders.payment_method`
- `orders.subtotal`
- `orders.shipping`
- `orders.tax`
- `orders.savings`
- `orders.total`
- `orders.item_count`
- `orders.created_at`
- `orders.updated_at`
- `order_items.id`
- `order_items.order_id`
- `order_items.product_id`
- `order_items.title`
- `order_items.category`
- `order_items.image`
- `order_items.alt`
- `order_items.unit_price`
- `order_items.quantity`
- `order_items.line_total`

## MySQL-to-API Field Mapping

The repository maps database rows back to the existing API-compatible shape:

- `user_id` -> `userId`
- `customer_name` -> `customerName`
- `shipping_address` -> `shippingAddress`
- `delivery_option` -> `deliveryOption`
- `payment_method` -> `paymentMethod`
- `item_count` -> `itemCount`
- `created_at` -> `createdAt`
- `updated_at` -> `updatedAt`
- `order_id` -> `orderId`
- `product_id` -> `productId`
- `unit_price` -> `unitPrice`
- `line_total` -> `lineTotal`

For compatibility with existing frontend code, order responses include both:

- top-level totals such as `subtotal`, `shipping`, `tax`, `savings`, `total`, and `itemCount`
- the existing nested `summary` object

Order item responses include both `unitPrice` and `price`, with `price` retained for existing UI code.

## Checkout Order Creation

Checkout order creation now writes to MySQL:

- current user's cart is read through the MySQL-backed cart service
- checkout validation remains in `orderService`
- order totals use the existing subtotal, shipping, tax, savings, and total rules
- `orders` receives the order header and summary columns
- `order_items` receives one snapshot row per checkout item
- successful checkout clears only the current user's MySQL cart
- checkout still returns the created order so the frontend can navigate to `order-success.html?orderId=<id>`

Empty carts are still rejected.

## Order Item Snapshot Behavior

Order items preserve checkout-time product data:

- `product_id`
- `title`
- `category`
- `image`
- `alt`
- `unit_price`
- `quantity`
- `line_total`

This keeps historical order display stable even if a product changes later.

## User-Scoped Order Access

Customer order routes remain protected by `requireAuth`.

Verified behavior:

- signed-out customer order routes return 401
- `GET /api/orders` returns only the current user's MySQL orders
- `GET /api/orders/:id` returns only orders owned by the current user
- user B cannot see or fetch user A's order through customer routes

## Reorder Behavior

Reorder remains a frontend flow that reads the current user's order items and posts each product back to the existing cart API.

Verified behavior:

- user A can reorder user A's MySQL order
- reordered items are added to user A's MySQL cart
- user B's cart is not affected

## Admin Order Behavior

Admin order APIs now read and write MySQL order data:

- `GET /api/admin/orders`
- `GET /api/admin/orders/:id`
- `PATCH /api/admin/orders/:id/status`

Verified behavior:

- signed-out admin order API access returns 401
- customer admin order API access returns 403
- admin list returns all MySQL orders
- admin detail returns any MySQL order
- admin status update writes to `orders.status`
- status updates persist after refetch and browser refresh

## Admin Dashboard Order Behavior

`adminDashboardService` already reads orders through `orderRepository.getAllOrders()`. After the repository migration, dashboard order data is MySQL-backed without further dashboard service changes.

Verified behavior:

- summary totals use MySQL orders
- order status distribution uses MySQL orders
- recent orders use MySQL orders
- category sales use MySQL order items and product/category data

## Schema and Seed Changes

- `server/database/schema.sql` was not changed.
- `server/database/seedDatabase.js` was not changed.
- `server/data/orders.json` was not modified.
- `server/data/carts.json` was not modified.

The current committed `server/data/orders.json` contains 5 seed orders, so `npm run db:reset` currently seeds:

- `orders`: 5
- `order_items`: 7

## Validation Commands

Passed:

```powershell
npm run db:reset
node --check server\repositories\orderRepository.js
node --check server\services\orderService.js
Get-ChildItem -Path server -Recurse -Filter *.js | ForEach-Object { node --check $_.FullName }
git diff --check
```

Static scans passed:

- no Chinese/CJK characters in changed code/comments
- no React, Vue, TypeScript, Tailwind, JWT, or ORM code introduced
- runtime order code no longer references `orders.json`, `readJsonFile`, `writeJsonFile`, or `dataPath`

## API Smoke Results

Passed through `http://localhost:3000`:

- signed-out `GET /api/orders` returns 401
- signed-out `GET /api/orders/:id` returns 401
- signed-out `POST /api/orders` returns 401
- signed-out admin order API access returns 401
- seeded customer login works
- `GET /api/cart` shows MySQL cart items before checkout
- `POST /api/orders` creates a MySQL order
- response includes created order ID and item snapshots
- MySQL `orders` contains the new order
- MySQL `order_items` contains snapshot title, price, quantity, and line total
- current user's MySQL cart items are cleared after checkout
- `GET /api/orders` includes the current user's created order
- `GET /api/orders/:id` returns the current user's created order without private user data
- user B cannot list or fetch user A's order
- user B can create a separate MySQL order
- reorder through the cart API adds user A's order items to user A's cart only
- customer access to admin order APIs returns 403
- admin order list returns all MySQL orders
- admin order detail returns MySQL order detail
- admin status update persists in MySQL
- admin dashboard uses MySQL-backed order data
- product API regression still returns 48 MySQL products
- cart API remains MySQL-backed and user-scoped

Admin authorization was verified with a temporary MySQL admin created through the auth API, matching the prior phase validation pattern.

## Browser Smoke Results

Passed through `http://localhost:3000`:

- `index.html` loads
- `products.html` loads MySQL products
- `product-detail.html?productId=1` loads MySQL product data
- signed-out Add to Cart redirects to `login.html?returnTo=...`
- `login.html` works with the seeded customer
- signed-in Add to Cart updates MySQL cart count
- `cart.html` renders MySQL cart items
- `checkout.html` renders current MySQL cart items
- Place Order creates a MySQL order and navigates to `order-success.html?orderId=<id>`
- `order-success.html` renders the created MySQL order
- Continue Shopping works
- View My Orders opens `orders.html`
- `orders.html` renders only the current user's MySQL orders
- My Orders View Details opens the detail panel with MySQL order data
- Reorder adds items back into the current user's MySQL cart
- logout clears header state
- customer cannot access admin pages
- admin login works with a temporary MySQL admin
- `admin-dashboard.html` loads MySQL-backed order summaries
- `admin-products.html` still works with MySQL products
- `admin-orders.html` loads MySQL orders
- admin order detail panel reads MySQL order data
- admin order status update persists after refresh
- no unexpected browser console or page errors were observed

## MySQL Data Validation Results

Direct MySQL checks confirmed:

- after checkout, `orders` has a row for the current user
- after checkout, `order_items` has matching rows for that order
- `order_items` stores snapshot title, unit price, quantity, and line total
- after checkout, current user's `cart_items` rows are cleared
- another user's `cart_items` rows are not cleared
- `orders.user_id` matches the current session user
- user B cannot read user A order through customer APIs
- admin can read both user A and user B orders
- status update changes `orders.status`

After cleanup and `npm run db:reset`, the database baseline was:

- `users`: 2
- `products`: 48
- `carts`: 2
- `cart_items`: 0
- `orders`: 5
- `order_items`: 7

## Runtime Boundary

After Phase 7E:

- products use MySQL
- users/auth use MySQL
- carts use MySQL
- orders use MySQL

Runtime business data no longer depends on `server/data/*.json`; those files remain as seed/reset inputs.

## Remaining Phase

- Phase 7F: final MySQL regression audit
