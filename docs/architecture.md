# siam-api — Architecture and code organization

Portfolio backend for the [AI/ML portfolio requirements](../../AI_ML_Portfolio_Page_by_Page_Content_UX_Requirements.md). Delivery phases: [portfolio-delivery-phases.md](../../docs/portfolio-delivery-phases.md). **Agreed stack choices:** [project-decisions.md](../../docs/project-decisions.md). Stack details: [nest-drizzle-zod.md](./nest-drizzle-zod.md).

## Project decisions (summary)

- **CMS:** `siam-frontend` routes under `/admin` (API still `siam-api` admin prefix).
- **Files:** Cloudinary via **server-side upload** (Multer → API); see [media.md](./media.md). DB: `media` + `cloudinary_media` + `admin_upload_media`.
- **Schema:** Relational first; **jsonb** only for small bounded data (e.g. short string arrays). Long content → `text` (markdown) or child section rows. No pgvector / external search engines — SQL filters + optional FTS.
- **i18n:** not used (English only).
- **Admin auth:** portfolio-api pattern — [admin-auth.md](./admin-auth.md).
- Details and open items: [project-decisions.md](../../docs/project-decisions.md).

## Goals

1. **One domain layer** — each content area (publications, projects, …) has a single service/repository; public and admin are two HTTP surfaces.
2. **Public never sees drafts** — `published` (and scheduled-after-now) filtering lives in services used by public controllers, not copy-pasted `where` in controllers.
3. **Admin is guarded by default** — `AdminApiModule` applies auth to all routes unless explicitly marked public.
4. **Zod at the HTTP edge** — `*.schemas.ts` per feature; shared shapes in domain `schemas/`.
5. **Drizzle schema mirrors domains** — `src/db/schema/<domain>/`, not page ids (P01, P02).

## URL surfaces

| Surface | Prefix (convention) | Nest module | Auth |
|---------|---------------------|-------------|------|
| Public API | `/api/v1/public` | `PublicApiModule` | None (rate limit on contact/search) |
| Admin API | `/api/v1/admin` | `AdminApiModule` | JWT/session on module |
| Health | `/health` | `HealthModule` | None |

Register the version prefix in `main.ts` (`app.setGlobalPrefix('api/v1')`) or on each controller group. Controllers use paths like `@Controller('public/publications')` or `@Controller('admin/publications')`.

**Preview (draft) content:** signed preview token or admin-only preview routes under `admin/` — never return draft bodies from public handlers.

## Top-level `src/` layout

```
src/
  main.ts
  app.module.ts

  config/                 # env.schema, AppConfigModule
  db/
    schema/               # Drizzle tables by domain (see below)
    relations.ts
    database.ts           # export type Database = NodePgDatabase<typeof relations>

  common/                 # cross-cutting only (no portfolio business rules)
    decorators/           # @Public(), @CurrentUser()
    guards/               # JwtAuthGuard, ThrottleGuard
    filters/
    pagination/           # list query helpers + Zod
    publishing/           # PublishStatus, isPubliclyVisible()

  domain/                 # business logic + persistence (no HTTP)
    auth/
    site/
    profile/
    homepage/
    research/
    publications/
    projects/
    writing/
    timeline/             # education, experience, achievements
    talks/
    collaborations/
    media/
    contact/
    search/
    revisions/            # draft, publish, schedule, history (optional shared)

  public-api/
    public-api.module.ts
    controllers/          # or one subfolder per resource

  admin-api/
    admin-api.module.ts
    controllers/
    auth/                 # login, refresh (HTTP only here)

  health/
  swagger/
```

`AppModule` imports: `Config`, `Drizzle`, `Health`, `PublicApiModule`, `AdminApiModule`. It does **not** import every domain module directly.

## Public vs admin separation

### Recommended pattern

- **Domain module** exports `XxxService` (+ optional `XxxRepository`). No HTTP.
- **Controllers** live under `public-api/` and `admin-api/` (or `domain/xxx/controllers/` imported only by one API module).
- **Naming:** `public-publications.controller.ts`, `admin-publications.controller.ts`.

```text
PublicPublicationsController  →  PublicationsService.findPublished(), findPublishedBySlug()
AdminPublicationsController   →  PublicationsService.create(), update(), publish(), import(), …
```

### Rules

| Rule | Detail |
|------|--------|
| Public handlers | Only call `*Published*`, `getPublic*`, or repository methods that enforce publish status |
| Admin handlers | Full CRUD; responses may include internal fields |
| Response schemas | Do not reuse admin Zod response schemas on public routes |
| Contact | `POST` public only; inbox `GET/PATCH` admin only |
| Media | Admin multipart → Cloudinary (server); [media.md](./media.md) |
| Home | `PublicHomeController` → `HomepageService.getPublishedView()` (one aggregate, not N+1 HTTP) |

### Admin module guard

Apply `JwtAuthGuard` (or session guard) at `AdminApiModule` level (`APP_GUARD` scoped to module or `configure(consumer)`). Use `@Public()` on auth login/refresh routes only.

## Domain modules (from product requirements)

| Domain | Spec (pages / admin) | Public API examples | Admin API examples |
|--------|----------------------|---------------------|-------------------|
| `profile` | P02, A03 | About payload | Edit bios, links |
| `homepage` | P01, A03 | Home aggregate | Sections, featured picks |
| `research` | P03–P04, A04 | List/detail by slug | CRUD, relate outputs |
| `publications` | P05–P06, A05 | List/filter, detail, cite/BibTeX | CRUD, DOI/BibTeX import |
| `projects` | P07–P08, A06 | List/detail | Case study CRUD |
| `timeline` | P09–P10, A07 | Achievements, education/experience | Timeline entries |
| `writing` | P11–P12, A08 | Articles list/detail | Editor, publish |
| `talks` | P13, A09 | List if nav enabled | CRUD |
| `collaborations` | P14, A09 | Optional page | CRUD + visibility |
| `media` | A10 | Public file URLs | Library, upload |
| `site` | Nav, SEO, A12 | Nav/footer/meta for SSR | Settings |
| `contact` | P16, A11 | Submit inquiry | Inbox |
| `search` | P17 | Search pubs + writing | Hide from index |
| `auth` | A01 | — | Login, refresh |
| `revisions` | A13 | Preview token | Publish, schedule, restore |

Phasing: MVP public — profile, homepage, publications, projects, contact, site. MVP admin — auth, publications, projects, media, site, contact inbox.

## Files inside a domain module

```
domain/publications/
  publications.module.ts
  publications.service.ts
  publications.repository.ts      # Drizzle queries
  publications-import.service.ts  # admin-only; DOI/BibTeX
  schemas/
    publication.schemas.ts        # Zod: list query, create, update, public vs admin responses
  publications.service.spec.ts
```

| Artifact | Convention |
|----------|------------|
| Zod | `*.schemas.ts`; `z.infer<typeof schema>` for types |
| Service | Transactions, publish rules, orchestration |
| Repository | `@InjectDrizzle()`; no HTTP imports |
| Public controller | `public-api/...` or `public-*.controller.ts` |
| Tests | Unit beside file; e2e under `test/e2e/public/`, `test/e2e/admin/` |

Domain code imports tables from `src/db/schema`, never from controllers.

## Drizzle `db/schema/` layout

```
db/schema/
  index.ts
  columns/
    timestamps.ts
    publishable.ts          # shared status/slug columns pattern

  auth/
  site/
  profile/
  homepage/
  research/
  publications/
  projects/
  writing/
  timeline/
  talks/
  collaborations/
  media/
  contact/
  revisions/
```

`drizzle.config.ts`: `schema: './src/db/schema'`.

User-facing entities that appear on the public site: **`slug`**, **`publishStatus`**, **`publishedAt`** (and `archivedAt` where applicable). Relations: `src/db/relations.ts` with `defineRelations(import * as schema from './schema', ...)`.

## Public list/detail conventions

- **Lists:** filter `published`, exclude `archived`; Zod-validated query (year, type, theme) matches repository; filters belong in **shareable query strings**.
- **Detail by slug:** 404 if not published (do not leak draft existence).
- **Publications:** preserve author order; distinguish preprint vs published in API fields; citation/BibTeX from verified metadata only.

## OpenAPI

- Swagger tags: `Public — Publications`, `Admin — Publications`.
- Reuse Zod schemas with `standardSchemaConverter` (see `src/swagger/setup-swagger.ts`).

## Module dependency graph

```text
PublicApiModule  →  domain modules (read paths)
AdminApiModule   →  domain modules + AuthModule
Domain modules   →  Drizzle (global), each other only when necessary
AppModule        →  Config, Drizzle, Health, PublicApiModule, AdminApiModule
```

Domain modules **export services**; API modules register controllers and guards.

## Legacy / cleanup

- Replace scaffold `AppController` `GET /` when the frontend uses `/api/v1/public/...`.
- Keep `HealthModule` outside product API prefixes.

## Related docs

- [admin-auth.md](./admin-auth.md) — login, registration OTP, cookies, guard
- [media.md](./media.md) — Cloudinary server-side upload, schema, admin endpoints
- [project-decisions.md](../../docs/project-decisions.md) — Cloudinary, CMS `/admin`, schema/search choices
- [nest-drizzle-zod.md](./nest-drizzle-zod.md) — Nest 12, Drizzle, Zod, schema folders
- [AI_ML_Portfolio_Page_by_Page_Content_UX_Requirements.md](../../AI_ML_Portfolio_Page_by_Page_Content_UX_Requirements.md) — product scope (no API design in that doc)
