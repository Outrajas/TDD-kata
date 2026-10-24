# Car Dealership Inventory System — TDD Kata

A full-stack Car Dealership Inventory System built with Test-Driven Development (TDD), clean SOLID architecture, and persistent PostgreSQL storage. The backend is a TypeScript/Express RESTful API using Prisma ORM and PostgreSQL, and the frontend is a responsive React/Next.js and Tailwind CSS Single-Page Application (SPA) with role-based authentication, live search/filtering, atomic vehicle purchases, and administrator inventory controls.

- **Public GitHub Repository:** [https://github.com/Outrajas/TDD-kata](https://github.com/Outrajas/TDD-kata)
- **Raw AI Prompt Logs:** [`PROMPTS.md`](PROMPTS.md)
- **Automated Test Report:** [`docs/test-report.md`](docs/test-report.md)
- **API & SOLID Reference:** [`docs/api-reference.md`](docs/api-reference.md)
- **Database Schema & ERD:** [`docs/database-design.md`](docs/database-design.md)
- **Technical Fishbone Diagram:** [`docs/fishbone.md`](docs/fishbone.md)

## Technology Stack
- **Backend API:** Node.js 20+, TypeScript 6, Express 5, Zod 4
- **Database & ORM:** PostgreSQL 16+, Prisma 7 (`@prisma/adapter-pg`, `pg`)
- **Authentication:** `bcryptjs` password hashing, `jose` HS256 JWT in `HttpOnly` cookie, Role-Based Access Control (`CUSTOMER`, `ADMIN`)
- **Frontend SPA:** React 19, Next.js 16, Tailwind CSS 4, HTML5, CSS3
- **Testing & Quality:** Vitest 5 (Unit & Live HTTP/DB Integration), TypeScript strict mode, ESLint

## Local Setup
1. Install dependencies: `pnpm install`
2. Generate Prisma client: `pnpm db:generate`
3. Run migrations: `pnpm db:migrate`
4. Seed admin user: `pnpm db:seed:admin`
5. Start development servers: `pnpm dev`
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## My AI Usage
- **OpenAI Codex (Codex Desktop App):** Used for initial requirements analysis, scaffolding the pnpm monorepo, writing Red-Green-Refactor unit and integration tests, implementing Express 5 routes and Prisma repositories, and building the React 19 UI.
- **Google Gemini:** Used for end-to-end repository auditing against the assessment rubric, diagnosing Git safe-directory ownership, fixing the `/api/health` integration test assertion, allowing `/api/auth/login` to accept both roles, adding Vercel serverless configurations, and polishing documentation.