# User-Scoped Cart Phase 5C

## Summary

User-Scoped Cart Phase 5C replaced the fixed `demo-cart` cart ownership model with session-based user carts. Cart APIs now require a logged-in user session and read/write cart data by `req.session.userId`.

This phase did not convert order ownership, did not implement admin authorization, did not add database code, did not redesign frontend pages, and did not modify `public/design-preview/`.

## Files Modified

Backend:

- `server/routes/cartRoutes.js`
- `server/controllers/cartController.js`
- `server/services/cartService.js`
- `server/repositories/cartRepository.js`
- `server/data/carts.json`

Frontend:

- `public/js/main.js`
- `public/js/pages/homePage.js`
- `public/js/pages/productsPage.js`
- `public/js/pages/productDetailPage.js`
- `public/js/pages/cartPage.js`
- `public/js/pages/orderSuccessPage.js`
- `public/js/pages/ordersPage.js`

Documentation:

- `docs/backend/user-scoped-cart-phase-5c.md`

## Why `demo-cart` Was Replaced

The fixed `demo-cart` made every user share the same cart state. That was useful during early product/cart/order integration, but it became incorrect after auth and session support were added.

The cart API now uses the logged-in session user as the ownership boundary. This prepares the backend for user-scoped checkout and order history in the next phase.

## Cart Ownership Model

`server/data/carts.json` now starts as an empty array:

```json
[]
```

Carts are created lazily when a logged-in user first reads or writes cart data.

Cart shape:

```json
{
  "id": "cart-user-...",
  "userId": "user-...",
  "items": []
}
```

Rules:

- One active cart per user.
- Cart lookup uses `userId`.
- Cart writes only affect the current session user's cart.
- Product enrichment still comes from the product repository.
- Summary rules remain unchanged.

## Cart API Auth Behavior

All `/api/cart` routes now use `requireAuth`.

| Endpoint | Signed-out behavior | Signed-in behavior |
|---|---|---|
| `GET /api/cart` | `401` | Returns current user's cart, creating an empty cart if needed |
| `POST /api/cart/items` | `401` | Adds or increments an item in current user's cart |
| `PATCH /api/cart/items/:productId` | `401` | Updates quantity in current user's cart |
| `DELETE /api/cart/items/:productId` | `401` | Removes an item from current user's cart |
| `DELETE /api/cart` | `401` | Clears current user's cart |

## Frontend Signed-Out Behavior

Cart write actions now treat `401` as an auth-required state, not as API unavailability.

Behavior:

- Signed-out Add to Cart redirects to `login.html?returnTo=<current-page>`.
- Signed-out `cart.html` shows a cart-specific sign-in message.
- Header cart count becomes `0` when `GET /api/cart` returns `401`.
- Local cart-count fallback remains only for true API/network unavailability.

Affected cart write areas:

- Home page curated product cards.
- Product listing cards.
- Product detail Add to Cart.
- Order success recommended product Add to Cart.
- My Orders reorder action.
- Cart page quantity, remove, and clear actions.

## `returnTo` Behavior

`public/js/main.js` exposes cart-auth helper behavior through `window.ShopLiteCart`.

When a signed-out user attempts a cart write, the browser navigates to:

```text
login.html?returnTo=<internal-relative-url>
```

The existing login page already validates the return target and only allows safe internal redirects.

## Multi-User Smoke Results

All API checks ran through `http://localhost:3000`.

| Check | Result |
|---|---|
| Signed-out `GET /api/cart` | `401` |
| Signed-out `POST /api/cart/items` | `401` |
| Signed-out `PATCH /api/cart/items/1` | `401` |
| Signed-out `DELETE /api/cart/items/1` | `401` |
| Signed-out `DELETE /api/cart` | `401` |
| User A initial cart | `itemCount=0` |
| User A add product 1 | `itemCount=1` |
| User A add product 2 | `itemCount=2` |
| User A patch product 1 to quantity 3 | `itemCount=4` |
| User A remove product 2 | `itemCount=3` |
| User A clear cart | `itemCount=0` |
| User B initial cart after User A adds product 1 | `itemCount=0` |
| User B add product 2 | User B cart contains only product 2 |
| User A login after User B cart write | User A cart still contains only product 1 |

## Browser Smoke Results

All browser checks ran through `http://localhost:3000`.

| Check | Result |
|---|---|
| Signed-out `products.html` Add to Cart | Redirected to `login.html?returnTo=...` |
| Signed-out `cart.html` | Showed sign-in cart message and `cartCount=0` |
| Register/login | Worked and header showed current user email |
| Signed-in `products.html` Add to Cart | Updated user cart count to `1` |
| Signed-in `product-detail.html` Add to Cart | Updated user cart count to `2` |
| `cart.html` user cart render | Rendered logged-in user's cart |
| Quantity update | Updated cart count to `3` |
| Remove item | Updated cart count from `3` to `1` |
| Clear cart | Updated cart count to `0` |
| Logout | Returned header to signed-out state and `cartCount=0` |
| Public product browsing | Still worked while signed out |
| Public product detail | Still worked while signed out |
| Order/admin page load regression | Checkout, order pages, and admin pages loaded |
| Browser console errors | `0` unexpected console errors |

Expected `401` resource messages from signed-out cart checks were treated as expected auth behavior.

## Known Temporary Limitation

Order creation is temporarily blocked after this phase.

Reason:

- The cart API now requires a logged-in user and no longer writes to `demo-cart`.
- The order service still reads cart data without user ownership because user-scoped order creation is deferred to Phase 5D.

Current behavior:

- `POST /api/orders` returns `401` during order creation because there is no user-scoped order/cart handoff yet.
- Order pages still load.
- Product browsing, product detail, login/register, and user cart operations still work.

## Remaining Work

Next backend phases:

- User-scoped order creation.
- `orders.html` user ownership.
- Checkout login requirement and user cart handoff.
- Admin authorization.
- Production-grade session storage and stronger JSON write safety if project scope expands.
