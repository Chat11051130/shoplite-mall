# Frontend Auth Integration Phase 5B

## Summary

Frontend Auth Integration Phase 5B connected the existing ShopLite login and register prototype pages to the backend auth API. It also added lightweight customer header session synchronization through `GET /api/auth/me`.

This phase did not redesign pages, did not modify `public/design-preview/`, did not convert cart ownership, did not convert order ownership, and did not add admin authorization.

## Files Modified

- `public/login.html`
- `public/register.html`
- `public/js/core/apiClient.js`
- `public/js/main.js`
- `public/js/pages/loginPage.js`
- `public/js/pages/registerPage.js`

## Login Integration Behavior

`public/js/pages/loginPage.js` now:

- Reads the existing login email field from `data-field="login-username"`.
- Reads the existing password field from `data-field="login-password"`.
- Performs local empty-field validation before API calls.
- Calls `POST /api/auth/login` through `window.ShopLiteApi.postJson`.
- Shows backend error messages for failed login attempts.
- Clears the password field after backend submit attempts.
- Does not store passwords in `localStorage` or `sessionStorage`.
- Redirects to `index.html` by default after successful login, or a safe `returnTo` query target if provided.

## Register Integration Behavior

`public/js/pages/registerPage.js` now:

- Reads the existing email field from `data-field="register-username"`.
- Reads password and confirmation fields.
- Reads the existing role hint field.
- Performs local empty-field validation.
- Performs local password confirmation validation.
- Calls `POST /api/auth/register` through `window.ShopLiteApi.postJson`.
- Shows backend messages such as duplicate email errors.
- Clears password fields after backend submit attempts.
- Does not store passwords in frontend storage.
- Redirects to `index.html` after successful registration, using the backend-created session.

The existing `admin-request` role hint is submitted as `customer` for now because admin authorization is deferred.

## Session Header Sync Behavior

`public/js/main.js` now:

- Calls `GET /api/auth/me` on page load when a customer account header link exists.
- Keeps the signed-out header as `Hello, sign in` when no session exists.
- Updates the customer account header to `Hello, <email>` when a valid session exists.
- Changes the account link target to `orders.html` for signed-in customers.
- Adds a minimal logout action in the existing customer header action area when signed in.
- Leaves admin pages and auth-page simplified headers unchanged.

`public/js/core/apiClient.js` now uses `credentials: "same-origin"` so Express session cookies work with same-origin API requests.

## Logout Behavior

When the generated logout action is clicked:

- `POST /api/auth/logout` is called.
- The header returns to signed-out state.
- The logout action is removed from the header.
- Cart and order ownership remain unchanged in this phase.

## Validation Results

Static checks:

- `node --check` passed for modified public JavaScript files.
- `git diff --check` passed.
- Chinese character scan passed for changed code and documentation.
- Scan confirmed no React, Vue, TypeScript, Tailwind, database, or JWT code was introduced.
- `public/design-preview/` remained untouched.
- `server/data/users.json`, `server/data/carts.json`, and `server/data/orders.json` were restored after smoke tests.

## Browser Smoke Results

All browser checks ran through `http://localhost:3000`.

| Check | Result |
|---|---|
| Register empty submit | Passed, local validation appeared |
| Register mismatched passwords | Passed, local validation appeared |
| Register valid account | Passed, `POST /api/auth/register` succeeded and session was active |
| Header after register | Passed, header showed logged-in email |
| Duplicate register | Passed, backend error appeared |
| Logout action | Passed, `GET /api/auth/me` returned `401` after logout |
| Login empty submit | Passed, local validation appeared |
| Login wrong password | Passed, backend error appeared and password field cleared |
| Login valid credentials | Passed, `POST /api/auth/login` succeeded and header showed logged-in email |
| Password frontend storage | Passed, password was not found in `localStorage` or `sessionStorage` |
| `products.html` regression | Passed, products API rendered 8 electronics cards |
| `product-detail.html` regression | Passed, product API rendered `productId=7` |
| `cart.html` regression | Passed, cart API rendered an item and count synced |
| `checkout.html` regression | Passed, order API created an order |
| `order-success.html` regression | Passed, created order was displayed |
| `orders.html` regression | Passed, orders API rendered orders |
| Browser console errors | Passed, `0` unexpected console errors |

Expected `401` and `409` browser resource messages from signed-out `me` and duplicate registration checks were treated as expected validation results, not application failures.

## Remaining Work

Deferred to later phases:

- User-scoped cart ownership.
- User-scoped order ownership.
- Frontend checkout login requirement.
- Header account menu refinement if needed.
- Admin authorization and admin session behavior.
- Production-grade session storage and stronger security hardening.
