# Test Report
Run against the workspace-local PostgreSQL database on 2026-10-24 after applying all Prisma migrations.

| Check | Result |
|---|---|
| API vitest run | 7 test files passed; 20 tests passed |
| Web vitest run | 2 test files passed; 4 tests passed |
| pnpm test | 9 test files passed; 24 tests passed |
| pnpm typecheck | API and web type checks passed |
| pnpm lint | Passed |
| pnpm build | API and Next.js production build passed |

The integration tests start the Express app on a temporary local HTTP port and send real HTTP requests. They cover registration and login, cookie attributes, duplicate accounts, role escalation, admin CRUD, atomic last-item purchases, idempotency, and out-of-stock conflicts.