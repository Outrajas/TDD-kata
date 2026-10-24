# Car Dealership Inventory System

A full-stack kata for vehicle inventory, account authentication, and stock-safe purchases. The backend is a TypeScript/Express REST API backed by PostgreSQL and Prisma. The frontend is a React/Next.js and Tailwind CSS app with registration, login, inventory search, purchases, and admin inventory controls.

## Current status

- Backend API, database migrations, admin bootstrap, and automated tests are implemented.
- The PostgreSQL database starts empty; add inventory through the admin flow or API.
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

   The API listens at `http://localhost:3001` and the web app at `http://localhost:3000`. Check API readiness with `GET http://localhost:3001/api/health`.

The API endpoint list and request/response details are in [docs/api-reference.md](docs/api-reference.md). The current database design and constraints are described in [docs/database-design.md](docs/database-design.md).

## API overview

| Method and route | Access | Purpose |
|---|---|---|
| `GET /api/health` | Public | Health check |
| `POST /api/auth/register` | Public | Register a customer |
| `POST /api/auth/login` | Public | Sign in and set the JWT cookie |
| `POST /api/auth/logout` | Public | Clear the browser cookie |
| `GET /api/vehicles` | Authenticated | List inventory with pagination and optional filters (admins can also see zero-stock vehicles to restock) |
| `GET /api/vehicles/search` | Authenticated | Search by make, model, category, and price range |
| `POST /api/vehicles` | Admin | Create a vehicle and record opening stock |
| `PUT /api/vehicles/:id` | Admin | Replace vehicle fields and record stock adjustments |
| `DELETE /api/vehicles/:id` | Admin | Soft-deactivate a vehicle |
| `POST /api/vehicles/:id/purchase` | Authenticated | Atomically purchase one unit; optional `Idempotency-Key` header |
| `POST /api/vehicles/:id/restock` | Admin | Add stock and append an inventory movement |

The API uses a `{ data: ... }` success envelope and a structured `{ error: ... }` failure envelope. Search filters combine, and price bounds are inclusive. Customers see available stock while admins can also see active zero-stock vehicles for restocking. Purchases update stock, purchase history, and the inventory ledger in one transaction; retries can use an idempotency key. See the API reference for exact schemas, status codes, and error cases.

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

These are genuine browser captures of the production-built frontend. They show the responsive home and customer account registration view. The database starts empty, so the inventory section prompts users to sign in before browsing. Add further screenshots of signed-in search, purchase, and administrator flows after exercising those flows against a local API/database.

![Northstar Motors home and account entry](docs/screenshots/inventory-home.png)

![Northstar Motors customer registration](docs/screenshots/account-register.png)

Before submission, review [docs/submission-checklist.md](docs/submission-checklist.md), especially the raw prompt-log completeness and any additional authenticated-flow screenshots. Deployment is optional.

## My AI Usage

I used OpenAI Codex in the Codex desktop app to interpret the assignment, compare the proposed stack with the EduPortal reference, plan the fishbone and database schema, and implement the backend and frontend iterations. Codex helped draft tests before behavior implementation, Express route wiring, Prisma repositories and transactions, input validation, React UI flows, and project documentation. I reviewed the work against the brief, selected Express because the brief lists Express/NestJS for Node, and used database-backed integration tests to check authentication, authorization, search, and concurrent stock changes. The main workflow benefit was speeding up the initial design and test setup. Human review was especially important for the assignment's framework constraint, safe administrator provisioning, concurrent inventory behavior, and frontend-to-API contract. The raw conversation log is in root `PROMPTS.md`; review it for completeness before public submission. AI-assisted commits include the required co-author trailer.
