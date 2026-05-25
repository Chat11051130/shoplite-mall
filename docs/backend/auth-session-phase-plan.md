# Auth and Session Phase Plan

## 1. Current State Summary

The backend integration audit confirmed that the current ShopLite Express backend works through `http://localhost:3000`.

Current backend state:

- Product API is implemented with JSON-backed product data and supports listing, detail lookup, filtering, sorting, rating, max price, and tag query parameters.
- Cart API is implemented with JSON file storage, but all cart operations use the fixed `demo-cart`.
- Order API is implemented with JSON file storage. Checkout can create an order from the current `demo-cart`, and successful order creation clears that cart.
- `server/data/users.json` exists as a placeholder for future user data.
- `login.html` and `register.html` are frontend prototype pages only. They validate UI fields but do not create authenticated backend sessions.

Current limitations:

- Cart ownership is not tied to a user.
- Orders are not tied to a user.
- There is no real session.
- There is no authenticated `me` endpoint.
- There is no authorization boundary between one customer and another.

## 2. Target State

After the Auth and Session Phase, the project should support customer identity while preserving the approved storefront layout.

Target backend behavior:

- Register creates a customer user in `users.json`.
- Login creates a browser session.
- Logout clears the browser session.
- `GET /api/auth/me` returns the current logged-in user.
- Cart APIs use the current user ID instead of the fixed `demo-cart`.
- Order APIs associate created orders with the current user ID.
- `orders.html` shows only the current user's orders after frontend integration.
- Admin pages remain unchanged unless a minimal compatibility adjustment is absolutely required.

Target frontend behavior for later integration:

- Existing login/register page layouts stay visually unchanged.
- The header can show the current user email after session integration.
- Cart, checkout, and orders pages use the session cookie automatically through same-origin API requests.

## 3. Authentication Strategy

Use a simple course-project-safe authentication strategy. Do not implement OAuth, real payment security, password reset, or production-grade account recovery in this phase.

Passwords must never be stored as plain text. If a dependency is allowed in the implementation phase, use `bcrypt` or `bcryptjs` for password hashing.

### Option A: `express-session` + bcrypt

How it works:

- Add `express-session` middleware.
- Store a user ID in the server-side session after successful login.
- Browser receives a session cookie.
- Backend reads `req.session.userId` for cart and order ownership.
- Hash passwords with bcrypt before writing to `users.json`.

Pros:

- Clear Express pattern for course projects.
- Easy to reason about on the server.
- No need to manually sign and verify custom tokens.
- Frontend can use same-origin requests without manually managing auth headers.

Cons:

- Adds a session dependency.
- Default memory session storage is not production safe.
- Needs a stable session secret.

### Option B: simple signed cookie + bcrypt

How it works:

- Use an Express cookie parser and a signed cookie containing the user ID.
- Validate the signed cookie on each request.
- Hash passwords with bcrypt before writing to `users.json`.

Pros:

- Fewer moving parts than full session storage.
- Easy to inspect in a small learning project.

Cons:

- More custom security logic.
- Harder to revoke sessions cleanly.
- Easy to make mistakes around cookie signing, expiry, and tampering.

### Recommendation

Use Option A: `express-session` + bcrypt.

Reason:

- It is the most straightforward Express course-project path.
- It keeps frontend integration simple because browser cookies are sent automatically.
- It creates a clear server-side ownership boundary for cart and order APIs.
- It avoids custom token handling until there is a stronger reason to introduce it.

## 4. Data Model Changes

### `users.json`

Proposed shape:

```json
[
  {
    "id": "user-20260525-001",
    "email": "student@example.com",
    "passwordHash": "...",
    "role": "customer",
    "createdAt": "2026-05-25T00:00:00.000Z"
  }
]
```

Rules:

- `email` must be unique.
- `passwordHash` stores the bcrypt hash, never the raw password.
- `role` defaults to `customer`.
- Admin users can be planned later; do not expand admin authorization in this phase unless required.

### `carts.json`

Change from fixed `demo-cart` to user-scoped carts.

Proposed shape:

```json
[
  {
    "id": "cart-user-20260525-001",
    "userId": "user-20260525-001",
    "items": []
  }
]
```

Rules:

- One active cart per customer user.
- Cart lookup should use `userId`.
- Cart creation should happen lazily when a logged-in user first accesses cart APIs.

### `orders.json`

Add `userId` to each order.

Proposed shape:

```json
[
  {
    "id": "SL-20260525-001",
    "userId": "user-20260525-001",
    "status": "processing",
    "items": [],
    "summary": {},
    "createdAt": "2026-05-25T00:00:00.000Z"
  }
]
```

Rules:

- Order creation copies the current user's cart items.
- `GET /api/orders` returns only orders for the current user.
- `GET /api/orders/:id` returns the order only if it belongs to the current user.

## 5. Backend File Plan

Files to create:

- `server/routes/authRoutes.js`
- `server/controllers/authController.js`
- `server/services/authService.js`
- `server/repositories/userRepository.js`
- `server/middleware/requireAuth.js`
- `server/utils/passwordHash.js`

Files to modify:

- `server/app.js`
- `server/data/users.json`
- `server/data/carts.json`
- `server/data/orders.json`
- `server/services/cartService.js`
- `server/repositories/cartRepository.js`
- `server/services/orderService.js`
- `server/repositories/orderRepository.js`

Expected implementation boundaries:

- Keep product API unchanged.
- Keep frontend layout unchanged.
- Keep JSON file storage for this phase.
- Do not add admin authorization in this phase unless a small shared middleware compatibility change is required.

## 6. API Endpoint Plan

### `POST /api/auth/register`

Request:

```json
{
  "email": "student@example.com",
  "password": "password123",
  "role": "customer"
}
```

Success response:

```json
{
  "data": {
    "id": "user-20260525-001",
    "email": "student@example.com",
    "role": "customer"
  }
}
```

Error cases:

- `400` for missing email.
- `400` for invalid email format.
- `400` for weak or missing password.
- `409` for duplicate email.
- `400` for unsupported role.

### `POST /api/auth/login`

Request:

```json
{
  "email": "student@example.com",
  "password": "password123"
}
```

Success response:

```json
{
  "data": {
    "id": "user-20260525-001",
    "email": "student@example.com",
    "role": "customer"
  }
}
```

Error cases:

- `400` for missing email or password.
- `401` for invalid credentials.

Session behavior:

- On success, set `req.session.userId`.
- Do not return `passwordHash`.

### `POST /api/auth/logout`

Request:

```json
{}
```

Success response:

```json
{
  "data": {
    "message": "Logged out"
  }
}
```

Error cases:

- Logout can be idempotent. If no session exists, return success or `204`.

Session behavior:

- Destroy the session.
- Clear the session cookie.

### `GET /api/auth/me`

Success response when logged in:

```json
{
  "data": {
    "id": "user-20260525-001",
    "email": "student@example.com",
    "role": "customer"
  }
}
```

Error response when not logged in:

```json
{
  "error": {
    "message": "Authentication required",
    "status": 401
  }
}
```

## 7. Ownership Rules

Recommended ownership rules:

- Require login for cart writes after the auth phase.
- Require login for checkout order creation.
- Require login for order list and order detail reads.
- Cart belongs to `userId`.
- Orders belong to `userId`.
- Users can only see their own orders.
- Admin-only access can be deferred to a later phase.

Unauthenticated behavior:

- Preferred: return `401` with a clear JSON error for cart and order write operations.
- Optional temporary compatibility: allow read-only demo fallback for public storefront browsing, but do not use it for checkout or order creation.

Course-project recommendation:

- Keep product browsing public.
- Require authentication for cart writes, checkout, and order history after the frontend auth integration is connected.

## 8. Frontend Integration Plan

These changes should happen later, after the backend auth endpoints are implemented and smoke tested.

Planned frontend changes:

- `login.html` submits to `POST /api/auth/login`.
- `register.html` submits to `POST /api/auth/register`.
- `main.js` calls `GET /api/auth/me` on page load.
- Header changes from `Hello, sign in` to the current user email when logged in.
- Cart API calls rely on the browser session cookie.
- Checkout requires login before order creation.
- `orders.html` loads only the current user's orders.
- A logout link or button can be added later without redesigning the layout.

Do not implement these frontend changes during the planning phase.

## 9. Migration Strategy

Safe implementation sequence:

1. Add auth backend only.
2. Test register, login, logout, and `me` with API calls.
3. Convert cart from fixed `demo-cart` to user-scoped carts.
4. Convert orders from global orders to user-scoped orders.
5. Connect login/register frontend pages.
6. Update header session display.
7. Add regression tests for product, cart, checkout, order success, and orders pages.

Reasoning:

- Auth endpoints should be proven independently before changing cart and order ownership.
- Cart ownership should be migrated before checkout depends on it.
- Order ownership should be migrated before `orders.html` is fully session-scoped.
- Frontend changes should come after backend contracts are stable.

## 10. Validation Plan

API smoke checks:

- Register creates a user with `passwordHash`.
- Registered user response excludes `passwordHash`.
- Duplicate email is rejected.
- Login with valid credentials creates a session.
- Login with invalid credentials is rejected.
- `GET /api/auth/me` returns the current user when logged in.
- `GET /api/auth/me` returns `401` when not logged in.
- Logout clears the session.
- Unauthenticated cart write returns `401` or the documented fallback behavior.
- Logged-in cart add persists under `userId`.
- Logged-in cart read returns only the user's cart.
- Checkout creates an order with `userId`.
- Successful checkout clears only the current user's cart.
- Orders list returns only the current user's orders.
- Order detail rejects access to another user's order.

Browser smoke checks after frontend integration:

- Register page creates an account.
- Login page signs in and redirects or shows session state.
- Header shows logged-in user state.
- Add to Cart works while logged in.
- Checkout creates a user-scoped order.
- Orders page shows only the logged-in user's orders.
- Logout returns the header to signed-out state.

Regression checks:

- Product browsing remains public.
- Product detail remains public.
- Admin pages remain unchanged unless a later admin auth phase explicitly updates them.

## 11. Risks and Limitations

Known risks:

- JSON file storage has concurrency limitations and is not suitable for production traffic.
- Default `express-session` memory storage is not production safe.
- Session secret handling must be explicit; do not hardcode a real production secret.
- Password hashing adds a dependency and must be installed deliberately.
- Browser cookie behavior can vary if the app is served from a different origin later.
- There is no admin authorization yet.
- There is no password reset flow.
- There is no email verification.
- There is no account lockout or rate limiting.
- This remains a course-project authentication system, not production-grade security.

Mitigations:

- Keep session settings clear and documented.
- Use environment variables for session secret where possible.
- Return safe user objects without `passwordHash`.
- Keep authorization checks close to cart and order service boundaries.
- Add a later security hardening phase if the project scope expands.

## 12. Recommendation

Recommended first implementation step:

Auth Backend Phase 5A:

- Add auth backend endpoints.
- Add password hashing.
- Add session middleware.
- Add `GET /api/auth/me`.
- Keep product browsing unchanged.
- Do not connect frontend pages yet.
- Do not convert admin authorization yet.

This keeps the next phase small, testable, and reversible before user-scoped cart and order ownership are introduced.
