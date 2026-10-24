# Issues encountered and resolutions

This log records concrete setup and implementation issues observed while building and running the assessment app. The submitted solution keeps the original assessment constraints: an Express REST API, PostgreSQL persistence, and a Next.js frontend.

| Issue observed | Cause | Resolution |
|---|---|---|
| Double-clicking the Windows launcher closed before showing why startup failed. | The terminal was launched with `cmd /c`, so it closed when a prerequisite check failed. | `start-local.bat` now keeps its console open, reports the prerequisite and detected path, and stops both processes on Ctrl+C. |
| `pnpm was not found on PATH for this Windows session`. | Explorer-launched batch files can have a different PATH from a developer terminal. | The launcher resolves the configured Codex runtime pnpm fallback and verifies its version before starting the workspace. The reported local launch detected pnpm 11.25.0 and started both services. |
| `GET /assets/test-staff-upi.jpeg` returned 404. | The image was stored at repository-root `public/`; the Next.js app root is `apps/web`, whose static asset root is `apps/web/public`. | Place the image in `apps/web/public/assets/test-staff-upi.jpeg`, matching the existing `/assets/test-staff-upi.jpeg` URL. |
| Users saw an unhelpful account-creation failure. | The form did not explain password rules as the user typed. | Registration now shows live length, lowercase, uppercase, and digit requirements; API validation errors are shown inline. |
| Password entry had no visibility control. | The form used a fixed `type=password` input. | Add an accessible Show/Hide control to login, admin login, and registration forms. |
| There was no separate administrator sign-in. | One login route authenticated either role and the frontend routed by the returned role. | Customer login only accepts customer accounts; `/admin/login` uses `POST /api/auth/admin-login`, which only accepts provisioned administrator accounts. Both use the same HttpOnly JWT session cookie. |
| It was unclear whether PostgreSQL was connected or whether actions were persistent. | `/api/health` checked only that the HTTP server responded, and the UI did not expose database readiness. | Health now executes `SELECT 1` and reports `database: connected` or HTTP 503. The shared header polls health every ten seconds. Account, inventory, and purchase operations use Prisma/PostgreSQL repositories; purchase updates stock, purchase history, and the inventory ledger transactionally. |
| Product branding said Northstar Motors instead of the assessment name. | Initial UI branding used a dealership concept name. | Update the title, header, home page, and account pages to identify the project as TDD Kata / Car Dealership Inventory System. |
| The API started its own listener unconditionally, which does not fit a serverless function entry point. | Local development startup and hosted request handling were coupled in `src/index.ts`. | Export the Express app as the default handler and start `listen()` only outside Vercel. The Next app can proxy `/api/*` to the deployed API with `API_PROXY_ORIGIN`. |
| TypeScript 6 reported TS5011 for the API project. | The compiler could not infer a stable common source directory in the workspace. | Set the API `rootDir` to `src` in `apps/api/tsconfig.json`. |
| An out-of-stock assertion was affected by shared database test records. | The test searched a broad result set containing earlier records. | Scope the test to unique fixture data so it asserts against its own seeded vehicle. |

## Database connection details

Local persistence uses the PostgreSQL URL in `apps/api/.env` (`DATABASE_URL`). The API does not silently use browser memory or dummy records. A successful `GET /api/health` response with `database: "connected"` confirms the running API can query its configured PostgreSQL database. In the UI, the header exposes this readiness state. Inventory starts empty until an admin creates vehicles. Do not publish `.env` values or production credentials.

## Vercel deployment layout

Create two Vercel projects from the monorepo, with root directories `apps/web` and `apps/api`. For the web project, set `API_PROXY_ORIGIN` to the deployed API origin (for example, `https://your-api.example.com`) so browser requests use same-origin `/api/*` paths and the Next rewrite forwards them. For the API project, set `DATABASE_URL`, `JWT_SECRET` (at least 32 characters), `WEB_ORIGIN`, and `NODE_ENV=production`. Provision the hosted PostgreSQL schema with the checked-in Prisma migrations before serving requests. Set a persistent PostgreSQL provider; serverless local files are not the database.

The API's serverless compatibility is implemented through the Express app export. Vercel supports Express apps as functions; configure a monorepo project with the app directory as its Root Directory. See [Vercel Express documentation](https://vercel.com/docs/frameworks/backend/express) and [Vercel monorepos](https://vercel.com/docs/monorepos).
