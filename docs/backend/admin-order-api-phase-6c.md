# Admin Order API Phase 6C

## Summary

Admin Order API Phase 6C adds admin-only order management APIs and connects the existing admin order management page to backend order data.

This phase does not redesign frontend pages, does not modify `public/design-preview/`, does not add dashboard statistics APIs, does not add database code, and does not introduce React, Vue, TypeScript, Tailwind, JWT, or a build tool.

## Files Modified

Backend:

- `server/app.js`
- `server/routes/orderRoutes.js`
- `server/controllers/orderController.js`
- `server/services/orderService.js`
- `server/repositories/orderRepository.js`

Frontend:

- `public/admin-orders.html`
- `public/js/pages/adminOrdersPage.js`

Documentation:

- `docs/backend/admin-order-api-phase-6c.md`

## Admin Order API Endpoints

Customer order routes remain user-scoped:

| Method | Endpoint | Access |
|---|---|---|
| `GET` | `/api/orders` | signed-in customer, own orders only |
| `GET` | `/api/orders/:id` | signed-in customer, owned order only |
| `POST` | `/api/orders` | signed-in customer, current user's cart |

Admin order routes were added:

| Method | Endpoint | Access |
|---|---|---|
| `GET` | `/api/admin/orders` | admin only |
| `GET` | `/api/admin/orders/:id` | admin only |
| `PATCH` | `/api/admin/orders/:id/status` | admin only |

All admin order routes use `requireRole("admin")`.

## Authorization Behavior

| Request state | Result |
|---|---|
| Signed out | `401` JSON error for admin order API requests |
| Logged-in customer | `403` JSON error for admin order API requests |
| Logged-in admin | request allowed |

Customer order ownership was preserved. Customer users still cannot read other users' orders through `/api/orders/:id`.

## Admin List Behavior

`GET /api/admin/orders` returns all orders from `server/data/orders.json`, newest first.

Supported query parameters:

- `status`
- `query`
- `date`

Filtering behavior:

- `status` matches `order.status`.
- `query` searches order id, customer name, customer email if present, item titles, and status.
- `date` matches the `createdAt` date prefix in `YYYY-MM-DD` format.

Response shape:

```json
{
  "data": [],
  "meta": {
    "count": 0
  }
}
```

Legacy sample orders without `userId` remain visible to admin routes and remain ignored by customer-owned order routes.

## Admin Detail Behavior

`GET /api/admin/orders/:id` returns any existing order by id for admin users.

Behavior:

- Admin can read customer-owned orders.
- Admin can read legacy sample orders.
- Missing order id returns `404`.
- Ownership checks are not applied to admin detail routes.

## Admin Status Update Behavior

`PATCH /api/admin/orders/:id/status` accepts:

```json
{
  "status": "processing"
}
```

Allowed statuses:

- `processing`
- `shipped`
- `delivered`
- `cancelled`

Behavior:

- Invalid or missing status returns `400`.
- Missing order returns `404`.
- Successful update writes `status` and `updatedAt` to `server/data/orders.json`.
- Response returns the updated order.

## Admin Orders Page Integration

`public/js/pages/adminOrdersPage.js` now loads order rows from:

- `GET /api/admin/orders`

The page preserves the existing admin layout and supports:

- backend-driven order table rendering
- search filtering
- status filtering
- date filtering from backend order dates
- View Details through `GET /api/admin/orders/:id`
- status updates through `PATCH /api/admin/orders/:id/status`
- status badge updates after successful save
- existing admin sidebar navigation
- toast feedback for success and error states

`public/admin-orders.html` now loads `js/core/apiClient.js` before the admin orders page script.

## Data Cleanup

`server/data/users.json`, `server/data/carts.json`, `server/data/orders.json`, and `server/data/products.json` were backed up before smoke checks.

API and browser smoke checks created temporary users and orders and updated an order status. After checks completed, seed data was restored from backup. No random smoke-test users, carts, orders, or status changes are intended to be committed.

## API Smoke Results

All API smoke checks ran through `http://localhost:3000`.

| Check | Result |
|---|---|
| Signed-out `GET /api/admin/orders` | `401` |
| Signed-out `GET /api/admin/orders/some-id` | `401` |
| Signed-out `PATCH /api/admin/orders/some-id/status` | `401` |
| Customer `GET /api/admin/orders` | `403` |
| Customer `GET /api/admin/orders/some-id` | `403` |
| Customer `PATCH /api/admin/orders/some-id/status` | `403` |
| Admin `GET /api/admin/orders` | `count=4` |
| Admin `GET /api/admin/orders?status=processing` | `count=4`, all processing |
| Admin `GET /api/admin/orders?query=<known-order-id>` | known order returned |
| Admin `GET /api/admin/orders/:existingId` | order detail returned |
| Admin `PATCH /api/admin/orders/:existingId/status` with `shipped` | status updated |
| Admin detail after status update | status `shipped` returned |
| Admin invalid status update | `400` |
| Admin missing order detail | `404` |
| User A creates customer order | created `SL-20260526-152600517` |
| User B reads User A order through customer route | `404` |
| Admin reads User A order through admin route | allowed |

## Browser Smoke Results

Browser checks ran through `http://localhost:3000`.

| Check | Result |
|---|---|
| Signed-out `admin-orders.html` | redirected to `login.html?returnTo=admin-orders.html` |
| Admin login | returned to `admin-orders.html` |
| Admin order table | `4` backend rows rendered |
| Admin search filter | filtered to known order id |
| Admin status filter | `processingVisible=4` |
| Admin date filter | `2026-05-25`, `visible=4` |
| Admin View Details | detail panel rendered backend order id |
| Admin status update | row badge updated to `Shipped` |
| Admin sidebar navigation | dashboard loaded |
| Customer admin page access | `403` |
| Customer index page | loaded |
| Customer products page | loaded |
| Customer product detail | `productId=1` loaded |
| Signed-in customer Add to Cart | cart count became `1` |
| Customer checkout | created `SL-20260526-152912696` |
| Customer orders page | created order visible to owner |

Unexpected browser console errors: `0`.

Expected auth-denial network console messages were observed only during negative authorization checks.

## Customer Regression Results

Customer order behavior remains protected:

- `GET /api/orders` remains scoped to the current session user.
- `GET /api/orders/:id` still returns `404` for non-owned orders.
- `POST /api/orders` still creates orders from the current user's cart.
- Checkout still creates user-owned orders.
- `order-success.html` still renders the created customer order.
- `orders.html` still shows only the current customer's orders.
- Reorder behavior remains tied to the current user's cart API.
- Customer users cannot access protected admin pages.

## Known Limitations

- No shipment tracking integration is implemented.
- Payment status is read-only display text in this phase.
- No email notification is sent when status changes.
- JSON files remain the persistence layer.
- Dashboard statistics APIs are still deferred.
- Admin order mutation is limited to status updates.
