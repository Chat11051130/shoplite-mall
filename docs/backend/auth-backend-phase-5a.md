# Auth Backend Phase 5A

## Summary

Auth Backend Phase 5A added backend-only authentication endpoints and Express session middleware for ShopLite. Frontend pages were not connected in this phase, and product, cart, and order ownership behavior remains unchanged.

## Files Created

- `server/middleware/requireAuth.js`
- `server/utils/passwordHash.js`
- `docs/backend/auth-backend-phase-5a.md`

## Files Modified

- `package.json`
- `package-lock.json`
- `server/app.js`
- `server/routes/authRoutes.js`
- `server/controllers/authController.js`
- `server/services/authService.js`
- `server/repositories/userRepository.js`

`server/data/users.json` was used during smoke testing and restored afterward, so it has no final data diff from the test run.

## Dependencies Added

- `express-session`
- `bcryptjs`

`bcryptjs` was selected instead of native `bcrypt` to avoid native build risk on Windows.

## Session Strategy

ShopLite now uses Express cookie-based sessions.

Session configuration:

- Cookie name: `shoplite.sid`
- Secret: `process.env.SESSION_SECRET` or a development fallback
- `resave: false`
- `saveUninitialized: false`
- `httpOnly: true`
- `sameSite: "lax"`
- `secure: false` for local development
- `maxAge: 1000 * 60 * 60 * 2`

This is appropriate for the current course-project phase. The default in-memory session store is not production safe and should be replaced if the project moves beyond local coursework.

## Auth Endpoint Behavior

Mounted route prefix:

- `/api/auth`

Endpoints:

| Endpoint | Behavior |
|---|---|
| `POST /api/auth/register` | Creates a user, hashes the password, stores `req.session.userId`, and returns a safe user object |
| `POST /api/auth/login` | Verifies credentials, stores `req.session.userId`, and returns a safe user object |
| `POST /api/auth/logout` | Destroys the current session and clears `shoplite.sid` |
| `GET /api/auth/me` | Returns the current safe user when a valid session exists |

Success response shape:

```json
{
  "data": {}
}
```

Error response shape:

```json
{
  "error": {
    "message": "...",
    "status": 400
  }
}
```

## User Data Model

`server/data/users.json` stores users with this shape:

```json
{
  "id": "user-...",
  "email": "student@example.com",
  "passwordHash": "...",
  "role": "customer",
  "createdAt": "..."
}
```

Rules implemented:

- Email is required.
- Email is normalized to lowercase.
- Email must be unique.
- Password is required.
- Password must be at least 6 characters.
- Role defaults to `customer`.
- Allowed roles are `customer` and `admin`.
- API responses never include `passwordHash`.
- Plain-text passwords are never written to `users.json`.

## Validation Results

Static checks:

- `npm install` completed successfully.
- `node --check` passed for all server JavaScript files.
- `git diff --check` passed.
- Chinese character scan passed for changed code and documentation.
- Scan confirmed no React, Vue, TypeScript, Tailwind, or database dependency was introduced.
- `public/design-preview/` remained untouched.

## API Smoke Check Results

All smoke checks ran through `http://localhost:3000`.

| Check | Result |
|---|---|
| `POST /api/auth/register` | Passed with `201`; returned safe user `student@example.com` |
| `users.json` after register | Passed; contained bcrypt `passwordHash` and no plain `password` field |
| Register response | Passed; did not include `passwordHash` |
| Session cookie after register | Passed; `shoplite.sid` was set |
| Duplicate register | Passed; returned `409` |
| `GET /api/auth/me` after register | Passed; returned current user |
| `POST /api/auth/logout` | Passed; returned success |
| `GET /api/auth/me` after logout | Passed; returned `401` |
| Invalid login | Passed; returned `401` |
| Valid login | Passed; returned safe user and set `shoplite.sid` |
| `GET /` | Passed; still serves frontend |
| `GET /api/products` | Passed; existing product API still works |
| `GET /api/cart` | Passed; existing demo-cart API still works |
| `GET /api/orders` | Passed; existing order API still works |

Smoke test user data was restored after validation.

## Remaining Work

Still deferred:

- Connect `login.html` to `POST /api/auth/login`.
- Connect `register.html` to `POST /api/auth/register`.
- Add `GET /api/auth/me` session checks to frontend shell behavior.
- Convert cart ownership from fixed `demo-cart` to user-scoped carts.
- Convert orders from global order history to user-scoped order history.
- Add admin authorization and admin session behavior in a later phase.
- Replace memory session storage and JSON file persistence if production-like behavior becomes required.
