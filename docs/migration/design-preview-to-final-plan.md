# Design Preview To Final Migration Plan

## Summary

Create `docs/migration/design-preview-to-final-plan.md` as a documentation-only migration guide. The approved static prototype in `public/design-preview/` is the visual and hook source of truth, and migration should happen in controlled phases instead of copying all prototype files at once.

Important discovered repo fact: the target `public/` and `server/` structures already exist, so the later implementation phase must compare existing files before replacing anything.

## Overall Migration Strategy

- Treat `public/design-preview/` as the approved static prototype, not as production-ready code.
- Migrate in phases: first static page shell, then shared layout, then data rendering, then backend integration.
- Preserve the Figure 01 visual system as the storefront source of truth.
- Use P3 `data-*` hooks as the bridge between static HTML and final JavaScript modules.
- Do not migrate every page at once. Start with `public/index.html`.

## Page Mapping Table

| Prototype source | Final destination |
|---|---|
| `figure-01-home.html` | `public/index.html` |
| `figure-02-product-detail.html` | `public/product-detail.html` |
| `figure-03-cart.html` | `public/cart.html` |
| `figure-04-checkout.html` | `public/checkout.html` |
| `figure-05-order-success.html` | `public/order-success.html` |
| `figure-06-my-orders.html` | `public/orders.html` |
| `figure-07-auth.html` | `public/login.html`, `public/register.html` |
| `figure-08-admin-products.html` | `public/admin-products.html`, `public/admin-product-form.html` |
| `figure-09-admin-orders.html` | `public/admin-orders.html` |
| `figure-10-admin-dashboard.html` | `public/admin-dashboard.html` |

Also create or verify:

- `public/profile.html`
- `public/admin-login.html`

These are not direct one-to-one prototype pages, so they should inherit the final ShopLite layout and auth/admin visual system after the first migration pass is stable.

## CSS Migration Plan

Split `public/design-preview/css/design-preview.css` into:

- `public/css/styles.css`: global tokens, typography, base elements, color variables, body/page defaults.
- `public/css/layout.css`: customer header, category nav, footer, marketplace shell, page spacing, admin layout containers.
- `public/css/components.css`: buttons, cards, badges, product cards, recommendation rails, forms, tables, modals, toasts, quantity controls.
- `public/css/responsive.css`: all media queries and responsive layout overrides.
- `public/css/admin.css`: admin sidebar, dashboard stats, admin tables, admin panels, admin chart surfaces.

Implementation rule for later migration: split CSS only after `public/index.html` is visually matched to Figure 01, so visual regressions are easier to isolate.

## JavaScript Migration Plan

Split `public/design-preview/js/design-preview.js` into:

- `layout/`: `navbar.js`, `footer.js`, `toast.js`, `modal.js`, `loading.js`, `pagination.js`.
- `pages/`: one initializer per page, such as `homePage.js`, `cartPage.js`, `checkoutPage.js`, and admin page initializers.
- `modules/`: business-facing modules for products, cart, orders, auth, admin products, admin orders, and statistics.
- `templates/`: reusable render functions for product cards, cart items, order cards, admin rows, and empty states.
- `core/`: shared helpers for API calls, local storage, session state, DOM lookup, formatting, validation, and routing helpers.
- `config/`: page metadata, API endpoints, feature flags, and app-level constants.

`public/js/main.js` should detect `document.body.dataset.page` and load the correct page initializer.

## Data Migration Plan

Move static mock data out of page files later into server data files:

- `products.json`: product listing data, product detail records, categories, prices, ratings, images, inventory status.
- `users.json`: customer users, admin users, role metadata, profile display data.
- `carts.json`: cart ownership, cart item IDs, quantities, selected state.
- `orders.json`: order summaries, order items, totals, delivery estimates, order statuses.

Do not create or rewrite these JSON files during the documentation phase. In the implementation phase, reconcile with existing server data first.

## Hook Usage Plan

Use P3 hooks as stable integration contracts:

- `data-page`: page initializer routing in `main.js`.
- `data-component`: layout and page-level rendering targets.
- `data-action`: event delegation for clicks, submits, filters, status updates, and cart actions.
- `data-field`: form extraction and validation.
- `data-role`: dynamic text updates such as totals, prices, statuses, counts, and dashboard stats.
- `data-product-id`, `data-cart-item-id`, `data-order-id`, `data-order-status`: data binding keys for modules and templates.
- `data-chart`: Chart.js canvas initialization.

Avoid binding final JavaScript to visual class names unless the class is truly a component API.

## Backend Integration Sequence

1. Migrate static `public/index.html` only.
2. Extract and render shared navbar/footer.
3. Load product data into the home page.
4. Add cart local state using `cartModule.js` and `storageClient.js`.
5. Add auth/session flow.
6. Add order creation from checkout.
7. Add admin product management.
8. Add admin order management.
9. Add dashboard statistics.

Do not connect backend routes before the static page structure and hook contracts are stable.

## Risk Checklist

- Do not copy prototype code without modularizing CSS and JavaScript.
- Do not duplicate navbar/footer manually on every final page.
- Do not keep mock data inside production page files.
- Do not connect backend APIs before final page structure stabilizes.
- Do not split CSS too early without visual comparison against Figure 01.
- Do not overwrite existing `public/` or `server/` files without reviewing current contents.
- Do not remove P3 hooks during cleanup; they are the migration contract.

## Recommended Next Implementation Phase

The next code phase should migrate only:

- `public/design-preview/figure-01-home.html`
- `public/design-preview/css/design-preview.css`
- relevant home-page behavior from `public/design-preview/js/design-preview.js`

into:

- `public/index.html`
- `public/css/styles.css`
- `public/css/layout.css`
- `public/css/components.css`
- `public/css/responsive.css`
- `public/js/main.js`
- `public/js/pages/homePage.js`
- `public/js/templates/productCardTemplate.js`

Success criteria for that phase:

- `public/index.html` visually matches Figure 01.
- Product grid renders from a JavaScript data source or existing backend-compatible module.
- Search, filter, sort, Add to Cart toast, cart count, recommendation rails, and responsive layout still work.
- No backend changes are made in the first migration phase.

## Phase 1 Implementation Note

Files modified or created:

- `public/index.html`
- `public/css/styles.css`
- `public/css/layout.css`
- `public/css/components.css`
- `public/css/responsive.css`
- `public/js/main.js`
- `public/js/pages/homePage.js`
- `public/js/templates/productCardTemplate.js`
- `docs/migration/design-preview-to-final-plan.md`

What was migrated:

- Migrated the approved Figure 01 homepage into the official `public/index.html` entry page.
- Split the Figure 01 storefront CSS into global, layout, component, and responsive styles.
- Split the home-page JavaScript into a page initializer and product-card template module.
- Preserved the P3 integration hooks for page identity, components, actions, fields, roles, and product metadata.
- Preserved the home page interactions for product rendering, search, category dropdown, category navigation, price filtering, rating filtering, sorting, filter clearing, cart count updates, Add to Cart toast, and recommendation rails.

What was intentionally not migrated:

- Figures 02 through 10 were not migrated.
- Admin pages and admin CSS were not migrated.
- Backend code, Express routes, server data files, and JSON data files were not created or changed.
- Shared navbar/footer rendering modules were not extracted yet; this phase keeps the approved static home layout stable first.

Checks run:

- JavaScript syntax checks for `public/js/main.js`, `public/js/pages/homePage.js`, and `public/js/templates/productCardTemplate.js`.
- `git diff --check`.
- Static scan for Chinese characters in code and comments.
- Static scan for React, Vue, TypeScript, Tailwind, backend code, Express route patterns, API calls, and `fetch`.
- Browser smoke check for `public/index.html`.

Phase 1 rendering follow-up:

- Issue found: the migrated home page initially used ES module imports, which could leave the dynamic product grid and recommendation rails empty when `public/index.html` was opened as a direct static file.
- Fix applied: kept the split JavaScript structure but changed `productCardTemplate.js`, `homePage.js`, and `main.js` to ordered browser scripts with shared `window.ShopLiteTemplates` and `window.ShopLitePages` namespaces.
- Checks run: JavaScript syntax checks, `git diff --check`, static scans, and browser smoke checks confirming 12 product cards, four Best Sellers cards, four Today's Deals cards, four Recommended for You cards, and no page console errors.

Remaining next step:

- In the next phase, extract shared customer layout rendering for the navbar and footer only after `public/index.html` remains visually matched to the approved Figure 01 prototype.

## Phase 2 Implementation Note

Files modified or created:

- `public/product-detail.html`
- `public/js/pages/productDetailPage.js`
- `public/css/layout.css`
- `public/css/components.css`
- `public/css/responsive.css`
- `docs/migration/design-preview-to-final-plan.md`

What was migrated:

- Migrated the approved Figure 02 product detail page into the official `public/product-detail.html` page.
- Reused the official storefront CSS files from Phase 1 and added only the detail-page component styles needed for the gallery, purchase box, quantity control, specifications table, review summary, and related product rail.
- Added local static product detail behavior for thumbnail selection, quantity increment and decrement, Add to Cart toast, Buy Now toast, and cart count updates.
- Preserved P3 hooks for product detail page identity, page components, actions, fields, roles, and product metadata.

What was intentionally not migrated:

- Figures 03 through 10 were not migrated.
- Backend code, Express routes, server files, API calls, and JSON data files were not created or changed.
- Shared layout rendering modules were not extracted yet; the product detail page still uses static header and footer markup for this phase.

Checks run:

- JavaScript syntax checks for `public/js/main.js`, `public/js/pages/homePage.js`, `public/js/pages/productDetailPage.js`, and `public/js/templates/productCardTemplate.js`.
- `git diff --check`.
- Static scan for Chinese characters in code and comments.
- Static scan for React, Vue, TypeScript, Tailwind, backend code, Express route patterns, API calls, and `fetch`.
- Browser smoke check for `public/product-detail.html` confirming the page loads, main product section exists, product gallery exists, quantity control works, Add to Cart toast works, Buy Now toast works, related products exist, and no page console errors occur.
- Browser smoke check for `public/index.html` confirming Phase 1 still renders 12 product cards, four Best Sellers cards, four Today's Deals cards, four Recommended for You cards, and home-page search, sort, toast, and cart count behavior still work.

Remaining next step:

- In the next phase, migrate only the cart page after confirming the shared customer chrome remains visually aligned across `public/index.html` and `public/product-detail.html`.

## Phase 3 Implementation Note

Files modified or created:

- `public/cart.html`
- `public/js/pages/cartPage.js`
- `public/css/components.css`
- `public/css/responsive.css`
- `docs/migration/design-preview-to-final-plan.md`

What was migrated:

- Migrated the approved Figure 03 cart page into the official `public/cart.html` page.
- Reused the official storefront CSS files from earlier phases and added only the cart-page component styles needed for cart items, thumbnails, delete buttons, page title layout, and summary totals.
- Added local static cart behavior for quantity increment and decrement, line total updates, selected item subtotal updates, shipping estimate updates, estimated total updates, item removal, clear cart preview, checkout prototype toast, and cart count updates.
- Preserved P3 hooks for cart page identity, cart list, cart summary, empty cart state, cart item IDs, product IDs, cart actions, quantity fields, and summary roles.

What was intentionally not migrated:

- Figures 04 through 10 were not migrated.
- Backend code, Express routes, server files, API calls, and JSON data files were not created or changed.
- Shared layout rendering modules were not extracted yet; the cart page still uses static header and footer markup for this phase.

Checks run:

- JavaScript syntax checks for `public/js/main.js`, `public/js/pages/homePage.js`, `public/js/pages/productDetailPage.js`, `public/js/pages/cartPage.js`, and `public/js/templates/productCardTemplate.js`.
- `git diff --check`.
- Static scan for Chinese characters in code and comments.
- Static scan for React, Vue, TypeScript, Tailwind, backend code, Express route patterns, API calls, and `fetch`.
- Browser smoke check for `public/cart.html` confirming the page loads, cart list exists, cart summary exists, at least two cart items exist, quantity increment and decrement update quantities and totals, selected item checkbox behavior updates totals, item removal works, checkout prototype toast works, and no page console errors occur.
- Browser smoke check for `public/index.html` confirming Phase 1 still renders 12 product cards, four Best Sellers cards, four Today's Deals cards, four Recommended for You cards, search behavior, Add to Cart toast, and cart count behavior.
- Browser smoke check for `public/product-detail.html` confirming Phase 2 still supports quantity changes, Add to Cart toast, Buy Now toast, related products, and no page console errors occur.

Remaining next step:

- In the next phase, migrate only the checkout page after confirming the shared customer chrome remains visually aligned across the migrated home, product detail, and cart pages.

## Phase 4 Implementation Note

Files modified or created:

- `public/checkout.html`
- `public/js/pages/checkoutPage.js`
- `public/css/layout.css`
- `public/css/components.css`
- `docs/migration/design-preview-to-final-plan.md`

What was migrated:

- Migrated the approved Figure 04 checkout page into the official `public/checkout.html` page.
- Reused the official storefront CSS files from earlier phases and added only the checkout-page styles needed for the secure checkout header, checkout progress, delivery option cards, payment mock section, and order thumbnails.
- Added local static checkout behavior for required field validation, validation message display, delivery option shipping and total updates, payment method selection, and prototype Place Order success feedback.
- Preserved P3 hooks for checkout page identity, checkout form, shipping address, delivery options, payment method, checkout summary, validation message, field extraction, place order action, and summary totals.

What was intentionally not migrated:

- Figures 05 through 10 were not migrated.
- Backend code, Express routes, server files, API calls, and JSON data files were not created or changed.
- Shared layout rendering modules were not extracted yet; the checkout page still uses static checkout-safe header and footer markup for this phase.

Checks run:

- JavaScript syntax checks for `public/js/main.js`, `public/js/pages/homePage.js`, `public/js/pages/productDetailPage.js`, `public/js/pages/cartPage.js`, `public/js/pages/checkoutPage.js`, and `public/js/templates/productCardTemplate.js`.
- `git diff --check`.
- Static scan for Chinese characters in code and comments.
- Static scan for React, Vue, TypeScript, Tailwind, backend code, Express route patterns, API calls, and `fetch`.
- Browser smoke check for `public/checkout.html` confirming the page loads, checkout form exists, shipping address exists, two delivery options exist, two payment methods exist, order summary exists, invalid submit displays validation, valid submit shows prototype success behavior, delivery option selection updates shipping and total, and no page console errors occur.
- Browser smoke check for `public/index.html` confirming Phase 1 still renders 12 product cards and three recommendation rails.
- Browser smoke check for `public/product-detail.html` confirming Phase 2 still supports quantity changes, Add to Cart toast, Buy Now toast, related products, and no page console errors occur.
- Browser smoke check for `public/cart.html` confirming Phase 3 still supports quantity updates, item removal, subtotal and total updates, checkout prototype behavior, and no page console errors occur.

Remaining next step:

- In the next phase, migrate only the order success page after confirming the checkout-safe flow remains visually aligned with the migrated customer pages.

## Phase 5 Implementation Note

Files modified or created:

- `public/order-success.html`
- `public/js/pages/orderSuccessPage.js`
- `public/css/components.css`
- `docs/migration/design-preview-to-final-plan.md`

What was migrated:

- Migrated the approved Figure 05 order success page into the official `public/order-success.html` page.
- Reused the official storefront CSS files from earlier phases and added only the success-page component styles needed for the confirmation card, success icon, and metric cards.
- Added local static order success behavior for View My Orders prototype feedback, recommended product Add to Cart feedback, cart count updates, and search form prototype feedback.
- Preserved P3 hooks for order success page identity, success card, order summary, recommended products, order ID, delivery estimate, order total, View My Orders action, Continue Shopping action, and recommended product metadata.

What was intentionally not migrated:

- Figures 06 through 10 were not migrated.
- Backend code, Express routes, server files, API calls, and JSON data files were not created or changed.
- The My Orders page was not migrated yet; the View My Orders button shows prototype feedback instead of navigating to an unfinished page.

Checks run:

- JavaScript syntax checks for `public/js/main.js`, `public/js/pages/homePage.js`, `public/js/pages/productDetailPage.js`, `public/js/pages/cartPage.js`, `public/js/pages/checkoutPage.js`, `public/js/pages/orderSuccessPage.js`, and `public/js/templates/productCardTemplate.js`.
- `git diff --check`.
- Static scan for Chinese characters in code and comments.
- Static scan for React, Vue, TypeScript, Tailwind, backend code, Express route patterns, API calls, and `fetch`.
- Browser smoke check for `public/order-success.html` confirming the page loads, success card exists, order ID exists, delivery estimate exists, order summary exists, order total exists, View My Orders prototype action works, Continue Shopping links to `index.html`, three recommended product cards exist, recommended Add to Cart updates the cart count, and no page console errors occur.
- Browser smoke check for `public/index.html` confirming Phase 1 still renders 12 product cards and three recommendation rails.
- Browser smoke check for `public/product-detail.html` confirming Phase 2 still supports quantity changes, Add to Cart toast, Buy Now toast, related products, and no page console errors occur.
- Browser smoke check for `public/cart.html` confirming Phase 3 still supports quantity updates, item removal, subtotal and total updates, checkout prototype behavior, and no page console errors occur.
- Browser smoke check for `public/checkout.html` confirming Phase 4 still supports validation, delivery option updates, payment selection, valid submit prototype behavior, and no page console errors occur.

Remaining next step:

- In the next phase, migrate only the My Orders page after confirming the completed order success flow remains visually aligned with the migrated customer pages.
