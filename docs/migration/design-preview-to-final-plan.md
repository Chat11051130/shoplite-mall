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
