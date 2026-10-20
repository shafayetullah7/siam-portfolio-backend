# siam-api

NestJS 12 API for the SIAM portfolio — Drizzle ORM, Zod validation, OpenAPI.

## Documentation

| Doc | Topic |
|-----|--------|
| [docs/architecture.md](./docs/architecture.md) | `/api/v1/public` vs `/api/v1/admin`, modules |
| [docs/nest-drizzle-zod.md](./docs/nest-drizzle-zod.md) | Drizzle + Zod patterns |
| [docs/admin-auth.md](./docs/admin-auth.md) | Cookie JWT admin auth (Phase 5) |
| [docs/media.md](./docs/media.md) | Cloudinary uploads |

Monorepo product docs: [../docs/project-decisions.md](../docs/project-decisions.md), [../docs/portfolio-delivery-phases.md](../docs/portfolio-delivery-phases.md).

## Local development

```bash
pnpm install
cp .env.example .env
pnpm run docker:db          # Postgres on localhost:5444 (default)
pnpm run start:dev          # API on http://localhost:5000
```

- **Health:** `GET http://localhost:5000/api/v1/public/health`
- **Swagger:** `http://localhost:5000/api`

Full stack with Docker app container:

```bash
pnpm run docker:dev
```

## Environment

See [.env.example](./.env.example). Key variables:

- `DATABASE_URL` — host port must match `DB_EXTERNAL_PORT` when using `docker:db`
- `CORS_ORIGIN` — SolidStart dev origin (default `http://localhost:5001`)

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm test` | Unit tests (Vitest) |
| `pnpm run test:e2e` | E2E (health) |
| `pnpm run build` | Nest build |
| `pnpm run lint` | ESLint |
| `pnpm run db:generate` | Drizzle migrations |
| `pnpm run db:migrate` | Apply migrations |

## Frontend

Run [siam-frontend](../siam-frontend) with `VITE_API_BASE=http://localhost:5000/api/v1` and `CORS_ORIGIN=http://localhost:5001`.

## Troubleshooting

If `pnpm run build` fails with `EACCES` on `dist/` (e.g. after Docker created root-owned files), fix ownership or remove `dist` with appropriate permissions, then rebuild.
