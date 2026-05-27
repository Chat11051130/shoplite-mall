# MySQL Foundation Phase 7A

## Summary

Database Persistence Phase 7A adds a MySQL foundation for the ShopLite Mall backend while leaving the stable JSON-backed runtime unchanged.

This phase does not migrate repositories, does not change product/cart/order/auth API behavior, does not modify frontend pages, and does not modify `public/design-preview/`.

## Files Created

- `.env.example`
- `server/database/dbConfig.js`
- `server/database/database.js`
- `server/database/schema.sql`
- `server/database/initDatabase.js`
- `server/database/seedDatabase.js`
- `server/database/resetDatabase.js`
- `docs/backend/mysql-foundation-phase-7a.md`

## Files Modified

- `.gitignore`
- `package.json`
- `package-lock.json`

## Dependencies Added

- `mysql2`
- `dotenv`

No ORM or migration framework was added. Prisma, Sequelize, TypeORM, Drizzle, and Knex remain absent.

## Environment Variables

`.env.example` documents the local database settings:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=shoplite_mall
```

`.env` is ignored by Git and should hold local credentials only.

## Database Name

Default database:

- `shoplite_mall`

The database name can be overridden with `DB_NAME`.

## Schema Overview

`server/database/schema.sql` defines these MySQL tables:

- `users`
- `products`
- `carts`
- `cart_items`
- `orders`
- `order_items`

The schema uses:

- `CREATE TABLE IF NOT EXISTS`
- InnoDB tables
- `utf8mb4`
- foreign keys for users, carts, products, and orders
- indexes for email, category, cart lookup, order lookup, status, created date, and order item lookup

The `users` table stores `password_hash`. There is no plain-text password column.

## Init Script Behavior

Script:

```bash
npm run db:init
```

Implementation:

- Connects to the MySQL server without selecting the app database.
- Creates `DB_NAME` if it does not exist.
- Connects to `DB_NAME`.
- Reads and executes `server/database/schema.sql`.
- Is safe to run more than once.
- Does not import the Express app.
- Does not start the server.
- Does not modify `server/data/*.json`.

## Seed Script Behavior

Script:

```bash
npm run db:seed
```

Implementation:

- Reads existing JSON files from `server/data/`.
- Clears database rows in foreign-key-safe order.
- Inserts users and preserves `passwordHash` as `password_hash`.
- Inserts products and maps camelCase JSON fields to snake_case columns.
- Inserts carts and cart items when corresponding users/products exist.
- Inserts orders and order items when JSON order data exists.
- Uses a transaction.
- Does not modify `server/data/*.json`.

Compatibility note:

- Current JSON sample orders are legacy admin-visible orders without `userId`.
- For database seeding only, those legacy orders are assigned to the first seeded user so the required `orders.user_id` foreign key can be satisfied.
- JSON files are not changed.

## Reset Script Behavior

Script:

```bash
npm run db:reset
```

Implementation:

- Refuses to run when `NODE_ENV=production`.
- Refuses to run when `DB_NAME` is missing.
- Logs the target database name.
- Drops `DB_NAME`.
- Recreates the database.
- Runs schema initialization.
- Runs JSON seed import.
- Does not modify `server/data/*.json`.

## Package Scripts

Added scripts:

```json
{
  "db:init": "node server/database/initDatabase.js",
  "db:seed": "node server/database/seedDatabase.js",
  "db:reset": "node server/database/resetDatabase.js"
}
```

Existing scripts remain:

```json
{
  "start": "node server/app.js",
  "dev": "node server/app.js"
}
```

## Validation Results

Dependency install:

- `npm install mysql2 dotenv` completed successfully.
- `npm audit` reported `0` vulnerabilities.

Syntax checks:

- `node --check server/database/dbConfig.js` passed.
- `node --check server/database/database.js` passed.
- `node --check server/database/initDatabase.js` passed.
- `node --check server/database/seedDatabase.js` passed.
- `node --check server/database/resetDatabase.js` passed.
- All modified/new server JavaScript files passed `node --check`.

Database command attempts:

| Command | Result |
|---|---|
| `npm run db:init` | blocked by local MySQL authentication |
| `npm run db:seed` | blocked by local MySQL authentication |
| `npm run db:reset` | blocked by local MySQL authentication |

Observed MySQL error:

```text
Access denied for user 'root'@'localhost' (using password: NO)
```

This confirms the scripts reached MySQL, but the local environment does not have credentials configured for the default `.env.example` values. A local `.env` with valid `DB_USER` and `DB_PASSWORD` is required before schema creation, seeding, reset, and table-count validation can complete.

Runtime checks:

- `npm start` succeeded.
- `GET /` returned `200`.
- `GET /api/products` returned `48` products.
- Existing JSON-backed runtime behavior remained active.

Browser smoke through `http://localhost:3000` passed:

- `index.html` loads.
- `register.html` and `login.html` work.
- `products.html` loads API products.
- `product-detail.html?productId=1` loads API product data.
- Cart still works for a logged-in customer.
- Checkout creates an order.
- Order success reads the created order.
- `orders.html` reads the current user's orders.
- Reorder works.
- Signed-out admin access redirects to login.
- Customer admin access returns `403`.
- Admin login works.
- Admin dashboard loads backend summary, category sales, order status, and recent orders.
- Dashboard category sales summary rendered `6` category images with `0` broken images.
- Admin products load backend products.
- Admin orders load backend orders.
- Browser console unexpected local page errors: `0`.

Static checks:

- `git diff --check` passed.
- CJK scan passed for changed code and comments.
- Forbidden framework/auth/ORM scan passed for changed implementation code.
- No React, Vue, TypeScript, Tailwind, JWT, Prisma, Sequelize, TypeORM, Drizzle, or Knex code was introduced.

## Database Validation Status

The following checks are ready in the scripts but could not be completed in this local environment because MySQL rejected the default credentials:

- Confirm `shoplite_mall` is created.
- Confirm tables exist.
- Confirm product/user/cart/order row counts match JSON seed files.
- Confirm `password_hash` exists.
- Confirm no plain-text password column exists.

## Runtime Repository Status

Runtime APIs still use the existing JSON repositories:

- `server/repositories/productRepository.js`
- `server/repositories/userRepository.js`
- `server/repositories/cartRepository.js`
- `server/repositories/orderRepository.js`

No repository migration happened in Phase 7A.

## Remaining Migration Phases

- Phase 7B: migrate products repository.
- Phase 7C: migrate users/auth repository.
- Phase 7D: migrate carts repository.
- Phase 7E: migrate orders repository.
- Phase 7F: final MySQL regression audit.
