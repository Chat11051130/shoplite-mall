# User-Scoped Order Phase 5D

## Summary

User-Scoped Order Phase 5D converts customer order creation and order history from the earlier global/demo behavior to the current Express session user.

This phase does not redesign frontend pages, does not modify `public/design-preview/`, does not implement admin authorization, does not add database code, and does not introduce React, Vue, TypeScript, Tailwind, JWT, or a build tool.

## Files Modified

Backend:

- `server/routes/orderRoutes.js`
- `server/controllers/orderController.js`
- `server/services/orderService.js`
- `server/repositories/orderRepository.js`

Frontend:

- `public/js/main.js`
- `public/js/pages/checkoutPage.js`
- `public/js/pages/orderSuccessPage.js`
- `public/js/pages/ordersPage.js`

Documentation:

- `docs/backend/user-scoped-order-phase-5d.md`

## Why Order Ownership Changed

The cart API now stores cart data per logged-in user. Order creation also needed to use the same ownership boundary so checkout reads the current user's cart, creates an order with `userId`, clears only that user's cart, and prevents other users from reading the order.

Legacy orders in `server/data/orders.json` that do not include `userId` are left as sample data and ignored by customer order routes. They are not assigned to a real user silently.

## Order Ownership Model

New orders include:

```json
{
  "id": "SL-...",
  "userId": "user-...",
  "createdAt": "...",
  "status": "processing",
  "customerName": "...",
  "phone": "...",
  "shippingAddress": "...",
  "city": "...",
  "state": "...",
  "zip": "...",
  "deliveryOption": "standard",
  "paymentMethod": "mock-card",
  "items": [],
  "summary": {}
}
```

Rules:

- All `/api/orders` routes require a logged-in session.
- `GET /api/orders` returns only orders where `order.userId === req.session.userId`.
- `GET /api/orders/:id` returns `404` for missing or non-owned orders.
- `POST /api/orders` creates an order from only the current user's cart.
- Successful order creation clears only the current user's cart.

## Checkout Integration Behavior

`checkoutPage.js` keeps the existing local form validation. After validation passes:

- `401` from `POST /api/orders` redirects to `login.html?returnTo=checkout.html`.
- Empty-cart or validation errors show checkout feedback and keep the user on `checkout.html`.
- Successful order creation navigates to `order-success.html?orderId=<createdOrder.id>`.

No real payment processing was added.

## Order Success Integration Behavior

`orderSuccessPage.js` reads `orderId` from the URL and calls `GET /api/orders/:id`.

Behavior:

- Signed-out users redirect to login with the current URL as `returnTo`.
- Missing or non-owned orders show the existing clean order-not-found state.
- Owned orders render the order ID, total, status, items, delivery estimate, and payment status.
- Header cart count is synced after the created order is loaded.

## My Orders Integration Behavior

`ordersPage.js` calls `GET /api/orders` and renders only the current user's backend orders.

Behavior:

- Signed-out users see a signed-out orders message with a login link.
- Status tab filtering still works on rendered user orders.
- Search filtering still works on rendered user orders.
- View Details opens the existing order detail offcanvas with backend order data.
- Logout triggers a local page cleanup event so visible user-owned orders are hidden immediately.

## Reorder Behavior

Reorder reads the selected backend order from the current page cache and posts each item back to `/api/cart/items`.

Behavior:

- Signed-in reorder adds items to the current user's cart.
- Cart count updates from the Cart API response.
- Signed-out reorder redirects to login if a stale interaction returns `401`.

## Signed-Out Behavior

Signed-out order behavior is now explicit:

- `GET /api/orders` returns `401`.
- `POST /api/orders` returns `401`.
- `GET /api/orders/:id` returns `401`.
- `checkout.html` Place Order redirects to login.
- `orders.html` shows a sign-in message.
- `order-success.html?orderId=...` redirects to login.

## API Smoke Results

All API checks ran through `http://localhost:3000`.

| Check | Result |
|---|---|
| Signed-out `GET /api/orders` | `401` |
| Signed-out `POST /api/orders` | `401` |
| Signed-out `GET /api/orders/some-id` | `401` |
| User A initial cart | `itemCount=0` |
| User A create order after adding products 1 and 2 | `201`, created `SL-20260525-233058892` with User A `userId` |
| User A cart after order | `itemCount=0` |
| User A orders list | Included created order |
| User A order detail | Returned created order |
| User B orders list | Did not include User A order |
| User B read User A order detail | `404` |
| User B create separate order after adding product 7 | Created separate User B order only |

Test-created users, carts, and orders were restored after smoke checks.

## Browser Smoke Results

All browser checks ran through `http://localhost:3000`.

| Check | Result |
|---|---|
| Signed-out `checkout.html` Place Order | Redirected to `login.html?returnTo=checkout.html` |
| Signed-out `orders.html` | Signed-out message shown with login link |
| Signed-out `order-success.html?orderId=...` | Redirected to login with `returnTo` |
| User A register/login | Session created |
| User A Add to Cart | Cart count became `1` |
| User A `cart.html` | Rendered one current-user cart item |
| User A checkout Place Order | Created `SL-20260525-233449725` and cart count became `0` |
| User A `orders.html` | Created order visible |
| User A View Details | Detail panel showed created order ID |
| User A Reorder | Cart count became `1` |
| User A logout | Orders hidden and cart count became `0` |
| User B `orders.html` | Did not show User A order |
| Regression page loads | Product detail and admin dashboard loaded |
| Unexpected browser console errors | `0` |

Expected browser resource messages were limited to auth-related `401` responses and the existing favicon request.

## Known Limitations

- Legacy sample orders without `userId` remain in `orders.json` but are ignored by customer routes.
- Admin order management is still static/prototype-oriented and does not use admin authorization yet.
- JSON file storage can have concurrency limitations.
- Express session storage is still local development storage.
- There is no production payment processing.

## Remaining Work

Recommended next backend phases:

- Admin authorization.
- Admin order management API.
- Admin product write APIs if required by the course scope.
- Production-grade session storage.
- JSON write safety improvements or database migration if project scope expands.
