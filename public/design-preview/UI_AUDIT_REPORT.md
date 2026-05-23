# ShopLite UI Prototype Audit Report

Audit date: 2026-05-23

Reference source: `public/design-reference/figure-01-original/`

Current prototype source: `public/design-preview/`

Scope: Compare the current Figure 01 to Figure 10 visual prototypes against the original first ShopLite homepage reference. This report does not modify HTML, CSS, or JavaScript.

## Overall Conclusion

The current `public/design-preview/` implementation passes the basic prototype file-structure and technology requirements. All ten figure pages exist, all pages use the shared `css/design-preview.css` and `js/design-preview.js`, and the project stays within plain HTML, CSS, JavaScript, Bootstrap 5, Bootstrap Icons, and Chart.js for the dashboard.

However, `figure-01-home.html` only partially preserves the stronger visual direction of the original homepage reference. The current home page keeps the dark navy header, large search area, category nav, hero copy, benefits strip, filter sidebar, product grid, recommendations, and footer, but it loses several high-impact marketplace details from the original: sticky header behavior, the full carousel hero, real shopping imagery, the hero offer panel, stronger category/data hooks, richer product rendering, dynamic recommendation rails, and the more polished footer grid.

Recommended direction: do not rewrite the whole prototype set. First restore the original Figure 01 visual system into the shared preview CSS and home page, then let Figures 02 to 10 inherit the same tokens, header/footer rhythm, product card language, status badges, table style, and spacing.

## File Structure Checklist

| Required file | Status | Notes |
|---|---|---|
| `public/design-preview/figure-01-home.html` | Pass | Present. |
| `public/design-preview/figure-02-product-detail.html` | Pass | Present. |
| `public/design-preview/figure-03-cart.html` | Pass | Present. |
| `public/design-preview/figure-04-checkout.html` | Pass | Present. |
| `public/design-preview/figure-05-order-success.html` | Pass | Present. |
| `public/design-preview/figure-06-my-orders.html` | Pass | Present. |
| `public/design-preview/figure-07-auth.html` | Pass | Present. |
| `public/design-preview/figure-08-admin-products.html` | Pass | Present. |
| `public/design-preview/figure-09-admin-orders.html` | Pass | Present. |
| `public/design-preview/figure-10-admin-dashboard.html` | Pass | Present. |
| `public/design-preview/css/design-preview.css` | Pass | Present and shared. |
| `public/design-preview/js/design-preview.js` | Pass | Present and shared. |
| `public/design-preview/assets/images/placeholder-product.svg` | Pass | Present. |
| `public/design-preview/assets/images/placeholder-banner.svg` | Pass | Present. |
| `public/design-reference/figure-01-original/index.html` | Pass | Reference copy exists. |
| `public/design-reference/figure-01-original/styles.css` | Pass | Reference copy exists. |
| `public/design-reference/figure-01-original/script.js` | Pass | Reference copy exists. |

## Technology Checklist

| Requirement | Status | Notes |
|---|---|---|
| HTML, CSS, JavaScript only | Pass | No React, Vue, TypeScript, Tailwind, build tool, Express, or backend code found in preview files. |
| Bootstrap 5 CDN | Pass | All pages link Bootstrap 5.3.3. |
| Bootstrap Icons CDN | Pass | All pages link Bootstrap Icons. |
| Shared CSS | Pass | All pages link `css/design-preview.css`. |
| Shared JavaScript | Pass | All pages link `js/design-preview.js`. |
| Chart.js only where needed | Pass | Only Figure 10 loads Chart.js. |
| English-only code/content identifiers | Pass | No Chinese characters were found in `public/design-preview/`. |

## Reference Comparison Checklist

| Element | Original reference | Current design-preview | Status |
|---|---|---|---|
| Topbar layout | Sticky `.site-header sticky-top`, `.topbar`, delivery chip, central search, account links, cart button with ID and aria count. | `.shoplite-topbar` matches dark navy and general layout, but is not sticky and uses simpler link markup with fewer stable IDs. | Partial |
| Logo scale | 26px brand text and 40px `SL` brand box. | 24px brand text and 38px brand tile. Still good, slightly reduced. | Partial |
| Search bar size | Grid `150px minmax(240px, 1fr) 54px`; full selector values for all main categories; IDs for JS. | Grid `145px minmax(260px, 1fr) 54px`; home selector only includes All, Electronics, Fashion, Home; no `searchForm`, `categorySelect`, or `searchInput` IDs. | Partial |
| Category navigation | `.subnav` with Electronics, Fashion, Home, Beauty, Grocery, Sports, Deals, Fast Shipping, Gift Cards, and `data-category-link` hooks. | `.category-nav` with seven main category links only; no Fast Shipping/Gift Cards and no data hooks. | Partial |
| Hero section | Bootstrap carousel with three promo slides, large photo backgrounds, overlay gradient, controls, indicators. | Single static `.hero-banner` using `placeholder-banner.svg`; no carousel controls or slide variety. | Fail |
| Hero typography | 58px heavyweight headline, uppercase orange eyebrow, 18px support copy, dedicated `.hero-cta`. | 56px headline, similar copy hierarchy, but less dramatic because the hero container is flatter. | Partial |
| Hero offer panel | Glassy `.hero-offer-panel` with strong discount value such as `35% off`. | Missing. | Fail |
| Benefits strip | `.quick-strip` overlaps hero with four dense benefit cards; first card says `Fast local delivery`. | Similar overlap and card layout, but renamed `.benefit-strip`, weaker copy, and uses Bootstrap rows instead of the original grid. | Partial |
| Filter sidebar | Sticky filter with clear button ID, category values/classes, price value ID, rating classes, and a small `Student project note` card. | Sticky filter exists, but lacks stable filter classes/values/IDs, omits Sports in the checkbox list, and removes the helper note card. | Partial |
| Product cards | JS-rendered 12-item grid with real marketplace images, half-star support, `data-product-id`, current/old price classes, shipping info, and fallback images. | Static 8-card grid with placeholder SVGs, all full stars, generic `data-action`, and no data-driven rendering hooks. | Partial fail |
| Recommendation sections | JS-rendered rails for Best Sellers, Today's Deals, Recommended for You; includes `.recommendation-rail` and `.deal-band`. | Static mini-card rows; Today's Deals is a single inline-styled band and no product rail. | Partial fail |
| Footer | `.site-footer` with footer grid, brand block, description, and nav. | Simpler `.footer`; only Figure 01 and Figure 02 include a footer. | Partial |
| JavaScript behavior | Home-specific product array, filtering, sorting, category navigation, cart count update, rendered rails, image fallback. | Shared generic interactions only: toast, quantity controls, form messages, admin status updates, dashboard charts. | Partial fail |

## CSS Variables and Component Style Drift

| Area | Original reference | Current preview | Audit note |
|---|---|---|---|
| Token names | `--navy-950`, `--orange-500`, `--shadow-sm`, `--radius`. | `--sl-navy-950`, `--sl-orange`, `--sl-shadow`, `--sl-radius`. | Prefixing is fine for shared prototype scope, but the mapping should be documented and consistently used. |
| Navy tone | `--navy-850: #162238`. | `--sl-navy-850: #172033`. | Slight drift, not harmful, but makes the category bar subtly different. |
| Orange hover | `--orange-600: #ea7a00`. | `--sl-orange-dark: #d97706`. | Current hover is browner/darker. Restore the brighter original if the goal is closer reference fidelity. |
| Shadows | `0 8px 18px` and `0 16px 34px`. | `0 10px 24px` and `0 18px 42px`. | Current shadows are stronger and broader. They still look professional but slightly heavier. |
| Header classes | `.site-header`, `.topbar`, `.brand-mark`, `.brand-box`, `.delivery-chip`, `.account-link`, `.cart-button`. | `.shoplite-topbar`, `.shoplite-brand`, `.brand-tile`, `.location-chip`, `.header-action`, `.cart-link`. | Rename is acceptable, but the current implementation lost sticky header and several IDs/hooks. |
| Hero classes | `.hero-section`, `.hero-slide`, `.hero-slide-tech`, `.hero-offer-panel`, `.hero-cta`. | `.hero-banner`, `.hero-copy`, `.btn-accent`. | This is the largest visual drift. The current CSS no longer contains the slide/photo/offer-panel system. |
| Benefits classes | `.quick-strip`, `.quick-strip-grid`. | `.benefit-strip`, `.benefit-card`. | Similar layout, but original grid and copy should be restored for Figure 01. |
| Marketplace shell | `.marketplace-shell`, `.section-toolbar`, `.toolbar-controls`. | `.section-space`, Bootstrap utility flex blocks, `.eyebrow`, `.section-heading`. | Current is simpler but less reusable for future data-rendered lists. |
| Product cards | `.review-count`, `.current-price`, `.shipping-info`, `.add-cart-btn`. | `.review-link`, `.price`, `.shipping-note`, `.add-cart-button`. | Current names are usable, but Figure 01 should have stable card hooks for later rendering. |
| Recommendation components | `.recommendation-rail`, `.deal-band`. | Mostly absent in current CSS; Figure 01 uses row grids and inline style. | Restore shared recommendation rail and deal band classes. |
| Footer classes | `.site-footer`, `.footer-grid`, `.footer-brand`. | `.footer`. | The current footer is functional but less polished and less reusable. |

## Visual Drift From Original Homepage

1. The home page changed from a photo-driven promotional carousel into a single static placeholder banner. This is the main reason the current Figure 01 feels weaker.
2. The original hero offer panel was removed. That panel created a clear commercial shopping moment and should be restored.
3. The original header was sticky and had stronger accessibility/data hooks. The current header looks similar but is more static.
4. The original category navigation included extra marketplace utility links and `data-category-link` behavior. The current nav is visually simpler and less useful for final integration.
5. The original product grid was data-driven with richer product imagery. The current cards are static and all use the same placeholder image.
6. The original recommendations were horizontal rails rendered from product data. The current sections are static Bootstrap rows.
7. The original Today Deals section had a reusable `.deal-band` plus a rail. The current page uses inline CSS for the deal band and no deal product rail.
8. The original filter sidebar had working classes/IDs for category, rating, price, and clear behavior. The current filter is visual only.
9. The original footer had a more complete brand/content grid. The current footer is simpler and does not appear on Figures 03 to 07.
10. Several current customer pages inherit the dark topbar but not the full marketplace chrome, so they feel like separate screens rather than one coherent mall experience.

## Per-Page Review

### Figure 01 - Home / Product Listing

Status: Partial pass, but visually weaker than the original reference.

The page contains the requested marketplace structure: dark header, search, category nav, hero, benefits strip, filter sidebar, four-column product grid, recommendations, and footer. It also preserves the phrases `Weekend marketplace event`, `Upgrade your everyday essentials for less`, `Shop featured deals`, and `Marketplace picks`.

Required restoration:

- Restore the original carousel-based hero with three slides, photo backgrounds, controls, indicators, overlay gradient, and offer panel.
- Restore stronger marketplace category behavior: Fast Shipping/Gift Cards links and `data-category-link` hooks.
- Restore full category selector options and search IDs.
- Restore the filter sidebar hooks: `clearFilters`, `category-filter`, `rating-filter`, `priceRange`, `priceValue`.
- Restore 12 product cards or data-driven rendering with richer images and stable `data-product-id`.
- Restore recommendation rails and remove inline CSS from the Today's Deals band.
- Restore the more polished original footer structure.

### Figure 02 - Product Detail

Status: Good structural pass.

The page uses the customer topbar, category nav, breadcrumb, product gallery, product information, rating, price, discount, stock, shipping, quantity selector, Add to Cart, Buy Now, highlights, specifications, review summary, related products, and footer.

Inheritance needed:

- Keep its product-detail layout, but align product imagery, star rows, buttons, price styling, and related-product cards with the restored Figure 01 product-card system.
- Keep category nav and footer, but update them to match the restored original header/footer components.
- Add more stable product hooks later, such as product ID, selected image, selected quantity, and related product IDs.

### Figure 03 - Cart

Status: Functional visual prototype, but weaker marketplace continuity.

The page includes cart items, images, item titles, unit prices, selected checkboxes, quantity controls, delete buttons, summary card, subtotal, shipping estimate, checkout button, and empty cart state.

Inheritance needed:

- Add the restored category nav and footer for customer-page continuity.
- Align cart thumbnails, summary card, price treatment, and checkout CTA with the restored product-card/marketplace system.
- Add stable data hooks for cart item IDs, selected state, delete buttons, line totals, subtotal, shipping, and total.

### Figure 04 - Checkout

Status: Good course-project prototype.

The page includes shipping address form, contact phone input, delivery options, mock payment section, order summary, item list, total amount, place-order button, and validation message target.

Inheritance needed:

- Add the restored category nav or a lighter checkout-safe header variant that still feels like ShopLite.
- Add footer to match customer pages.
- Keep the form layout, but add stable IDs/name attributes for final validation and backend integration.
- Avoid nested `.surface-card` labels if the restored style system introduces a dedicated selectable-option component.

### Figure 05 - Order Success

Status: Good content coverage, but visually isolated.

The page includes confirmation card, order number, delivery estimate, payment status, order summary, View My Orders, Continue Shopping, and recommended products.

Inheritance needed:

- Add restored category nav and footer.
- Replace inline success icon sizing with a reusable success-icon class.
- Make recommended products use the restored mini-card or recommendation-rail pattern.
- Add stable order number, delivery estimate, and total fields for final rendering.

### Figure 06 - My Orders

Status: Good customer account prototype.

The page includes order tabs, search, order cards, status badges, thumbnails, totals, View Details, and Reorder buttons.

Inheritance needed:

- Add restored category nav and footer.
- Keep status badge classes, but confirm all order status colors match the final order-management badges.
- Add stable data hooks for order ID, status tab, search form, detail buttons, and reorder buttons.
- Reuse the restored product thumbnail/card language from Figure 01.

### Figure 07 - Login / Register

Status: Good combined auth prototype.

The page includes ShopLite branding, login card, register card, form fields, role hints, validation message targets, and a centered auth layout.

Inheritance needed:

- The auth background currently uses the placeholder banner. Use the restored original visual direction more deliberately, either with the original marketplace photo treatment or a cleaner navy/orange auth pattern.
- Keep the simplified auth header, but align brand scale and button styling with the restored header tokens.
- Add stable IDs/name attributes for email, password, role, and account type fields later.

### Figure 08 - Admin Product Management

Status: Good admin prototype.

The page includes admin sidebar, navigation, product table, thumbnails, categories, price, stock, status, edit/delete buttons, add product button, search/filter controls, and modal form.

Inheritance needed:

- Keep admin layout distinct, but use the same ShopLite token values for navy, orange, shadows, radius, status badges, and table surfaces.
- Consider adding a compact admin topbar or breadcrumb for consistency with the storefront hierarchy.
- Add stable data hooks for product rows, product IDs, edit/delete buttons, modal fields, search, filters, and status.

### Figure 09 - Admin Order Management

Status: Good admin prototype with useful interaction.

The page includes admin navigation, order table, order ID, customer, item count, total, status badges, filters, date input, update-status dropdowns, view details buttons, and an offcanvas detail panel.

Inheritance needed:

- Keep the current status update interaction.
- Align status colors with customer order badges and dashboard recent orders.
- Add stable data hooks for order rows, detail buttons, filters, date, and offcanvas data fields.
- Make the offcanvas detail panel visually match the shared card/table density.

### Figure 10 - Admin Dashboard

Status: Good dashboard prototype.

The page includes admin sidebar, statistic cards, total sales, total orders, active products, registered users, two Chart.js canvases, best-selling products table, and recent orders list.

Inheritance needed:

- Keep Chart.js placeholders, but tune chart/card spacing to the same shadow/radius system restored from the original reference.
- Add stable IDs for statistic cards and table/list containers for final data rendering.
- Consider giving dashboard cards the same commercial orange accents used in the storefront without making the admin UI too decorative.

## Required Fixes

| Priority | Fix | Reason |
|---|---|---|
| P1 | Restore the original Figure 01 hero system. | The carousel, real imagery, overlay, and offer panel are the biggest missing pieces of the original visual direction. |
| P1 | Restore the original marketplace header behavior and hooks. | Sticky header, full search IDs, cart count ID, full category selector, and category nav hooks will help both visual polish and later integration. |
| P1 | Restore richer product and recommendation presentation. | Current placeholder-only static cards reduce the commercial shopping feeling. |
| P2 | Move inline styling into shared CSS. | The current Today's Deals band uses inline CSS and should become a reusable component. |
| P2 | Reconcile CSS tokens with the original reference. | Prefixes are fine, but color/shadow/component drift should be intentional and consistent. |
| P2 | Add category nav and footer consistency to Figures 03 to 07. | Customer pages should feel like one shopping flow. |
| P2 | Restore filter sidebar data hooks. | Future rendering and filtering will be easier if the prototype keeps stable IDs/classes. |
| P3 | Add stable data hooks across carts, orders, checkout, admin tables, and dashboard widgets. | This reduces integration risk when the static prototype becomes dynamic. |
| P3 | Replace repeated placeholder-only product imagery where visual fidelity matters. | The course project will look more realistic if product cards and hero areas show distinct items. |
| P3 | Standardize admin table/card density. | Admin pages already work, but they should inherit the same token system without copying storefront chrome. |

## Priority Order for Fixes

1. Update `figure-01-home.html` and `design-preview.css` to restore the original reference hero, offer panel, marketplace section toolbar, filter card, deal band, recommendation rail, and footer structure.
2. Update Figure 01 product cards to use either the original data-rendered pattern or static markup with equivalent visual richness and stable data attributes.
3. Reconcile shared CSS tokens so `--sl-*` values intentionally mirror the original `--navy-*`, `--orange-*`, shadow, and radius system.
4. Standardize customer-page chrome for Figures 02 to 07: restored topbar, optional category nav, and footer where appropriate.
5. Add stable IDs and `data-*` hooks for later final-project integration without adding backend code.
6. Apply the restored product-card, mini-card, badge, table, and summary-card rules to Figures 02 to 10.
7. Keep admin pages as admin layouts, but ensure they inherit the same ShopLite color, shadow, radius, spacing, and status-badge system.

## Final Audit Note

The current prototype is a solid static course-project baseline, but Figure 01 should be treated as the visual source of truth after restoration from `public/design-reference/figure-01-original/`. Once Figure 01 regains the original marketplace strength, the remaining pages should inherit its shared visual system while keeping their own page-specific layouts.

## P1 Fix Summary

Files modified:

- `public/design-preview/figure-01-home.html`
- `public/design-preview/css/design-preview.css`
- `public/design-preview/js/design-preview.js`
- `public/design-preview/UI_AUDIT_REPORT.md`

Original visual details restored:

- Restored a sticky marketplace header for Figure 01 with stronger ShopLite logo scale, delivery chip, full search form IDs (`searchForm`, `categorySelect`, `searchInput`), cart IDs (`cartButton`, `cartCount`), and category navigation links for Electronics, Fashion, Home, Beauty, Grocery, Sports, Deals, Fast Shipping, and Gift Cards.
- Restored the carousel-based hero with three promotional slides, rich marketplace background imagery, dark overlay gradient, large commercial headline, orange eyebrow text, hero CTA buttons, carousel controls, carousel indicators, and glass-style offer panels.
- Restored a richer marketplace product grid driven by shared JavaScript with 12 products, real product images, category labels, titles, star ratings, review counts, current prices, old prices, shipping notes, discount tags, Add to Cart buttons, and stable `data-product-id` hooks.
- Restored filter sidebar integration hooks: `clearFilters`, `category-filter`, `rating-filter`, `priceRange`, `priceValue`, `resultCount`, and `sortSelect`.
- Restored recommendation sections for Best Sellers, Today's Deals, and Recommended for You using reusable `recommendation-rail` and `deal-band` styles, with inline deal-band CSS removed.
- Restored the more polished footer direction with a brand block, description, footer navigation, and reusable `footer-grid` styling.

Remaining P2/P3 issues:

- Figures 03 to 07 still need customer-page category nav and footer consistency.
- Static customer/admin pages still need more stable IDs and `data-*` hooks for final dynamic rendering.
- Admin table/card density still needs a later consistency pass against the restored token system.
- Some non-home pages still use placeholder-only imagery, which can be improved in a later P2/P3 pass.

Figure 01 visual source of truth:

- Yes. After the P1 restoration, `figure-01-home.html` should now be treated as the visual source of truth for Figures 02 to 10. Later work should inherit its restored header, color tokens, product-card language, recommendation rail style, footer system, shadows, radius, spacing, and marketplace tone while preserving each page's own layout.
