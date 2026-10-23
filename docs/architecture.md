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
4. **Zod at the HTTP edge** — each public/admin **feature module** has a `dto/` folder: **one file per API contract** (body, query, params, optional response); types via `z.infer`. Not `class-validator` class DTOs.
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
    public-api.module.ts    # imports feature modules only (no flat controller list)
    <feature>/              # e.g. site/, site-pages/, publications/
      public-<feature>.module.ts
      public-<feature>.controller.ts
      public-<feature>.service.ts   # facade — controller calls only this
      dto/                          # one Zod schema + z.infer type per file
      services/                     # optional: single-job helpers used by facade

  admin-api/
    admin-api.module.ts     # imports feature modules only
    <feature>/              # e.g. auth/, site-pages/, media/
      admin-<feature>.module.ts
      admin-<feature>.controller.ts
      admin-<feature>.service.ts    # facade — controller calls only this
      dto/
      services/                     # one class per file (login, session, …)

  health/
  swagger/
```

`AppModule` imports: `Config`, `Drizzle`, `Health`, `PublicApiModule`, `AdminApiModule`. It does **not** import every domain module directly.

## Public vs admin separation

### Recommended pattern

- **Domain module** exports `XxxService` (+ optional `XxxRepository`). No HTTP, no route DTOs.
- **API feature module** (under `public-api/<feature>/` or `admin-api/<feature>/`) owns the controller, `dto/`, facade service, and optional `services/` specialists.
- **`PublicApiModule` / `AdminApiModule`** only import feature modules — not a flat `controllers/` array.
- **Naming:** `public-site-pages.controller.ts`, `admin-site-pages.controller.ts` inside each feature folder.

```text
PublicSitePagesController
  → PublicSitePagesService (facade)
  → SitePagesService.findPublished(), findPublishedBySlug()   # domain

PublicResearchController
  → PublicResearchService (facade)
  → ResearchService.listPublished(), findPublishedBySlug()     # domain

AdminSitePagesController
  → AdminSitePagesService (facade)
  → SitePagesService.create(), update(), publish(), …         # domain

AdminResearchController
  → AdminResearchService (facade)
  → ResearchService.create(), update(), publish(), schedule(), …  # domain

AdminAuthController
  → AdminAuthService (facade)
  → AdminLoginService / AdminSessionService / …               # admin-api/auth/services/
```

### Rules

| Rule | Detail |
|------|--------|
| Public handlers | Only call `*Published*`, `getPublic*`, or repository methods that enforce publish status |
| Admin handlers | Full CRUD; responses may include internal fields |
| Response DTOs | Do not reuse admin Zod response DTOs on public routes; separate files under each feature’s `dto/` |
| Contact | `POST` public only; inbox `GET/PATCH` admin only |
| Media | Admin multipart → Cloudinary (server); [media.md](./media.md) |
| Home | `PublicHomeController` → `HomepageService.getPublishedView()` (one aggregate, not N+1 HTTP) |

### Admin module guard

Apply `JwtAuthGuard` (or session guard) at `AdminApiModule` level (`APP_GUARD` scoped to module or `configure(consumer)`). Use `@Public()` on auth login/refresh routes only.

## API feature modules (public and admin)

Same layout on **both** surfaces. HTTP stays in `public-api/` and `admin-api/`; persistence and publish rules stay in `domain/`.

```
public-api/site-pages/
  public-site-pages.module.ts
  public-site-pages.controller.ts
  public-site-pages.service.ts      # thin facade → domain SitePagesService
  dto/
    site-page-by-slug-params.dto.ts # e.g. slugParamSchema + SlugParam

admin-api/auth/
  admin-auth.module.ts
  admin-auth.controller.ts
  admin-auth.service.ts             # thin facade — delegates only
  dto/
    admin-login.dto.ts              # adminLoginBodySchema + AdminLoginBody
    admin-register.dto.ts
  services/
    admin-login.service.ts
    admin-registration.service.ts
    admin-session.service.ts
```

| Layer | Responsibility |
|--------|----------------|
| **Controller** | Routes, `@Body({ schema })` / `@Query({ schema })`, cookies/status; **return plain DTO** (or `null` for empty DELETE) — do not call `apiSuccess()` |
| **HTTP envelope** | Global `ApiEnvelopeInterceptor` → `{ success: true, data }`; `HttpExceptionFilter` → `{ success: false, message, statusCode, validationErrors? }` — see `src/common/http/api-response.ts` |
| **`dto/*.dto.ts`** | Zod for **inputs**; response `*-response.dto.ts` files supply `z.infer` types (+ optional Swagger). **No** runtime response serializer — contract checked by TypeScript and tests |
| **Facade `*.service.ts`** | Maps HTTP to domain/specialists; no fat SQL unless unavoidable |
| **`services/*.ts`** (optional) | One class, one job — auth login, session DB, registration OTP, etc. |
| **Domain `domain/*`** | Drizzle, transactions, `findPublished*`, publish rules — imported by facades |

Shared list/pagination Zod shapes live in `common/pagination/` (e.g. `{ items, meta: { page, limit, itemCount, total, totalPages } }` via `paginatedResponseSchema`); do not put route DTOs in `domain/`.

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
  publications.service.spec.ts

public-api/publications/
  public-publications.module.ts
  public-publications.controller.ts
  public-publications.service.ts
  dto/
    publication-list-query.dto.ts
    publication-slug-params.dto.ts

admin-api/publications/
  admin-publications.module.ts
  admin-publications.controller.ts
  admin-publications.service.ts
  dto/
    create-publication.dto.ts
    update-publication.dto.ts
```

| Artifact | Convention |
|----------|------------|
| HTTP Zod | `public-api/.../dto/*.dto.ts` and `admin-api/.../dto/*.dto.ts`; `z.infer<typeof schema>` for types |
| Domain service | Transactions, publish rules, orchestration |
| API facade | `public-*.service.ts` / `admin-*.service.ts` — controller’s only service dependency |
| Repository | `@InjectDrizzle()`; no HTTP imports |
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
- **Admin preview:** `GET admin/research/:id/preview` (admin auth) returns the same public detail DTO as `GET public/research-themes/:slug`, via `PublicResearchService.previewById` (`findByIdAdmin` + shared mapping). Drafts remain 404 on the public slug route.
- **Admin revisions:** `GET admin/research/:id/revisions` and `POST .../revisions/:revisionId/restore` use shared `RevisionsService` with entity type `research_theme`; snapshots on create, update, lifecycle, and restore.
- **Research cover:** `coverMediaId` on admin create/update must reference an image in `media` (`MediaService.assertImageMediaId`). Public list/detail resolve `url` and `alt` via `MediaService.findById` (not stored on the theme row).
- **Public research (P03/P04):** `GET public/research-themes` and `GET :slug` are the runtime source for `/research` and `/research/:slug`; list cards expose `relatedCounts.publications` and `relatedCounts.projects` from theme junction links (published related items only). Public detail may include `prevSlug` / `nextSlug` (adjacent published themes by `sortOrder`, then title). `related.talks` stays empty until M11.
- **Research sitemap:** `getPublicSite().sitemapPaths` includes `/research` and `/research/{slug}` for each published theme (`ResearchService.listPublishedSlugs`).
- **Publications sitemap:** `getPublicSite().sitemapPaths` includes `/publications` and `/publications/{slug}` for each published publication (`PublicationsService.listPublishedSlugs`).
- **Projects sitemap:** `getPublicSite().sitemapPaths` includes `/projects` and `/projects/{slug}` for each published project (`ProjectsService.listPublishedSlugs`).
- **Writing sitemap:** `getPublicSite().sitemapPaths` includes `/writing` and `/writing/{slug}` for each published article when at least one exists (`WritingService.listPublishedSlugs`). Public nav shows Writing only when `/writing` is in `sitemapPaths`.
- **Dev seed:** `pnpm run db:seed` (non-production) runs `seedDevAdmin`, research themes, publications, projects, writing, and timeline from `src/db/seed/*.catalog.ts` (mix of draft/published). Timeline seed includes `dev-showcase-award` with two gallery images. Publish remaining drafts via admin. Project seed needs PROJ11 junction migrations; writing seed needs WRIT11 junction migrations (`writing_article_*`); timeline seed needs ACH1 tables (`timeline_entries`, `timeline_entry_media`).
- **Home publication highlights:** `GET public/home` includes `selectedPublications[]` from published rows with `featuredOnHome` (max 4 returned), same pattern as `researchFocus`.
- **Home project highlights:** `GET public/home` includes `selectedProjects[]` from published rows with `featuredOnHome` (max 3), with cover URLs when alt text is set.
- **Projects (M7):** Admin CRUD, publish lifecycle, preview, public list/detail, related outputs, section figures; `GET admin/projects` for R14 picker search.
- **Theme relations:** `GET/PUT admin/research/:id/publications` and `.../projects` ordered junctions; public detail `related.publications[]` / `related.projects[]`.
- **Research resources:** child table `research_theme_resources` (`label`, HTTPS `url`, `resourceType`, `sortOrder`). Admin create/update replace all rows for the theme when `resources` is sent; revision snapshots include the resource list. Public detail returns ordered resources (no internal ids).
- **Research hub intro:** `site_settings.research_hub_intro` (nullable text), editable in admin site settings. `GET public/research-themes` returns `{ intro, items }` (cards in `items`).
- **Home research focus:** `GET public/home` includes `researchFocus[]` from published themes with `featuredOnHome` (max 6 returned, max 6 may be flagged in admin). At most six themes may have `featuredOnHome` at once across all publish statuses.
- **Research publish checklist:** `GET admin/research/:id/publish-check` returns `{ errors, warnings }` from `researchPublishChecklist`. `POST .../publish` accepts optional `{ confirmWarnings: true }`; checklist **errors** always block; **warnings** require confirmation (`code: PUBLISH_WARNINGS` when omitted).
- **Publication publish checklist:** `GET admin/publications/:id/publish-check` returns `{ errors, warnings }` from `publicationPublishChecklist`. `POST .../publish` accepts optional `{ confirmWarnings: true }`; same error/warning gating as research (`PUBLISH_BLOCKED` / `PUBLISH_WARNINGS` on the exception body).
- **Publications:** preserve author order; distinguish preprint vs published in API fields; citation/BibTeX from verified metadata only.

## OpenAPI

- Swagger tags: `Public — Publications`, `Admin — Publications`.
- Reuse route Zod schemas from each feature’s `dto/` with `standardSchemaConverter` (see `src/swagger/setup-swagger.ts`).

## Module dependency graph

```text
PublicApiModule       →  public-api/<feature> modules  →  domain modules (read paths)
AdminApiModule        →  admin-api/<feature> modules   →  domain modules + libs (auth, media, …)
Domain modules        →  Drizzle (global), each other only when necessary
AppModule             →  Config, Drizzle, Health, PublicApiModule, AdminApiModule
```

Domain modules **export services**. Feature modules under `public-api/` and `admin-api/` register controllers, facades, `dto/`, and guards (admin).

## Legacy / cleanup

- Replace scaffold `AppController` `GET /` when the frontend uses `/api/v1/public/...`.
- Keep `HealthModule` outside product API prefixes.

## Related docs

- [admin-auth.md](./admin-auth.md) — login, registration OTP, cookies, guard
- [media.md](./media.md) — Cloudinary server-side upload, schema, admin endpoints
- [project-decisions.md](../../docs/project-decisions.md) — Cloudinary, CMS `/admin`, schema/search choices
- [nest-drizzle-zod.md](./nest-drizzle-zod.md) — Nest 12, Drizzle, Zod, schema folders
- [AI_ML_Portfolio_Page_by_Page_Content_UX_Requirements.md](../../AI_ML_Portfolio_Page_by_Page_Content_UX_Requirements.md) — product scope (no API design in that doc)
