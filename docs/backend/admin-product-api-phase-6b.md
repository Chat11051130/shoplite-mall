# Admin Product API Phase 6B

## Summary

Admin Product API Phase 6B adds admin-only product write operations while preserving the existing public product browsing API and approved frontend layout.

This phase does not add admin order APIs, dashboard statistics APIs, database code, JWT, React, Vue, TypeScript, Tailwind, a build tool, or changes under `public/design-preview/`.

## Files Modified

Backend:

- `server/routes/productRoutes.js`
- `server/controllers/productController.js`
- `server/services/productService.js`
- `server/repositories/productRepository.js`
- `server/middleware/requireRole.js`

Frontend:

- `public/admin-products.html`
- `public/admin-product-form.html`
- `public/js/pages/adminProductsPage.js`
- `public/js/pages/adminProductFormPage.js`

Documentation:

- `docs/backend/admin-product-api-phase-6b.md`

## Product API Endpoints

Public product reads remain available:

| Method | Endpoint | Access |
|---|---|---|
| `GET` | `/api/products` | public |
| `GET` | `/api/products/:id` | public |

Admin product writes were added:

| Method | Endpoint | Access |
|---|---|---|
| `POST` | `/api/products` | admin only |
| `PATCH` | `/api/products/:id` | admin only |
| `DELETE` | `/api/products/:id` | admin only |

List responses keep the existing `data` payload and now include a `meta.count` field for compatibility with admin table rendering.

## Authorization Behavior

Product write routes use `requireRole("admin")`.

| Request state | Result |
|---|---|
| Signed out | `401` JSON error |
| Logged-in customer | `403` JSON error |
| Logged-in admin | write request allowed |

`requireRole` now also checks `req.originalUrl` so API routes mounted under `/api/products` return JSON errors instead of HTML redirects.

## Product Validation Rules

Create requests require:

- `category`
- `title`
- `price`
- `image`
- `alt`
- `stock`
- `shortDescription`

Allowed categories:

- `electronics`
- `fashion`
- `home`
- `beauty`
- `grocery`
- `sports`

Create behavior:

- Category is normalized to lowercase.
- The next numeric product id is generated from `products.json`.
- Optional fields receive safe defaults.
- Product shape remains compatible with customer product cards and detail rendering.

Patch behavior:

- Only allowed product fields can be updated.
- `id` is preserved.
- Invalid category, price, stock, rating, reviews, or array fields return validation errors.

Delete behavior:

- Existing product is removed from `products.json`.
- Response returns the deleted product id.
- Existing carts and historical orders are not updated in this phase.

## Admin Products Page Integration

`public/js/pages/adminProductsPage.js` now loads products from:

- `GET /api/products`

The page preserves the existing admin layout and supports:

- backend-driven product table rendering
- product search
- category filter
- status filter derived from stock/tag values
- Edit action to `admin-product-form.html?productId=<id>`
- Delete action through `DELETE /api/products/:id`
- success and error toast feedback

## Admin Product Form Integration

`public/js/pages/adminProductFormPage.js` now supports two modes:

Create mode:

- URL has no `productId`.
- Form starts empty.
- Submit calls `POST /api/products`.
- Success updates the URL to `admin-product-form.html?productId=<createdId>`.

Edit mode:

- URL has `productId`.
- Form loads data from `GET /api/products/:id`.
- Submit calls `PATCH /api/products/:id`.
- Success shows clean feedback in the existing validation message area.

Supported form fields include:

- category
- product name
- price
- old price
- discount label
- stock
- status
- badge
- image URL
- image alt text
- shipping note
- product description

## Data Cleanup

`server/data/products.json` was backed up before smoke checks. Browser and API smoke checks created, edited, and deleted temporary product id `49`.

After smoke checks, JSON seed files were restored from backup. The committed catalog remains at `48` products with `8` products in each category.

## API Smoke Results

All API smoke checks ran through `http://localhost:3000`.

| Check | Result |
|---|---|
| Signed out `POST /api/products` | `401` |
| Signed out `PATCH /api/products/1` | `401` |
| Signed out `DELETE /api/products/1` | `401` |
| Customer `POST /api/products` | `403` |
| Customer `PATCH /api/products/1` | `403` |
| Customer `DELETE /api/products/1` | `403` |
| Admin `GET /api/products` | `48` products |
| Admin `POST /api/products` | `201`, created id `49` |
| Admin `GET /api/products/49` | created product returned |
| Admin `PATCH /api/products/49` | updated title and price |
| Admin `GET /api/products/49` | updated product returned |
| Missing title create validation | `400` |
| Invalid category create validation | `400` |
| Invalid price patch validation | `400` |
| Admin `DELETE /api/products/49` | deleted id `49` |
| Admin `GET /api/products/49` after delete | `404` |

## Browser Smoke Results

Browser checks ran through `http://localhost:3000`.

| Check | Result |
|---|---|
| Signed-out admin products access | redirected to `login.html?returnTo=admin-products.html` |
| Admin login | returned to `admin-products.html` |
| Admin product table | `48` backend rows rendered |
| Admin search filter | `AeroBook` returned `1` visible row |
| Admin category filter | `electronics` returned `8` visible rows |
| Admin create product | temporary id `49` created |
| Admin edit product | temporary id `49` updated |
| Admin delete product | temporary id `49` removed |
| Admin sidebar navigation | dashboard loaded |
| Customer admin access | `403` |
| Customer index page | loaded |
| Customer products category route | electronics route rendered product cards |
| Customer product detail | `productId=1` loaded |
| Customer Add to Cart | cart count updated to `1` |
| Customer checkout flow | reached `order-success.html?orderId=...` |
| Customer orders page | created order rendered |
| Signed-out Add to Cart | redirected to `login.html?returnTo=...` |

Unexpected browser console errors: `0`.

Expected auth-denial network console messages were observed only during negative 401/403 checks.

## Customer Regression Results

Public product behavior remains intact:

- `products.html` still reads from the product API.
- `products.html?category=electronics` still renders matching products.
- `product-detail.html?productId=1` still renders product detail.
- Signed-in customer Add to Cart still uses the cart API.
- Signed-out Add to Cart still redirects to login with `returnTo`.
- Checkout and order creation still work for a signed-in customer.
- Customer users remain blocked from protected admin pages.

## Known Limitations

- No image upload is implemented; product image values are URL strings.
- JSON files remain the persistence layer.
- Product deletion does not update historical orders or existing cart items.
- Admin order APIs are still deferred.
- Dashboard statistics APIs are still deferred.
- Production-grade audit logging and concurrency controls are still deferred.
