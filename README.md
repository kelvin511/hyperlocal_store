# Hyperlocal Grocery Marketplace

A multi-vendor hyperlocal grocery marketplace built on MedusaJS v2. Customers pick a store near them and order from it. Store owners (vendors) manage their own catalog, stock and orders in a dedicated panel. Platform admins approve and manage vendors in the Medusa Admin.

## Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Local setup](#local-setup)
4. [Environment variables](#environment-variables)
5. [Database, migrations and seed data](#database-migrations-and-seed-data)
6. [Application URLs](#application-urls)
7. [API documentation](#api-documentation)
8. [Domain model](#domain-model)
9. [MedusaJS customisations](#medusajs-customisations)
10. [Answers to the design questions](#answers-to-the-design-questions)
11. [Assumptions](#assumptions)
12. [Design decisions and trade-offs](#design-decisions-and-trade-offs)
13. [Known limitations](#known-limitations)
14. [Testing](#testing)
15. [Deployment](#deployment)

## Overview

| Actor | Where | What they can do |
| --- | --- | --- |
| Customer | Storefront (Next.js) | Browse nearby stores, view a store's products, set or edit their location, cart, checkout, order history |
| Vendor (store owner) | Vendor panel (React Router) | Register, manage the store profile, create and edit products with price, image, stock and availability, view orders that contain their products |
| Platform admin | Medusa Admin (extended) | View all vendors, approve, reject, disable and re-enable them, create and edit vendors, see which vendor owns a product or order, view all orders (built into Medusa) |

Key flows:

- **Vendor onboarding:** a vendor registers (status `pending`), an admin approves it, then the vendor can sign in and manage products. A pending, rejected or disabled vendor can sign in but sees only a status notice and cannot use the vendor APIs.
- **Browsing:** the storefront home page lists approved stores, nearest first when the customer has a location. Products are only reachable through a store.
- **Ordering:** standard Medusa cart and checkout. When an order is placed it is linked to every vendor that has items in it.

## Architecture

Turborepo monorepo managed with Yarn 4 workspaces.

```
apps/
  backend/   Medusa v2 application (@dtc/backend): custom marketplace module, workflows,
             API routes, subscribers, admin dashboard extensions, seed scripts
  vendor/    Vendor panel: React Router 7 (SSR) + shadcn/ui + Tailwind 4 + zustand
  store/     Customer storefront: Medusa's official Next.js starter, extended
```

```
                 +-----------------+      +---------------------+
 Customer ------>| Storefront      |----->|                     |
                 | Next.js :8000   |      |   Medusa backend    |
                 +-----------------+      |   :9000             |      +------------+
                 +-----------------+      |   - core modules    |----->| PostgreSQL |
 Vendor -------->| Vendor panel    |----->|   - marketplace     |      +------------+
                 | React Router    |      |     module + links  |
                 +-----------------+      |   - workflows/hooks |
                 +-----------------+      |   - subscribers     |
 Admin --------->| Medusa Admin    |----->|   - /store /vendor  |
                 | (served at /app)|      |     /admin routes   |
                 +-----------------+      +---------------------+
```

Backend layering follows Medusa's convention: API routes validate input (Zod middlewares) and run a workflow; workflows compose steps and own rollback; the marketplace module holds the data models and CRUD service.

```
apps/backend/src
  modules/marketplace/   Vendor and VendorAdmin models, service, migrations, status rules
  links/                 vendor <-> product, vendor <-> order
  workflows/
    marketplace/         create/update/delete vendor, vendor status, product, stock, order linking
    customer/            update customer location
    hooks/               cart validation hooks (add to cart, complete cart)
  api/
    vendor/              authenticated vendor API (store, products, orders)
    admin/               vendor management, product/order vendor lookups
    store/               public vendor listing, customer location
  subscribers/           order.placed -> link order to vendors
  admin/                 dashboard widgets and pages
  scripts/               seed-marketplace-test-data.ts
  utils/                 geo (haversine), number helpers
```

## Local setup

Prerequisites: Node `^20.19 || >=22.12`, Yarn 4 (`corepack enable`), PostgreSQL 15+.

```bash
# 1. Install dependencies (one lockfile at the repo root)
yarn install

# 2. Create the database
createdb medusa-backend            # or create it with any Postgres client

# 3. Configure the backend
cp apps/backend/.env.template apps/backend/.env
# edit apps/backend/.env and set DATABASE_URL, for example
# DATABASE_URL=postgres://postgres:postgres@localhost:5432/medusa-backend

# 4. Run migrations (also seeds Medusa's initial store data, see below)
cd apps/backend
yarn medusa db:migrate

# 5. Create a Medusa admin user
yarn medusa user -e admin@example.com -p <choose-a-password>
```

6. Start the backend once (`yarn backend:dev` from the repo root) and sign in to the Medusa Admin at http://localhost:9000/app.
7. Create an **India region**: Settings, Regions, Create. Use currency INR, country India, and the `pp_system_default` payment provider. The seed script needs this region to exist.
8. Seed marketplace test data (optional but recommended): `yarn backend:seed` from the repo root (or `yarn seed:test-data` inside `apps/backend`).
9. Copy the publishable key into the storefront: Settings, Publishable API Keys, copy the default key, then
   ```bash
   cp apps/store/.env.template apps/store/.env.local
   # set NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY and NEXT_PUBLIC_DEFAULT_REGION=in
   ```
10. Start all servers in one go (see below).

### Start all servers with one command

The repository is a Turborepo monorepo, so one command from the repo root starts the backend with the Medusa Admin, the vendor panel and the storefront together:

```bash
yarn dev
```

Turbo runs the `dev` script of every app in parallel and prefixes each log line with its app name (`@dtc/backend:dev`, `vendor:dev`, `store:dev`). `Ctrl+C` stops all of them. The storefront and vendor panel talk to the backend, so if either shows a connection error in the first few seconds, wait for the backend log to say the server is ready and refresh.

To run only one app:

```bash
yarn backend:dev     # Medusa backend and admin, http://localhost:9000
yarn vendor:dev      # vendor panel
yarn store:dev       # storefront, http://localhost:8000
```

## Environment variables

### Backend (`apps/backend/.env`)

| Variable | Purpose | Example |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@localhost:5432/medusa-backend` |
| `STORE_CORS` | Allowed storefront origins | `http://localhost:8000` |
| `ADMIN_CORS` | Allowed admin origins | `http://localhost:9000` |
| `AUTH_CORS` | Allowed origins for auth routes | `http://localhost:9000` |
| `JWT_SECRET` | Signs auth tokens | long random string in production |
| `COOKIE_SECRET` | Signs session cookies | long random string in production |
| `REDIS_URL` | Redis (event bus, workflow engine, cache) | unset in development: an in-memory fake is used |
| `DB_NAME` | Database name used by Medusa CLI helpers | `medusa-backend` |

### Vendor panel (environment of `apps/vendor`)

| Variable | Purpose | Default |
| --- | --- | --- |
| `BACKEND_URL` | Medusa backend base URL (used server-side) | `http://localhost:9000` |
| `SESSION_SECRET` | Signs the vendor session cookie | `dev-only-secret` (change in production) |

### Storefront (`apps/store/.env.local`)

| Variable | Purpose | Example |
| --- | --- | --- |
| `MEDUSA_BACKEND_URL` | Medusa backend base URL | `http://localhost:9000` |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | Publishable API key linked to the sales channel | `pk_...` |
| `NEXT_PUBLIC_BASE_URL` | Public URL of the storefront | `http://localhost:8000` |
| `NEXT_PUBLIC_DEFAULT_REGION` | Default country code, must belong to a region | `in` |
| `REVALIDATE_SECRET` | Next.js on-demand revalidation | change in production |

Never commit `.env` or `.env.local`.

## Database, migrations and seed data

- **Database:** PostgreSQL. The marketplace module owns two tables, `vendor` and `vendor_admin`. Two link tables, `marketplace_vendor_product_product` and `marketplace_vendor_order_order`, connect them to Medusa's product and order modules.
- **Migrations:** `cd apps/backend && yarn medusa db:migrate` runs all module migrations, syncs links and runs migration scripts. Marketplace migrations live in `src/modules/marketplace/migrations/`. After changing a model run `yarn medusa db:generate marketplace`. Never edit a migration that has already run.
- **Initial data:** `src/migration-scripts/initial-data-seed.ts` is a Medusa migration script. It runs once during `db:migrate` and creates the starter store, a Europe region, the default sales channel, a publishable key, shipping options and sample apparel products.
- **Marketplace test data:** `yarn backend:seed` from the repo root (same as `yarn seed:test-data` in `apps/backend`). It is idempotent. It:
  - makes INR the default store currency,
  - adds an India service zone with Standard Delivery (40 INR) and Express Delivery (99 INR), if an India region exists,
  - creates 5 approved vendors around Ahmedabad and Mumbai plus one pending and one disabled vendor,
  - creates 3 to 5 grocery products per approved vendor with INR prices and varied stock (some 0 or low),
  - gives every untracked product a default stock of 100,
  - creates a test customer with a saved location.

  Seeded accounts all use the password `admin@123`. This is for local development only.

  | Account | Role |
  | --- | --- |
  | `vendor1@example.com` to `vendor5@example.com` | approved vendors |
  | `pending@example.com` | pending vendor (to test approval) |
  | `disabled@example.com` | disabled vendor |
  | `customer@example.com` | storefront customer |

## Application URLs

| URL | What |
| --- | --- |
| http://localhost:9000 | Medusa backend API |
| http://localhost:9000/app | Medusa Admin (with the Vendors pages and widgets) |
| http://localhost:9000/health | Health check |
| http://localhost:5173 | Vendor panel (React Router dev server default port) |
| http://localhost:5173/register | Vendor registration |
| http://localhost:5173/login | Vendor login |
| http://localhost:5173/products, `/orders`, `/store` | Vendor catalog, orders, store settings |
| http://localhost:8000/in | Storefront home: stores near you |
| http://localhost:8000/in/stores | Store list with radius filter |
| http://localhost:8000/in/stores/{handle} | A store and its products |
| http://localhost:8000/in/products/{handle} | Product page with add to cart |
| http://localhost:8000/in/cart, `/in/checkout`, `/in/account` | Cart, checkout, customer account |

Medusa Admin pages added by this project: **Vendors** (list, create, detail, approve, reject, disable), **Products, By vendor** (vendor column and filter), a **Vendor** widget on the product page and a **Vendors** widget on the order page.

## API documentation

There is no generated OpenAPI file. All custom endpoints are listed here. Standard Medusa endpoints (carts, checkout, orders and so on) are documented at https://docs.medusajs.com/api/store and https://docs.medusajs.com/api/admin.

Authentication: Admin routes use the Medusa admin session or bearer token. Vendor routes use a bearer token obtained from `POST /auth/vendor/emailpass` (actor type `vendor`). Customer routes use `POST /auth/customer/emailpass`. Store routes also need the `x-publishable-api-key` header. Emails must be lowercase.

### Vendor API (actor type `vendor`)

| Method and path | Description |
| --- | --- |
| `POST /vendor/register` | Register a vendor and its first admin. Body: `name`, `handle`, `latitude`, `longitude`, `logo?`, `admin: { email, password, first_name?, last_name? }`. Creates the vendor as `pending`. Public. |
| `POST /auth/vendor/emailpass` | Sign in. Body: `email`, `password`. Returns `{ token }`. |
| `GET /vendor/me` | The signed-in vendor admin and their vendor, including `status`. Works for any status. |
| `GET /vendor/store` | The signed-in vendor's store (profile, location). |
| `PATCH /vendor/store` | Update `name`, `handle`, `logo`, `latitude`, `longitude`. |
| `DELETE /vendor/store` | Soft-delete the store and its admins. |
| `GET /vendor/product` | List own products. Query: `limit`, `offset`. Includes `price`, `currency_code`, `stock`, `available`. |
| `POST /vendor/product` | Create. Body: `title`, `price`, `stock` (integer, default 0), `available` (default true), `thumbnail?` (URL). |
| `GET /vendor/product/:id` | One own product. 404 for other vendors' products. |
| `PATCH /vendor/product/:id` | Update any of `title`, `thumbnail`, `price`, `stock`, `available`. |
| `DELETE /vendor/product/:id` | Soft-delete. |
| `GET /vendor/order` | Orders containing own products. Only own items are returned. Query: `limit`, `offset`. |
| `GET /vendor/order/:id` | One order with delivery details. 404 if the order has none of this vendor's items. |

All `/vendor/*` routes except `register` require a valid vendor token. All except `/vendor/me` also require the vendor to be `approved`.

### Admin API

| Method and path | Description |
| --- | --- |
| `GET /admin/vendors` | List vendors. Query: `q`, `status`, `limit`, `offset`. |
| `POST /admin/vendors` | Create an approved vendor with its first admin (same body as register). |
| `GET /admin/vendors/:id` | Vendor with admins and product count. |
| `POST /admin/vendors/:id` | Update vendor fields. |
| `DELETE /admin/vendors/:id` | Soft-delete the vendor and its admins. |
| `POST /admin/vendors/:id/status` | Body `{ "status": "approved" \| "rejected" \| "disabled" }`. Allowed transitions: pending to approved or rejected, approved to disabled, rejected or disabled to approved. |
| `GET /admin/vendor-products` | Products with their vendor. Query: `vendor_id`, `q`, `limit`, `offset`. |
| `GET /admin/products/:id/vendor` | The vendor of a product. |
| `GET /admin/orders/:id/vendors` | Vendors on an order with their items and subtotals. |

### Store API (public, publishable key)

| Method and path | Description |
| --- | --- |
| `GET /store/vendors` | Approved stores. Query: `latitude`, `longitude`, `radius_km`, `limit`, `offset`. With coordinates, results include `distance_km` and are sorted nearest first. |
| `GET /store/vendors/:handle` | One approved store (`distance_km` when coordinates are passed). |
| `GET /store/vendors/:handle/products` | Product ids of the store's published products (the storefront then loads priced products through Medusa's product API). |
| `GET /store/customers/me/location` | The signed-in customer's saved location. |
| `POST /store/customers/me/location` | Save `{ latitude, longitude, address? }` to the customer's metadata. |
| `DELETE /store/customers/me/location` | Clear it. |

## Domain model

```mermaid
erDiagram
    VENDOR ||--o{ VENDOR_ADMIN : "has"
    VENDOR ||--o{ PRODUCT : "sells (link)"
    VENDOR }o--o{ ORDER : "fulfils items of (link)"
    PRODUCT ||--|{ VARIANT : "has"
    VARIANT ||--o| INVENTORY_ITEM : "tracks stock"
    INVENTORY_ITEM ||--o{ INVENTORY_LEVEL : "per stock location"
    CUSTOMER ||--o{ ORDER : "places"
    CUSTOMER {
        json metadata "metadata.location = latitude, longitude, address"
    }
    VENDOR {
        text id PK
        text handle UK
        text name
        text logo
        float latitude
        float longitude
        enum status "pending, approved, rejected, disabled"
    }
    VENDOR_ADMIN {
        text id PK
        text email UK
        text first_name
        text last_name
        text vendor_id FK
    }
```

- `vendor` and `vendor_admin` are the only custom tables. Both are soft-deletable.
- Everything else (products, variants, prices, inventory, carts, orders, customers) is Medusa's own data model. Vendors connect to it only through two Medusa module links, so the marketplace module has no direct dependency on other modules.
- A vendor admin's login is a Medusa auth identity (`emailpass`) whose `app_metadata.vendor_id` holds the vendor admin id, which makes `vendor` a custom actor type.
- Product price lives on the product's single default variant; availability maps to product status (`published` is available, `draft` is unavailable); stock is the inventory level at the default stock location.

## MedusaJS customisations

| Area | What was added |
| --- | --- |
| Custom module | `marketplace` module with `Vendor` and `VendorAdmin` models, a service and migrations |
| Module links | `vendor <-> product` and `vendor <-> order` in `src/links/` |
| Custom auth actor | `vendor` actor type using the `emailpass` provider |
| Workflows | `create-vendor`, `update-vendor`, `delete-vendor`, `update-vendor-status`, `create-vendor-product`, `update-vendor-product`, `delete-vendor-product`, `set-variant-stock`, `link-order-to-vendors`, `update-customer-location` |
| Workflow hooks | `addToCartWorkflow.hooks.validate` and `completeCartWorkflow.hooks.validate` in `src/workflows/hooks/validate-cart-vendors.ts` |
| Subscriber | `order.placed` links the order to its vendors |
| API routes | `/vendor/*`, `/admin/vendors*`, `/admin/vendor-products`, `/admin/products/:id/vendor`, `/admin/orders/:id/vendors`, `/store/vendors*`, `/store/customers/me/location` |
| Middlewares | Vendor authentication, Zod body validation (`src/api/middlewares.ts`) |
| Admin dashboard | Vendors list and detail pages, Products by vendor page, Vendor widget on products, Vendors widget on orders |
| Scripts | `seed-marketplace-test-data.ts` |
| Storefront | Stores-first home page, `/stores` and `/stores/[handle]`, location picker with manual coordinates, out-of-stock and no-price handling on the add to cart button, development cache bypass |
| Vendor panel | Separate React Router app (login, register, store settings, products, orders) |

## Answers to the design questions

### 1. Why did you model vendors and shops the way you did?

A vendor and its shop are one entity. The `vendor` row is the business account and the shop at once: name, handle, logo, one location and one approval status. `vendor_admin` rows are the people who can log in for that vendor.

For hyperlocal grocery each vendor is one physical store at one location, and every customer-facing query is "stores near me", so keeping location on the same row avoids a join on the hottest query and keeps ownership checks to a single hop. The cost is that a vendor with several branches cannot be represented. If that is needed, split into `vendor` (account, status, payouts) and `shop` (name, handle, location, stock location), link products and orders to the shop, and keep the vendor as the owner. Nothing in the API surface above would need to change shape for customers.

### 2. How is vendor ownership enforced?

- Every `/vendor/*` route (except register) is behind `authenticate("vendor", ["session", "bearer"])`, applied by a path rule in `src/api/middlewares.ts`, so the actor is a vendor admin.
- The vendor id is never read from the URL or body. `getAuthenticatedVendorId` in `src/api/vendor/helpers.ts` resolves it from the token (vendor admin, then vendor) and also requires `status === "approved"`.
- Products: `getVendorProduct` looks the product up among the vendor's linked products (vendor to products query). A product that is not in that set returns 404, so product ids of other vendors are indistinguishable from missing ones.
- Orders: `getVendorOrder` checks that the order id is in the vendor's linked orders, and only items whose product belongs to the vendor are returned.
- Updates and deletes run through workflows that receive the resolved id.

### 3. How does a product belong to a shop?

Through a Medusa module link, `src/links/vendor-product.ts`, which stores `(vendor_id, product_id)` pairs in `marketplace_vendor_product_product`. The `create-vendor-product` workflow creates the product with Medusa's `createProductsWorkflow` and then creates the link with `createRemoteLinkStep`. Deleting a product dismisses the link first. Products are read through the link in both directions (`vendor.products` and `product.vendor`).

### 4. How does an order belong to a vendor?

Through the second link, `src/links/vendor-orders.ts` (`marketplace_vendor_order_order`). When Medusa emits `order.placed`, `src/subscribers/order-placed.ts` runs the `link-order-to-vendors` workflow. It reads the order's items, resolves each item's product to its vendor, and creates one link per distinct vendor that is not already linked, so re-delivery of the event is safe. An order whose items come from two stores is linked to both vendors, and each vendor sees only its own items. Order totals, payment and fulfilment remain on the single Medusa order.

### 5. Where is the single-shop-cart invariant enforced?

**It is not enforced.** The storefront steers customers to one store at a time (stores first, then that store's products), but the backend accepts a cart with products from several stores, and the order linking above supports that. If a strict single-shop cart is required, the place to add it is `addToCartWorkflow.hooks.validate` in `src/workflows/hooks/validate-cart-vendors.ts`: resolve the vendors of the items already in the cart and the items being added, and throw a `MedusaError` when more than one vendor results. The same check belongs in the `completeCartWorkflow` hook as a second line of defence. This is listed under [Known limitations](#known-limitations).

### 6. Where is checkout validation performed?

- **Marketplace rules:** `src/workflows/hooks/validate-cart-vendors.ts` registers a `validate` hook on both `addToCartWorkflow` and `completeCartWorkflow`. Both call `assertVendorsAvailable`, which rejects any product whose vendor is not `approved` ("Products from X are currently unavailable"). The complete-cart hook re-checks the whole cart, so a vendor disabled after items were added still blocks checkout.
- **Reused from Medusa:** inventory (a cart line cannot exceed available stock), region prices (a variant without a price in the cart's region cannot be added), shipping profile and shipping option matching, payment session and order creation, all inside Medusa's cart workflows.
- **UI guards, not security:** the storefront disables the add to cart button when a product is out of stock or has no price in the region.

### 7. How are nearby shops queried?

`GET /store/vendors?latitude=..&longitude=..&radius_km=..` in `src/api/store/vendors/route.ts`:

1. Load approved vendors with the query graph (`status = approved`).
2. Compute the great-circle (haversine) distance to each in application code (`src/utils/geo.ts`).
3. Drop vendors beyond `radius_km`, sort ascending by distance, paginate in memory and return `distance_km`.

The customer's coordinates come from the storefront location picker (browser geolocation, a preset or manually typed latitude and longitude). They are stored in a cookie for guests and in `customer.metadata.location` for signed-in customers (`POST /store/customers/me/location`).

### 8. Which Medusa components did you reuse?

Product, Pricing, Inventory, Stock Location, Sales Channel and Publishable API Key modules; Cart, Order, Payment (`pp_system_default`), Fulfillment and Shipping Profile modules; Customer and Auth modules (`emailpass`, extended with a `vendor` actor); Region, Currency and Store; core workflows (`createProductsWorkflow`, `updateProductsWorkflow`, `deleteProductsWorkflow`, `createRemoteLinkStep`, `dismissRemoteLinkStep`, `updateCustomersWorkflow`, `createCustomerAccountWorkflow`, `createShippingOptionsWorkflow`, `updateStoresWorkflow`, `useQueryGraphStep`); the query graph; module links; the workflow hook mechanism; Medusa Admin with its widget and UI route extension points and `@medusajs/ui`; and the official Next.js storefront starter (cart, checkout, account, order confirmation, product pages).

### 9. Which functionality did you implement yourself?

The marketplace module (models, migrations, status rules); vendor registration, approval and status workflows; the vendor actor and the vendor API with ownership enforcement; vendor product CRUD including price, image, availability and stock (`set-variant-stock`, which also backfills untracked products); vendor order views; the order linking subscriber and workflow; the cart and checkout validation hooks; the admin APIs, pages and widgets; the public store vendor APIs with distance search; the customer location route; the idempotent seed script; the whole vendor panel application; and the storefront stores pages, location picker and button handling.

### 10. What would you change if the system needed to support thousands of vendors?

- **Nearby search:** move distance filtering into the database. Store a PostGIS `geography(Point)` column with a GiST index (or an H3 or geohash cell column) on the vendor and query `ST_DWithin` with `ORDER BY` distance and `LIMIT`. Today every approved vendor is loaded and sorted in memory.
- **Vendor product listings:** replace "load all of a vendor's products then paginate in memory" with database pagination, for example by querying the link table or using Medusa's Index Module with filters, and add indexes on `vendor.status`.
- **Product discovery:** use a search engine (Meilisearch, Algolia or similar) with a `vendor_id` facet and geo filter instead of walking links.
- **Eventing:** run Redis (event bus, workflow engine, locking) and make order linking and vendor notifications durable and retryable. The in-memory event bus can lose `order.placed` if the process dies.
- **Money:** add per-vendor payouts and split payments (for example Stripe Connect) with a commission model, and per-vendor fulfilment and stock locations.
- **Catalog and tenancy:** consider a sales channel or stock location per vendor, per-vendor price lists, and background import for large catalogs.
- **Operations:** caching of store listings, read replicas, rate limiting on public routes, audit logs for admin status changes, and per-vendor observability.

## Assumptions

- One vendor is one store at one fixed location, and a vendor has at least one admin account.
- The marketplace sells in India in INR. The store's default currency is INR, and vendor prices are saved in that currency.
- A vendor sells simple products: one default variant per product with one price, one image URL and one stock quantity.
- Availability means published (visible and orderable) or draft (hidden); stock is a separate quantity.
- Product images are URLs entered by the vendor, not uploads.
- The payment provider is Medusa's system provider (cash or manual style). Real payment gateways are out of scope.
- Customers can browse as guests; location for guests lives in a cookie.
- Admins create regions and shipping setup in the Medusa Admin; the seed script only fills gaps.
- Emails are case-sensitive in Medusa, so the project normalises them to lowercase.

## Design decisions and trade-offs

| Decision | Why | Trade-off |
| --- | --- | --- |
| Vendor is also the shop | Simplest model for one store per vendor; one-hop ownership checks | No multi-branch vendors without a refactor |
| Vendors link to Medusa data through module links | Keeps modules isolated and reuses all of Medusa's commerce logic | Reads go through the query graph; some filtering happens in application code |
| One order may link to several vendors | No cart restriction and no order splitting, so Medusa's single order, payment and shipping flow stays intact | No per-vendor payment or fulfilment; the single-shop-cart rule is not enforced |
| Approval status on the vendor with enforced transitions | Clear admin workflow; one place (`vendor-status.ts`) defines the rules | A disabled vendor's products remain published in the catalog, but the cart blocks them and the stores APIs hide the vendor |
| Vendor panel is a separate app, not Medusa Admin | Vendors must never see platform admin screens; different auth and design | One more app to run and deploy |
| Availability as product status, stock as inventory | Uses Medusa's own semantics so storefront stock handling works unchanged | Product status and "visible to customers" are the same switch |
| Customer location in metadata and cookie | No new table or migration, works for guests and customers | Metadata is unindexed; not suitable for querying customers by location |
| Distance in application code | Works on any Postgres, trivial to read | Does not scale past a few hundred vendors (see question 10) |
| Storefront image optimisation disabled | Vendors paste image URLs from any host, and one bad host used to crash pages | Loses Next.js image resizing and caching |
| Catalog fetches skip the cache in development only | Region and product changes in the admin show up immediately | Production keeps the starter's caching, so changes need revalidation |

## Known limitations

- **Single-shop cart is not enforced** (see question 5).
- **No automated tests** are included. See [Testing](#testing) for the manual flow and the checks that were run.
- **Vendors cannot fulfil orders.** The vendor panel shows orders and delivery details read-only; fulfilment is done by an admin in the Medusa Admin. The payment and fulfilment status columns in the vendor panel are empty because those computed values are not exposed through the query used.
- **No payouts, commission or split payments.** One payment covers the whole order.
- **Disabling a vendor does not unpublish its products.** They cannot be added to a cart and the store disappears from listings, but a product page opened by direct URL still renders. The "related products" block on a product page can show other stores' products.
- **In-memory pagination and distance filtering** (see question 10).
- **No vendor password reset or email verification.** No notification provider is configured.
- **Event reliability:** without Redis the event bus is in memory, so `order.placed` linking can be lost if the process stops at the wrong moment. A re-run of the link workflow for an order is safe.
- **Seed script prerequisites:** it needs an India region to exist and changes the default store currency to INR. Existing products without an INR price (the starter products) show no price in India.
- **`apps/vendor/Dockerfile`** uses `npm ci` and a `package-lock.json`, but this repository uses Yarn. It needs adjusting before use.
- **Storefront type errors:** the Next.js starter has about 19 type errors of its own and sets `ignoreBuildErrors`.
- The seeded password `admin@123` and the placeholder secrets must not be used outside local development.

## Testing

There is no automated test suite yet (the Jest configuration and an integration test setup file exist, but no specs). What can be run:

```bash
# static checks and builds
cd apps/backend && npx tsc --noEmit && yarn lint && yarn build      # backend and admin bundle
cd apps/vendor  && yarn typecheck && yarn build                      # vendor panel
cd apps/store   && npx tsc --noEmit                                  # storefront (starter has existing errors)
```

Manual end-to-end check, using the seed data:

1. Sign in to the vendor panel (http://localhost:5173) as `vendor1@example.com` / `admin@123`. Edit a product's stock and price, add a product.
2. Register a new vendor at `/register`. It shows a "pending approval" notice. In the Medusa Admin open Vendors, approve it, and sign in again.
3. In the admin, disable a vendor and confirm its store disappears from the storefront and its products cannot be added to a cart.
4. Open http://localhost:8000/in. Use the location control in the header to pick a preset or enter latitude and longitude; the store list reorders and distances change. Filter by radius.
5. Open a store, add a product to the cart, check out with a shipping address and the system payment provider.
6. Confirm the stock-0 product shows "Out of stock", and that quantity above stock is refused.
7. After the order, sign in as the owning vendor and open Orders: only that vendor's items appear. In the Medusa Admin open the order and check the Vendors widget.

Backend logic can be checked without a running server using `yarn medusa exec <script>` against the dev database.

## Deployment

Nothing is deployed from this repository yet. A production setup would be:

- **PostgreSQL** (managed) and **Redis** (managed). Set `REDIS_URL` and use Medusa's Redis event bus, workflow engine and locking modules.
- **Backend:** `cd apps/backend && yarn build` then `yarn medusa db:migrate` and `yarn start` (`medusa start`), running as a server instance, ideally with a separate worker instance for background jobs. Set strong `JWT_SECRET` and `COOKIE_SECRET`, and set the CORS variables to the real storefront, admin and vendor panel origins. Run `db:migrate` on every release. Run the seed script only in non-production environments.
- **Storefront:** `cd apps/store && yarn build && yarn start`, or deploy to a Next.js host. Set `MEDUSA_BACKEND_URL`, `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`, `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_DEFAULT_REGION` and a real `REVALIDATE_SECRET`.
- **Vendor panel:** `cd apps/vendor && yarn build && yarn start` (React Router serve), or the Dockerfile after fixing it for Yarn. Set `BACKEND_URL` and `SESSION_SECRET`.
- **Images:** vendor image URLs are external. For uploads, configure Medusa's file module with S3-compatible storage.
- Put all three apps behind HTTPS.
