# Final MySQL Regression Audit Phase 7F

## Goal

Phase 7F verifies the completed MySQL migration for ShopLite Mall after Phases 7A through 7E. The audit confirms that products, users/auth, carts, and orders now use MySQL at runtime, while `server/data/*.json` remains available only as seed/reset input.

## Audit Date

May 28, 2026

## Runtime Boundary

- Products: MySQL-backed through `products`.
- Users/auth: MySQL-backed through `users`.
- Carts: MySQL-backed through `carts` and `cart_items`.
- Orders: MySQL-backed through `orders` and `order_items`.
- JSON seed files: retained for database seed/reset scripts only.
- Frontend: plain browser JavaScript only; no database logic added to frontend code.

## Environment Used

- Windows PowerShell
- Express app at `http://localhost:3000`
- MySQL database: `shoplite_mall`
- MySQL access configured through local ignored `.env`
- Browser regression checks executed with Playwright against `http://localhost:3000`

## Commands Run

```powershell
git status --short
git diff --stat
git check-ignore -v .env
npm run db:init
npm run db:seed
npm run db:reset
npm start
node --check <all server JavaScript files>
node --check <all public JavaScript files>
git diff --check
```

Additional static scans were run for runtime JSON access, Chinese/CJK characters, disallowed frontend/backend technology strings, public auth password-hash exposure, hardcoded database credentials, and frontend MySQL/database imports.

## Database Reset Results

`npm run db:init`, `npm run db:seed`, and `npm run db:reset` all passed.

Final baseline after reset:

| Table | Count |
| --- | ---: |
| `users` | 2 |
| `products` | 48 |
| `carts` | 2 |
| `cart_items` | 0 |
| `orders` | 5 |
| `order_items` | 7 |

Confirmed tables:

- `users`
- `products`
- `carts`
- `cart_items`
- `orders`
- `order_items`

Confirmed schema checks:

- `users.password_hash` exists.
- No plain-text `password` column exists.
- `order_items` includes snapshot fields such as `title`, `unit_price`, `quantity`, and `line_total`.

## Static Code Scan Results

Passed:

- All server JavaScript syntax checks.
- All public JavaScript syntax checks.
- `git diff --check`.
- Runtime repository scan found no `readJsonFile`, `writeJsonFile`, `dataPath`, or direct `server/data/*.json` access in runtime repository/service/controller/route/middleware code.
- `productRepository`, `userRepository`, `cartRepository`, and `orderRepository` do not read or write JSON seed files at runtime.
- No Chinese/CJK characters found in changed code/comments.
- No React, Vue, TypeScript, Tailwind, JWT, Prisma, Sequelize, TypeORM, Drizzle, Knex, or build tool was introduced.
- No frontend code imports or calls MySQL/database modules.
- Auth API safe-user responses do not return `password`, `passwordHash`, or `password_hash`.
- No database credentials were hardcoded into source files.
- `.env` exists locally and is ignored by Git.

## Product API Results

Passed through `http://localhost:3000`:

- `GET /api/products` returned 48 MySQL products.
- Category filters returned 8 products each for electronics, fashion, home, beauty, grocery, and sports.
- Query, sort, rating, and tag filters worked.
- `GET /api/products/1` worked.
- `GET /api/products/7` worked.
- `GET /api/products/999999` returned the expected not-found response.
- Admin product create/edit/delete persisted in MySQL.
- Deleting a product referenced by orders returned the safe protected-delete behavior.

## Auth API Results

Passed:

- Seeded customer login worked.
- Temporary admin login worked after registering an admin through the backend API for audit use.
- Invalid login returned 401.
- Duplicate register returned 409.
- Register created a MySQL user.
- `GET /api/auth/me` returned a safe user object.
- `GET /api/auth/me` did not expose password hash fields.
- Logout cleared the session.
- Signed-out protected access returned the expected signed-out behavior.
- Customer admin access returned 403.
- Admin access succeeded.

Temporary users were removed by the final `npm run db:reset`.

## Cart API Results

Passed:

- Signed-out `GET /api/cart` returned 401.
- Signed-out `POST /api/cart/items` returned 401.
- Signed-in customer `GET /api/cart` worked.
- `POST /api/cart/items` inserted MySQL `cart_items`.
- Adding the same product incremented quantity.
- `PATCH /api/cart/items/:productId` updated quantity.
- `DELETE /api/cart/items/:productId` removed only that item.
- `DELETE /api/cart` cleared only the current user's cart.
- Cart count matched MySQL quantity totals.
- User A and user B carts remained isolated.
- `server/data/carts.json` was unchanged.

## Order API Results

Passed:

- Signed-out `GET /api/orders` returned 401.
- Signed-out `POST /api/orders` returned 401.
- Signed-in checkout created a MySQL order.
- Created orders inserted MySQL `order_items` snapshot rows.
- Checkout cleared only the current user's MySQL cart.
- `GET /api/orders` returned only the current user's orders.
- `GET /api/orders/:id` returned only owned orders.
- User B could not fetch user A's order.
- Reorder added owned order items back through the current user's MySQL cart API.
- Admin could list all orders.
- Admin could view any order detail.
- Admin could update order status.
- Status updates persisted in MySQL.
- `server/data/orders.json` was unchanged.

## Customer Browser Flow Results

Passed through `http://localhost:3000`:

- Signed-out home page loaded.
- Signed-out header state rendered correctly.
- Signed-out Add to Cart redirected to `login.html?returnTo=...`.
- `register.html` created a customer session.
- `login.html` worked.
- Logout updated header state and cart count.
- `products.html` loaded MySQL products.
- Category navigation worked.
- Search worked.
- Sort worked.
- Load More worked.
- `product-detail.html?productId=1` loaded MySQL product data.
- Related products rendered.
- Add to Cart updated the MySQL-backed cart count.
- `cart.html` rendered MySQL cart items.
- Quantity controls updated persisted cart quantities.
- Remove item updated totals.
- Clear cart showed the empty state and count zero.
- `checkout.html` rendered the current MySQL cart.
- Place Order created a MySQL order.
- `order-success.html` rendered the created order.
- View My Orders opened `orders.html`.
- `orders.html` rendered only the current user's MySQL orders.
- View Details opened the order detail panel.
- Reorder added items back to the current user's MySQL cart.
- No unexpected browser console/page errors were found in passing runs.

## Admin Browser Flow Results

Passed through `http://localhost:3000`:

- Signed-out `admin-dashboard.html` redirected to login with `returnTo`.
- Customer access to admin pages was blocked.
- Admin login worked.
- `admin-dashboard.html` loaded MySQL-backed summary values.
- Dashboard category sales rendered.
- Dashboard category sales summary images had valid non-broken image sources.
- Dashboard order status chart rendered.
- Dashboard recent orders rendered.
- Dashboard refresh re-fetched backend data.
- `admin-products.html` loaded MySQL products.
- Admin product search worked.
- Admin product create persisted in MySQL.
- Admin product edit persisted in MySQL.
- Admin product delete worked for an unreferenced temporary product.
- Protected product delete returned safe 409 for a referenced product.
- `admin-orders.html` loaded MySQL orders.
- Admin order detail panel rendered MySQL order data.
- Admin order status update persisted after refresh.
- Store Preview link opened the storefront.
- No unexpected browser console/page errors were found in passing runs.

## Persistence Validation

Passed:

- Temporary product create/edit/delete persisted through MySQL and page/API refresh.
- Temporary user register/login persisted through MySQL.
- Cart item add/update/remove/clear persisted through MySQL.
- Checkout created MySQL `orders` and `order_items` rows.
- Order item snapshots stored title, unit price, quantity, and line total.
- Admin order status updates persisted in MySQL.
- Final `npm run db:reset` restored the expected baseline.

## Runtime JSON Dependency Result

Passed.

Runtime business repositories no longer use `server/data/*.json`. JSON files remain as seed/reset inputs for database scripts and were not modified during this audit.

## Files Modified During Audit

- `docs/backend/final-mysql-regression-audit-phase-7f.md`

No application source files were modified.

## Bugs Found And Fixed

No ShopLite source bugs were found, and no source fixes were required.

The Playwright audit scripts needed narrower test selectors for nested product IDs and shared form/button action hooks, and the Reorder click needed the order detail offcanvas closed first. These were audit-script adjustments only and did not require application code changes.

## Final Readiness Statement

Phase 7F passed. ShopLite Mall is ready for manual review as a completed MySQL-backed course project. Products, users/auth, carts, and orders are all MySQL-backed at runtime, database reset restores the expected baseline, customer and admin browser flows pass, and seed JSON files remain unchanged.
