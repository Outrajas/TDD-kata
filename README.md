# Car Dealership Inventory System

A full-stack kata for vehicle inventory, account authentication, and stock-safe purchases. The backend is a TypeScript/Express REST API backed by PostgreSQL and Prisma. The frontend is a React/Next.js and Tailwind CSS app with registration, login, inventory search, purchases, and admin inventory controls.

## Current status

- Backend API, database migrations, admin bootstrap, and automated tests are implemented.
- The PostgreSQL database starts empty; add inventory through the admin flow or API.
- The frontend provides separate home, sign-in, registration, customer inventory, and administrator inventory pages backed by the API and PostgreSQL.
- Public repository: [github.com/Outrajas/TDD-kata](https://github.com/Outrajas/TDD-kata).

## Technology

| Area | Stack |
|---|---|
| Backend | Node.js 20+, TypeScript, Express 5, Zod |
| Database | PostgreSQL 16+, Prisma 7 |
| Authentication | bcrypt password hashes, short-lived JWT in HttpOnly cookie, customer/admin roles |
| Frontend | React 19, Next.js 16, Tailwind CSS 4 |
| Tests and quality | Vitest, TypeScript, ESLint |
| Workspace | pnpm 11 monorepo; shared Zod contracts in `packages/contracts` |

## Repository layout

```text
apps/
  api/                 Express API, Prisma schema/migrations, admin script, tests
  web/                 Next.js/React/Tailwind frontend workspace
packages/
  contracts/           Shared request schemas and TypeScript types
docs/
  api-reference.md     Endpoint parameters, behavior, and SOLID responsibilities
  database-design.md   Relational model and data-integrity decisions
  fishbone.md          Technical fishbone and proposed node stacks
  source-tree.md       Source layout
  test-report.md       Backend test and quality-check results
PROMPTS.md             Raw AI conversation log captured so far
```

## Prerequisites

- Node.js 20.9 or later
- pnpm 11.25.0 (the package manager version is pinned in `package.json`)
- PostgreSQL 16 or later

## Local setup

1. Create a PostgreSQL database named `dealership` and a database user with permission to create tables.
2. Copy `apps/api/.env.example` to `apps/api/.env`. Set `DATABASE_URL` to the local database and replace `JWT_SECRET` with a random secret of at least 32 characters. Set `WEB_ORIGIN` to the frontend origin if it differs from `http://localhost:3000`. Keep `.env` files out of Git.
3. From the repository root, install dependencies and apply the schema:

   ```powershell
   pnpm install
   pnpm db:generate
   pnpm db:migrate
   ```

4. Provision an administrator using environment variables, then run the setup command:

   ```powershell
   $env:ADMIN_EMAIL = "admin@example.com"
   $env:ADMIN_PASSWORD = "Use-a-unique-password-123"
   pnpm db:seed:admin
   Remove-Item Env:ADMIN_EMAIL, Env:ADMIN_PASSWORD
   ```

   Registration always creates a `CUSTOMER`; this script is the supported way to create or promote an administrator. Do not commit real credentials.

5. Start the workspace:

   ```powershell
   pnpm dev
   ```

   On Windows, after setup, you can instead double-click [`start-local.bat`](start-local.bat). It runs both development servers in parallel in the launcher window. PostgreSQL must already be running, migrations must have been applied, and `apps/api/.env` must exist. Keep the window open while using the app; press Ctrl+C there to stop both servers. If startup exits, the window stays open with the error output visible.

   The API listens at `http://localhost:3001` and the web app at `http://localhost:3000`. Check API readiness with `GET http://localhost:3001/api/health`.

The API endpoint list and request/response details are in [docs/api-reference.md](docs/api-reference.md). The current database design and constraints are described in [docs/database-design.md](docs/database-design.md). Concrete issues encountered and their resolutions are in [docs/issues-and-resolutions.md](docs/issues-and-resolutions.md).

## API overview

| Method and route | Access | Purpose |
|---|---|---|
| `GET /api/health` | Public | Health check |
| `POST /api/auth/register` | Public | Register a customer |
| `POST /api/auth/login` | Public | Sign in and set the JWT cookie |
| `POST /api/auth/admin-login` | Public | Admin ID (email) sign-in; accepts only provisioned admin accounts |
| `POST /api/auth/logout` | Public | Clear the browser cookie |
| `GET /api/vehicles` | Authenticated | List inventory with pagination and optional filters (admins can also see zero-stock vehicles to restock) |
| `GET /api/vehicles/search` | Authenticated | Search by make, model, category, and price range |
| `POST /api/vehicles` | Admin | Create a vehicle and record opening stock |
| `PUT /api/vehicles/:id` | Admin | Replace vehicle fields and record stock adjustments |
| `DELETE /api/vehicles/:id` | Admin | Soft-deactivate a vehicle |
| `POST /api/vehicles/:id/purchase` | Authenticated | Atomically purchase one unit; optional `Idempotency-Key` header |
| `POST /api/vehicles/:id/restock` | Admin | Add stock and append an inventory movement |

The API uses a `{ data: ... }` success envelope and a structured `{ error: ... }` failure envelope. `GET /api/health` runs a PostgreSQL readiness query and returns `database: "connected"` or HTTP 503. Search filters combine, and price bounds are inclusive. Customers see available stock while admins can also see active zero-stock vehicles for restocking. Purchases update stock, purchase history, and the inventory ledger in one transaction; retries can use an idempotency key. See the API reference for exact schemas, status codes, and error cases.

## Application functions

- **Account access:** customers register with validated credentials, use customer sign-in, restore a session from the HttpOnly JWT cookie, and sign out. Administrators use a separate admin sign-in page and role-restricted API endpoint. Public registration always creates a customer; create the first administrator with the bootstrap command above. Password fields have a view toggle and registration displays live password requirements.
- **Customer inventory:** authenticated customers search by make, model, category, and inclusive minimum/maximum price, navigate paginated results, view price and available quantity, and purchase one unit. The API enforces authorization and availability; it records each purchase and the corresponding stock movement atomically.
- **Administrator inventory:** administrators list active inventory including zero-stock listings, create vehicles with opening stock, edit vehicle details and quantity, restock with a ledger entry, deactivate a listing while preserving purchase history, and navigate paginated results.
- **Administrator dashboard:** administrators can see all registered accounts and role/status/creation date, plus customer/admin/listing/stock/purchase totals. The page refreshes from the database every 10 seconds; this is not online-presence tracking.
- **Inventory filters:** the API provides distinct current makes, models, categories, and prices for dropdown filters. Selecting values refreshes the paginated matching results.
- **Internal demo checkout:** vehicle details lead to a test-only payment panel that displays the supplied UPI QR and demo dinner message. Scanning the QR may cause a real UPI payment; the app does not verify or process payments. The separate test-purchase action records a local purchase and decrements inventory only.
- **Local persistence:** accounts, listings, purchase records, and inventory movements are stored in PostgreSQL. There is no browser dummy-data mode or preloaded inventory; the initial inventory is empty. An admin creates listings after migrations and administrator setup.
- **API-backed UI:** frontend hooks send requests with `credentials: "include"`. The JWT remains in an HttpOnly cookie and is validated by API middleware on each protected request; local storage is not used as the authentication source. The browser displays validation, authorization, and request errors returned by the API.
- **Database readiness:** the site header polls `GET /api/health` and displays whether the API can query PostgreSQL. This confirms the API's live database connection; it is not a browser-local database or dummy-data mode.

## Vercel deployment

Deploy two Vercel projects from this monorepo: set the frontend project's Root Directory to `apps/web`, and the API project's Root Directory to `apps/api`. Set `API_PROXY_ORIGIN` in the web project to the public API origin so `/api/*` calls are proxied through Next.js and the JWT cookie remains same-origin to the browser. Set `DATABASE_URL`, a random `JWT_SECRET` (at least 32 characters), `WEB_ORIGIN`, and `NODE_ENV=production` in the API project. Use hosted PostgreSQL and apply the checked-in Prisma migrations before launch; provision an administrator with the documented seed command. See [docs/issues-and-resolutions.md](docs/issues-and-resolutions.md) for deployment notes.

## Data model and design

The PostgreSQL schema contains `users`, `vehicles`, `purchases`, and `inventory_movements`. A purchase keeps a unit-price snapshot. Inventory movements record opening stock, purchases, restocks, and admin adjustments, and are append-only. Database constraints prevent invalid price/stock values. Deleting a vehicle through the API deactivates it so purchase history remains referentially valid.

The backend uses SOLID boundaries: route modules handle HTTP, shared Zod schemas validate inputs, services implement use cases, repositories encapsulate Prisma persistence, and `createApp` composes injected dependencies. Authentication and role checks are middleware-enforced by the API; frontend visibility alone is not treated as security.

## Tests and checks

Run the full suite against a migrated local PostgreSQL database:

```powershell
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

See [docs/test-report.md](docs/test-report.md) for the recorded full-stack results and coverage notes. Test definitions were committed before their implementation; the commit history keeps that red-to-green progression visible.

## Screenshots and submission

These are genuine browser captures of the production-built frontend. They show the responsive home and customer account registration view. The database starts empty, so the inventory section prompts users to sign in before browsing. Users can then search, purchase vehicles, and administrators can manage inventory from the dashboard. after exercising those flows against a local API/database.

!![Dealership Homepage](docs/screenshots/inventory-home.png)(docs/screenshots/inventory-home.png)

![Northstar Motors customer registration](docs/screenshots/account-register.png)

Before submission, review [docs/submission-checklist.md](docs/submission-checklist.md), especially the raw prompt-log completeness and any additional authenticated-flow screenshots. Deployment is optional.


## My AI Usage
- **OpenAI Codex (Codex Desktop App):** Used for initial requirements analysis, scaffolding the pnpm monorepo, writing Red-Green-Refactor unit and integration tests, implementing Express 5 routes and Prisma repositories, and building the React 19 UI.
- **Google Gemini:** Used for end-to-end repository auditing against the assessment rubric, diagnosing Git safe-directory ownership, fixing the /api/health integration test assertion, allowing /api/auth/login to accept both roles, adding Vercel serverless configurations, and polishing documentation.