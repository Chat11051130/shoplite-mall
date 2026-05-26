# Admin Authorization Phase 6A

## Summary

Admin Authorization Phase 6A protects the official admin HTML entry pages with Express session role checks. Only authenticated users with role `admin` can load admin page HTML.

This phase does not redesign frontend pages, does not modify `public/design-preview/`, does not add admin product write APIs, admin order write APIs, dashboard statistics APIs, database code, JWT, React, Vue, TypeScript, Tailwind, or a build tool.

## Files Modified

Backend:

- `server/app.js`
- `server/middleware/requireRole.js`

Frontend:

- `public/js/main.js`
- `public/js/pages/loginPage.js`

Documentation:

- `docs/backend/admin-authorization-phase-6a.md`

## Admin Pages Protected

The following HTML entry points now require an authenticated admin session:

- `/admin-products.html`
- `/admin-product-form.html`
- `/admin-orders.html`
- `/admin-dashboard.html`

Shared frontend assets such as CSS, JavaScript, icons, and images remain publicly served so protected pages can render correctly after authorization.

## Middleware Design

`server/middleware/requireRole.js` exports a role guard:

```js
requireRole("admin")
```

Behavior:

- Missing session returns `401` JSON for API-style requests.
- Missing session redirects HTML page requests to `login.html?returnTo=<current-page>`.
- Authenticated users without the required role receive `403`.
- Admin users continue to the protected route.

The middleware loads the current user from `users.json` through `userRepository.findUserById`.

## Express Static Route Order

Admin page routes are registered before `express.static(publicPath)` in `server/app.js`.

This matters because static middleware would otherwise serve files from `public/` directly and bypass admin authorization. The protected routes call `sendFile` only after `requireRole("admin")` succeeds.

## Signed-Out Behavior

Signed-out admin page requests redirect to login with a safe internal `returnTo` value:

| Page | Result |
|---|---|
| `/admin-products.html` | `302` to `/login.html?returnTo=admin-products.html` |
| `/admin-product-form.html` | `302` to `/login.html?returnTo=admin-product-form.html` |
| `/admin-orders.html` | `302` to `/login.html?returnTo=admin-orders.html` |
| `/admin-dashboard.html` | `302` to `/login.html?returnTo=admin-dashboard.html` |

## Customer Forbidden Behavior

Logged-in customer users cannot access admin HTML pages.

Observed behavior:

- `GET /api/auth/me` returns role `customer`.
- `GET /admin-products.html` returns `403`.
- Browser access to `admin-dashboard.html` after customer login shows a clean `Admin access required` page.

Customer storefront behavior remains available.

## Admin Allowed Behavior

Admin users are created only through controlled API smoke setup in this phase. The public registration UI still normalizes admin account requests to customer accounts.

Observed behavior:

- `GET /api/auth/me` returns role `admin`.
- Admin users can load all protected admin pages.
- Admin sidebar links continue to point between admin pages.

## ReturnTo Behavior

`loginPage.js` now rejects external, protocol-based, and protocol-relative return targets. Valid internal relative targets continue to work.

Observed behavior:

- Signed-out `GET /admin-dashboard.html` redirects to `/login.html?returnTo=admin-dashboard.html`.
- Admin login returns to `admin-dashboard.html`.
- Customer login with the same return target receives the admin `403` page and does not see admin content.

## API And Session Smoke Results

All API/session checks ran through `http://localhost:3000`.

| Check | Result |
|---|---|
| Signed-out `/admin-products.html` | `302` to `/login.html?returnTo=admin-products.html` |
| Signed-out `/admin-product-form.html` | `302` to `/login.html?returnTo=admin-product-form.html` |
| Signed-out `/admin-orders.html` | `302` to `/login.html?returnTo=admin-orders.html` |
| Signed-out `/admin-dashboard.html` | `302` to `/login.html?returnTo=admin-dashboard.html` |
| Customer `/api/auth/me` | role `customer` |
| Customer `/admin-products.html` | `403` |
| Customer storefront/cart/order regression | products `8`, cart item count `1`, order creation `201`, orders list `1` |
| Admin `/api/auth/me` | role `admin` |
| Admin `/admin-products.html` | `200` |
| Admin `/admin-product-form.html` | `200` |
| Admin `/admin-orders.html` | `200` |
| Admin `/admin-dashboard.html` | `200` |
| Signed-out dashboard returnTo | `302` to `/login.html?returnTo=admin-dashboard.html` |

## Browser Smoke Results

All browser checks ran through `http://localhost:3000`.

| Check | Result |
|---|---|
| Signed-out admin dashboard | Redirected to login returnTo |
| Admin login with returnTo | Returned to `admin-dashboard.html` |
| Admin page access | All protected admin pages loaded |
| Admin sidebar navigation | Included `admin-dashboard.html`, `admin-products.html`, and `admin-orders.html` |
| Customer admin access | Customer received `403` admin access page |
| Public storefront pages | `index.html`, `products.html`, and `product-detail.html?productId=1` loaded |
| Customer cart/order regression | Created and listed order `SL-20260526-144924740` |
| Logout regression | Logout completed |
| Unexpected browser console errors | `0` |

Expected browser resource messages were limited to auth-related responses and the existing favicon request.

## Data Cleanup

Smoke tests created temporary customer and admin users and customer cart/order records. `server/data/users.json`, `server/data/carts.json`, and `server/data/orders.json` were restored from a pre-test backup after validation.

No plain-text passwords were committed. Auth responses continue to exclude `passwordHash`.

## Remaining Work

Recommended next backend phases:

- Admin product API.
- Admin order API.
- Admin dashboard statistics API.
- Stronger production session storage.
- Database migration if the course project scope expands beyond JSON file storage.
