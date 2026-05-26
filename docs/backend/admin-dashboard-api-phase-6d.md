# Admin Dashboard API Phase 6D

## Summary

Admin Dashboard API Phase 6D adds admin-only dashboard statistics APIs and connects the existing admin dashboard page to backend product and order data.

This phase does not redesign frontend pages, does not modify `public/design-preview/`, does not add product or order write behavior, does not add database code, and does not introduce React, Vue, TypeScript, Tailwind, JWT, or a build tool.

## Files Modified

Backend:

- `server/app.js`
- `server/routes/adminDashboardRoutes.js`
- `server/controllers/adminDashboardController.js`
- `server/services/adminDashboardService.js`

Frontend:

- `public/admin-dashboard.html`
- `public/js/pages/adminDashboardPage.js`

Documentation:

- `docs/backend/admin-dashboard-api-phase-6d.md`

## Dashboard API Endpoints

Admin dashboard routes were added under:

- `GET /api/admin/dashboard/summary`
- `GET /api/admin/dashboard/category-sales`
- `GET /api/admin/dashboard/order-status`
- `GET /api/admin/dashboard/recent-orders`

All routes use `requireRole("admin")`.

## Authorization Behavior

| Request state | Result |
|---|---|
| Signed out | `401` JSON error |
| Logged-in customer | `403` JSON error |
| Logged-in admin | request allowed |

The admin dashboard HTML page remains protected by the existing admin page guard.

## Summary Calculation Rules

`GET /api/admin/dashboard/summary` returns:

- `totalProducts`: count of all products.
- `totalOrders`: count of all orders visible to admin, including legacy sample orders.
- `totalRevenue`: sum of `order.summary.total` for non-cancelled orders.
- `processingOrders`: count of processing orders.
- `shippedOrders`: count of shipped orders.
- `deliveredOrders`: count of delivered orders.
- `cancelledOrders`: count of cancelled orders.
- `lowStockProducts`: count of products where stock is `<= 5`.
- `averageOrderValue`: total revenue divided by non-cancelled order count.
- `registeredUsers`: current user count for the existing dashboard user card.

Currency values are rounded to two decimals.

## Category Sales Calculation Rules

`GET /api/admin/dashboard/category-sales` returns six category rows:

- `electronics`
- `fashion`
- `home`
- `beauty`
- `grocery`
- `sports`

Rules:

- All categories are returned even when values are zero.
- Cancelled orders are ignored.
- `itemsSold` sums order item quantities.
- `revenue` sums `item.price * item.quantity`.
- Missing item categories are resolved from product id when possible.
- Revenue is rounded to two decimals.

## Order Status Calculation Rules

`GET /api/admin/dashboard/order-status` returns:

- `processing`
- `shipped`
- `delivered`
- `cancelled`

Unknown or missing statuses are normalized to `processing`.

## Recent Orders Behavior

`GET /api/admin/dashboard/recent-orders` returns newest orders first.

Rules:

- Default limit is `5`.
- Optional `limit` query parameter is supported.
- Maximum limit is `10`.
- Legacy sample orders are included because admin order routes include them.
- Returned order rows include id, customer name, status, total, created date, and item count.

## Admin Dashboard Integration

`public/js/pages/adminDashboardPage.js` now loads:

- summary cards from `/api/admin/dashboard/summary`
- category chart and category table from `/api/admin/dashboard/category-sales`
- order status chart and status summary badges from `/api/admin/dashboard/order-status`
- recent orders list from `/api/admin/dashboard/recent-orders`

The existing dashboard layout and sidebar were preserved. Chart.js was already present on the page and is reused.

The Refresh button now re-fetches backend dashboard data and shows backend refresh feedback. The Export Mock Report button remains a mock/prototype action.

## API Smoke Results

All API smoke checks ran through `http://localhost:3000`.

| Check | Result |
|---|---|
| Signed-out `GET /api/admin/dashboard/summary` | `401` |
| Signed-out `GET /api/admin/dashboard/category-sales` | `401` |
| Signed-out `GET /api/admin/dashboard/order-status` | `401` |
| Signed-out `GET /api/admin/dashboard/recent-orders` | `401` |
| Customer `GET /api/admin/dashboard/summary` | `403` |
| Customer `GET /api/admin/dashboard/category-sales` | `403` |
| Customer `GET /api/admin/dashboard/order-status` | `403` |
| Customer `GET /api/admin/dashboard/recent-orders` | `403` |
| Admin summary | `products=48`, `orders=4`, `revenue=1079.86` |
| Admin category sales | `6` categories |
| Admin order status | `4` statuses |
| Admin recent orders | `count=4` |
| Admin recent orders `limit=20` | capped to `4` in current seed data, below max `10` |

## Browser Smoke Results

Browser checks ran through `http://localhost:3000`.

| Check | Result |
|---|---|
| Signed-out `admin-dashboard.html` | redirected to `login.html?returnTo=admin-dashboard.html` |
| Admin dashboard summary | orders `4`, products `48` |
| Admin dashboard status summary | `4` status badges rendered |
| Admin dashboard category table | `6` category rows rendered |
| Admin dashboard recent orders | `4` backend orders rendered |
| Admin dashboard charts | both canvases marked `chartReady=true` |
| Refresh action | backend refresh toast shown |
| Export action | mock export feedback shown |
| Admin products regression | backend products loaded |
| Admin orders regression | backend orders loaded |
| Customer admin dashboard access | `403` |
| Customer dashboard API access | `403` |
| Customer storefront pages | index, products, and product detail loaded |
| Signed-in customer Add to Cart | cart count became `1` |
| Customer checkout | created `SL-20260526-154212954` |
| Customer orders page | created order visible to owner |

Unexpected browser console errors: `0`.

Expected auth-denial network console messages were observed only during negative authorization checks.

## Data Cleanup

`server/data/users.json`, `server/data/carts.json`, `server/data/orders.json`, and `server/data/products.json` were backed up before smoke checks.

Smoke tests created temporary users and a temporary customer order for regression coverage. After checks completed, seed data was restored from backup.

## Customer And Admin Regression Results

- `admin-products.html` still loads backend products.
- `admin-orders.html` still loads backend orders.
- Admin HTML protection still works.
- Customer users cannot access admin pages.
- Customer users cannot access dashboard API routes.
- Customer product browsing remains public.
- Customer Add to Cart still uses the user-scoped cart API.
- Checkout still creates user-owned orders.
- `orders.html` still shows only the current customer's orders.

## Known Limitations

- No real analytics warehouse is implemented.
- Chart.js is reused because it already exists on the dashboard page; no new chart dependency was added.
- JSON files remain the persistence layer.
- No production session store is configured.
- Export report remains a mock/prototype action.
