# Test report

Run against the workspace-local PostgreSQL 18 database on 2026-10-24 after applying all Prisma migrations.

| Check | Result |
|---|---|
| API `vitest run` | 7 test files passed; 20 tests passed |
| Web `vitest run` | 2 test files passed; 4 tests passed |
| `pnpm test` | 9 test files passed; 24 tests passed |
| `pnpm typecheck` | API and web type checks passed |
| API `pnpm lint` | Passed |
| Web `pnpm lint` | Passed |
| `pnpm build` | API TypeScript build and Next.js production build passed |
| `prisma migrate dev` | Schema and all four migrations applied |

The integration tests start the Express app on a temporary local HTTP port and send real HTTP requests to it. They cover registration and login, cookie attributes and logout, duplicate accounts and role escalation, authenticated vehicle search, admin CRUD and soft delete, opening-stock, restock, and adjustment ledger entries, invalid vehicle data and price precision, authorization, atomic last-item purchases, out-of-stock conflicts, restocking, and idempotency. Unit tests cover the shared request schemas and service rules.

The API suite also verifies that admins can see active zero-stock vehicles for restocking while customers cannot. The web unit tests cover query filter serialization and purchase disabled state. The new tests failed before their implementation and passed afterward. Coverage percentages are not reported in this iteration. The local test database is disposable and ignored by Git; production credentials or data were not used. Production-build browser captures verify the home and registration screens. Authenticated browser flows were not separately exercised in this run; backend integration tests cover their API behavior.
