# User Auth MySQL Phase 7C

## Goal

Phase 7C migrates user and authentication runtime persistence from `server/data/users.json` to the MySQL `users` table while preserving the existing auth API, session, role, and frontend login/register behavior.

This phase does not migrate carts or orders.

## Files Modified

- `server/repositories/userRepository.js`
- `docs/backend/user-auth-mysql-phase-7c.md`

No frontend files were modified.

## Repository Functions Migrated

`server/repositories/userRepository.js` now uses the MySQL pool from `server/database/database.js` for user runtime operations:

- `getAllUsers`
- `findUserByEmail`
- `findUserById`
- `createUser`

The repository no longer reads from or writes to `server/data/users.json` at runtime.

## MySQL to Server Field Mapping

The repository converts MySQL columns to the server-side user shape:

- `password_hash` -> `passwordHash` for internal bcrypt verification only
- `created_at` -> `createdAt`
- `updated_at` -> `updatedAt`

`passwordHash` is not returned by auth controller responses.

## Password Hashing Behavior

Password hashing still uses the existing `server/utils/passwordHash.js` bcryptjs utility.

Registration flow:

- Validates email, password, and role in `authService`.
- Normalizes email to lowercase.
- Hashes the submitted password with bcryptjs.
- Stores the hash in MySQL `users.password_hash`.
- Does not write plain-text passwords.

Login flow:

- Reads the user by email from MySQL.
- Compares the submitted password against `password_hash` through bcryptjs.
- Preserves the existing invalid credential behavior.

## Safe User Response Shape

Auth API responses continue to return safe user data only:

```json
{
  "data": {
    "id": "user-...",
    "email": "student@example.com",
    "role": "customer",
    "createdAt": "..."
  }
}
```

Responses do not include `password`, `passwordHash`, or `password_hash`.

## Session Behavior

The session behavior is unchanged:

- Register stores `req.session.userId`.
- Login stores `req.session.userId`.
- Logout destroys the session and clears `shoplite.sid`.
- `GET /api/auth/me` reads `req.session.userId` and hydrates the user from MySQL.

No JWT logic was added.

## Role Authorization Behavior

Admin/customer authorization now reads user role data from MySQL through `userRepository.findUserById`.

Verified behavior:

- Signed-out admin API access returns 401.
- Customer admin API access returns 403.
- Admin API access succeeds for a MySQL-backed admin user.
- Protected admin HTML pages continue to require admin role.

## Schema and Seed Changes

No schema change was needed.

`server/database/seedDatabase.js` was not changed in this phase. It already maps JSON `passwordHash` values into MySQL `users.password_hash`.

The MySQL `users` table has no plain-text `password` column.

## Validation Commands

Commands run:

- `npm run db:reset`
- `node --check server/repositories/userRepository.js`
- `node --check` for all server JavaScript files
- `git diff --check`
- Static CJK scan on changed files
- Static scan for React, Vue, TypeScript, Tailwind, JWT, and ORM terms in changed implementation files
- Static scan for public API password-hash leaks

All checks passed. Git line-ending warnings were informational Windows LF-to-CRLF notices only.

## API Smoke Results

API checks through `http://localhost:3000` passed:

- `POST /api/auth/register` created a temporary MySQL customer user.
- Duplicate register for the same email returned 409.
- `GET /api/auth/me` returned the current safe user without password hash fields.
- `POST /api/auth/logout` logged out.
- `GET /api/auth/me` after logout returned 401.
- Login with invalid password returned 401.
- Login with the temporary MySQL customer succeeded.
- Seeded customer login succeeded for `sseng@demo.com`.
- Signed-out admin dashboard API access returned 401.
- Customer admin dashboard API access returned 403.
- Temporary MySQL admin dashboard API access succeeded.

Product regression checks passed:

- `GET /api/products` returned 48 MySQL products.
- `GET /api/products/1` returned product 1.
- `GET /api/products?category=electronics` returned 8 products.

Boundary checks passed:

- Signed-out `GET /api/cart` returned 401.
- Signed-in cart add still worked through the current JSON-backed cart implementation.
- Order validation still used the current JSON-backed order implementation.

## Browser Smoke Results

Browser smoke checks through `http://localhost:3000` passed:

- `index.html` loaded signed out.
- Signed-out Add to Cart redirected to `login.html?returnTo=...`.
- `register.html` created a MySQL-backed customer and updated the header.
- Logout updated header state.
- `login.html` authenticated the seeded MySQL customer.
- `products.html?category=electronics` rendered 8 MySQL products.
- `product-detail.html?productId=1` rendered MySQL product data.
- Signed-in customer Add to Cart worked with the current JSON-backed cart system.
- `cart.html` rendered the current user's cart.
- Checkout created an order through the current JSON-backed order implementation.
- `orders.html` loaded the current user's orders.
- Customer access to `admin-dashboard.html` returned 403.
- Signed-out access to `admin-dashboard.html` redirected to login with `returnTo`.
- `login.html` authenticated a temporary MySQL admin and opened `admin-dashboard.html`.
- `admin-products.html` rendered MySQL products.
- `admin-orders.html` loaded with the current JSON-backed order implementation.

Expected 401 and 403 network console entries appeared during deliberate auth-negative checks. No unexpected browser console or page errors were recorded.

## Data Persistence Validation

User data is now persisted in MySQL:

- A temporary test user was registered through the auth API.
- The user existed in the MySQL `users` table.
- The password was stored only in `password_hash`.
- The password hash used bcrypt format.
- No plain-text `password` column exists.
- Login still worked in a new session.
- Temporary test data was removed by resetting MySQL to the seeded baseline.

`server/data/users.json` was not modified.

## Runtime Boundary

After Phase 7C:

- Products use MySQL.
- Users and auth use MySQL.
- Carts still use JSON.
- Orders still use JSON.
- No frontend database logic was introduced.

## Remaining Phases

- Phase 7D: migrate carts repository to MySQL
- Phase 7E: migrate orders repository to MySQL
- Phase 7F: final MySQL regression audit
