# Backend API reference

Base URL: `http://localhost:3001`. JSON routes use `{ "data": ... }` on success and `{ "error": { "code", "message", "details?" } }` on failure. JWT sessions are carried in the `dealership_token` HttpOnly, SameSite=Lax cookie for 15 minutes. The frontend must send cookies with credentials enabled.

## Endpoints

| Method and path | Access | Parameters and body | Success |
|---|---|---|---|
| `GET /api/health` | Public | None; runs `SELECT 1` against PostgreSQL, returning 503 if the database is unreachable. | `200 { data: { status: "ok", database: "connected" } }` |
| `POST /api/auth/register` | Public | JSON `{ email, password }`; password 10–128 chars with upper/lowercase and a digit. Registration always creates a `CUSTOMER`. | `201 { data: { user } }` |
| `POST /api/auth/login` | Public customer login | JSON `{ email, password }`; accepts only active `CUSTOMER` accounts. | `200 { data: { user } }` and `Set-Cookie` JWT |
| `POST /api/auth/admin-login` | Public admin login | JSON `{ email, password }`; email is the administrator ID, accepts only active `ADMIN` accounts provisioned by the seed-admin script. | `200 { data: { user } }` and `Set-Cookie` JWT |
| `GET /api/auth/session` | Authenticated | No body; validates the HttpOnly JWT cookie and returns the active user. | `200 { data: { user } }` |
| `GET /api/admin/dashboard` | Admin | No body; returns user roster, account role counts, inventory totals, purchase count, and generation time. Password hashes are never selected. | `200 { data: { metrics, users, generatedAt } }` |
| `POST /api/auth/logout` | Public | None; clears the session cookie on this browser. | `204` |
| `GET /api/vehicles` | Authenticated | Query: `page` (default 1), `pageSize` (default 20; max 100), optional `make`, `model`, `category`, `minPrice`, `maxPrice`. Customers see active in-stock vehicles; admins also see active zero-stock vehicles so they can restock them. | `200 { data: { items, pagination } }` |
| `GET /api/vehicles/search` | Authenticated | Same query filters as listing. Filters combine with AND; make/model use case-insensitive partial matching, category uses case-insensitive equality, and price bounds are inclusive. Admins can search active zero-stock vehicles too. | `200 { data: { items, pagination } }` |
| `GET /api/vehicles/options` | Authenticated | No body; returns distinct makes, models, categories, and prices from active inventory available to the caller's role. | `200 { data: { makes, models, categories, prices } }` |
| `POST /api/vehicles` | Admin | JSON `{ make, model, category, price, quantity }`; price must be positive with at most 2 decimal places, quantity a nonnegative integer. Positive opening stock is recorded in the ledger. | `201 { data: vehicle }` |
| `PUT /api/vehicles/:id` | Admin | `id` is a UUID; JSON contains the full vehicle shape `{ make, model, category, price, quantity }`. A quantity change appends an `ADJUSTMENT` ledger entry. | `200 { data: vehicle }` |
| `DELETE /api/vehicles/:id` | Admin | `id` is a UUID. Soft-deactivates the listing so purchase history stays valid. | `204` |
| `POST /api/vehicles/:id/purchase` | Authenticated | `id` is a UUID; optional `Idempotency-Key` header (1–128 letters, digits, `_`, `.`, `:`, or `-`). Purchases one unit. | `200 { data: { id, vehicleId, unitPrice, purchasedAt, repeated } }` |
| `POST /api/vehicles/:id/restock` | Admin | `id` is a UUID; JSON `{ quantity, note? }`, quantity is a positive integer and note is at most 500 characters. | `200 { data: vehicle }` |

An empty listing is valid. Vehicle listing and search include only active vehicles with stock greater than zero. A purchase with no stock returns `409 OUT_OF_STOCK`; reusing an idempotency key for a different vehicle returns `409 IDEMPOTENCY_KEY_REUSED`; schema validation failures return `422 VALIDATION_ERROR` and malformed JSON returns `400 INVALID_JSON`; missing records return `404`; missing/invalid login sessions return `401`; customer attempts at admin operations return `403`.

## SOLID and module responsibilities

- **Single Responsibility:** Express route modules own HTTP parsing and response status; Zod schemas own request validation; services own use-case rules; repositories own Prisma queries and transactions; middleware owns session and role checks.
- **Open/Closed:** route factories take dependencies, and new persistence or policy behavior can be supplied behind the service ports without changing the HTTP contract.
- **Liskov Substitution:** each service accepts a repository port (`Pick` of its operations), so a Prisma repository and a test double can be substituted while preserving the same use-case behavior.
- **Interface Segregation:** auth, vehicle, and inventory services receive only the repository methods they need.
- **Dependency Inversion:** `createApp` receives Prisma and the JWT secret; service constructors depend on narrow repository ports rather than constructing database clients.

## Important function flow

- `createApp` composes Express middleware, route factories, and the JSON error handler.
- `AuthService.register` normalizes email, hashes the password with bcrypt, and creates a customer through `AuthRepository`; public input cannot select a role. `AuthService.login` verifies the hash and signs a short-lived HS256 JWT.
- `VehicleService.list` applies pagination and serializes decimal prices. `VehicleService.create/update/remove` validate use-case results and soft-delete rather than breaking purchase references.
- `InventoryRepository.purchase` performs a serializable transaction: check idempotency, decrement only when active stock is positive, snapshot the price, create a purchase and append a matching ledger movement. Serialization/unique conflicts retry up to three attempts.
- `InventoryRepository.restock` increments stock and appends the corresponding movement in one transaction.
- `authenticate` validates the JWT cookie; `requireAdmin` enforces privileged operations in the backend, independent of frontend controls.

## Tables

See [database design](database-design.md) and `apps/api/prisma/schema.prisma`. The four tables are `users`, `vehicles`, `purchases`, and `inventory_movements`; migration SQL adds checks and the append-only ledger trigger.
