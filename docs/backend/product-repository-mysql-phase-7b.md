# Product Repository MySQL Phase 7B

## Goal

Phase 7B migrates product runtime persistence from `server/data/products.json` to the MySQL `products` table while preserving the existing public and admin product API behavior.

This phase does not migrate users, authentication, carts, or orders. Those repositories remain JSON-backed.

## Files Modified

- `server/repositories/productRepository.js`
- `server/services/productService.js`
- `server/database/schema.sql`
- `server/database/seedDatabase.js`
- `docs/backend/product-repository-mysql-phase-7b.md`

No frontend files were modified.

## Repository Functions Migrated

`server/repositories/productRepository.js` now uses the MySQL pool from `server/database/database.js` for product runtime operations:

- `findAll`
- `findById`
- `getAllProducts`
- `getProductById`
- `createProduct`
- `updateProduct`
- `deleteProduct`

The repository no longer reads from or writes to `server/data/products.json` at runtime.

## MySQL to API Field Mapping

The repository converts MySQL columns back to the existing camelCase API shape:

- `old_price` -> `oldPrice`
- `short_description` -> `shortDescription`
- `details_json` -> `details`
- `highlights_json` -> `highlights`
- `tags_json` -> `tags`
- `created_at` -> `createdAt`
- `updated_at` -> `updatedAt`

JSON columns are parsed before returning products to controllers. Missing JSON values fall back to the existing frontend-safe defaults.

## Schema Change

`products.tags_json JSON NULL` was added to preserve the existing product `tags` array from the JSON catalog. This keeps routes such as `GET /api/products?tag=deal` compatible after moving product data to MySQL.

`server/database/seedDatabase.js` now maps JSON `product.tags` into `products.tags_json` during seeding.

## Create, Update, and Delete Behavior

Admin product create now inserts into MySQL and generates the next numeric product ID inside a transaction.

Admin product update now writes allowed product fields to MySQL, preserves the product ID, and returns the updated product in the existing API shape.

Admin product delete now deletes from MySQL. If a product is referenced by `cart_items` or `order_items`, the repository returns a clear 409 error instead of deleting historical cart or order references.

## Foreign Key Behavior

Hard delete is allowed only for products that are not referenced by carts or orders.

Referenced products are protected by MySQL foreign keys. During smoke testing, deleting product `1` returned 409 because it is referenced by existing order data.

## Validation Commands

Commands run:

- `npm run db:reset`
- `node --check` for all server JavaScript files
- `git diff --check`
- Static CJK scan on changed files
- Static scan for React, Vue, TypeScript, Tailwind, JWT, and ORM terms in changed files

All checks passed. Line-ending warnings from Git were informational Windows LF-to-CRLF notices only.

## API Smoke Results

API checks through `http://localhost:3000` passed:

- `GET /` returned 200
- `GET /api/products` returned 48 products
- `GET /api/products?category=electronics` returned 8 products
- `GET /api/products?category=fashion` returned 8 products
- `GET /api/products?category=home` returned 8 products
- `GET /api/products?category=beauty` returned 8 products
- `GET /api/products?category=grocery` returned 8 products
- `GET /api/products?category=sports` returned 8 products
- `GET /api/products?query=laptop` returned 3 matches
- `GET /api/products?sort=price-low` sorted low prices first
- `GET /api/products?sort=price-high` sorted high prices first
- `GET /api/products?rating=4` returned matching products
- `GET /api/products?tag=deal` returned matching products
- `GET /api/products/1` returned product 1
- `GET /api/products/7` returned product 7
- `GET /api/products/999999` returned 404

Admin write API checks passed:

- Signed-out `POST /api/products` returned 401
- Customer `POST /api/products` returned 403
- Admin `POST /api/products` created a temporary MySQL product
- Admin `PATCH /api/products/:id` updated the temporary product
- Admin `DELETE /api/products/:id` deleted the temporary product
- Admin `DELETE /api/products/1` returned 409 due to foreign key references
- Validation errors returned 400 for missing title, invalid category, and invalid price

Temporary product data was removed and the database was reset to the seeded baseline.

## Browser Smoke Results

Browser smoke checks through `http://localhost:3000` passed:

- Signed-out home page loaded
- Signed-out Add to Cart redirected to login with `returnTo`
- Customer register, login, and logout worked
- `products.html` loaded products from the API
- `products.html?category=electronics` rendered 8 electronics products
- `products.html?query=laptop` rendered 3 matching products
- Price-low sort worked
- Load More expanded visible products from 16 to 32
- Product cards linked to `product-detail.html?productId=<id>`
- Product detail pages for product IDs 1 and 7 rendered different MySQL products
- Related products rendered
- Signed-in Add to Cart updated the user cart count
- Cart, checkout, order success, My Orders, and Reorder flows still worked
- Customer access to admin dashboard returned 403
- Signed-out admin dashboard access redirected to login with `returnTo`
- Admin dashboard loaded backend summary, charts, recent orders, refresh behavior, and valid category images
- Admin product create, edit, and delete worked through the browser
- Admin orders loaded backend data and status update worked

Expected 401 and 403 network console entries appeared during deliberate auth-negative checks. No unexpected browser console or page errors were recorded.

## Data Persistence Validation

Product data is now persisted in MySQL:

- A temporary admin product was created through the API and browser form.
- The temporary product remained visible after admin page refresh.
- The temporary product was updated through MySQL-backed APIs.
- The temporary product was deleted after validation.
- Final MySQL product count was restored to 48.
- `server/data/products.json` was not modified.

## Runtime Boundary

After Phase 7B:

- Products use MySQL.
- Users and auth still use JSON.
- Carts still use JSON.
- Orders still use JSON.
- No frontend database logic was introduced.

## Remaining Phases

- Phase 7C: migrate users/auth repository to MySQL
- Phase 7D: migrate carts repository to MySQL
- Phase 7E: migrate orders repository to MySQL
- Phase 7F: final MySQL regression audit
