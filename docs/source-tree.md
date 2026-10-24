# Implemented source tree

```text
apps/
├── api/
│   ├── prisma/
│   │   ├── migrations/                 # base schema and inventory integrity checks
│   │   └── schema.prisma               # four relational models
│   ├── scripts/create-admin.ts         # controlled administrator provisioning
│   ├── src/
│   │   ├── app.ts                      # Express application composition
│   │   ├── index.ts                    # validated runtime and HTTP listener
│   │   ├── db.ts                       # Prisma PostgreSQL adapter
│   │   ├── config/                     # env validation and CORS policy
│   │   ├── middleware/                 # JWT auth, admin policy, API errors
│   │   ├── modules/
│   │   │   ├── auth/                   # routes, service, repository
│   │   │   ├── vehicles/               # routes, service, repository
│   │   │   └── inventory/              # purchase/restock routes and transaction service/repository
│   │   ├── shared/                     # API errors and pagination response helper
│   │   └── generated/prisma/           # generated client; ignored by Git
│   └── tests/
│       ├── fixtures/                   # auth and vehicle setup helpers
│       ├── integration/                # Express + PostgreSQL endpoint behavior
│       └── unit/                       # domain service behavior
├── web/
│   ├── src/app/                        # Next.js routes and global Tailwind styles
│   ├── src/components/dealership-app.tsx # customer and admin SPA interactions
│   ├── src/lib/inventory.ts            # search query serialization and purchase availability
│   └── tests/components/               # frontend behavior unit tests
└── packages/contracts/                 # shared Zod schemas and inferred types
```

Route modules act as the HTTP controller layer and translate validated requests to use-case calls. Services depend on narrow repository ports. Prisma client generation and local environment files remain outside version control; migrations and safe setup scripts are committed.
