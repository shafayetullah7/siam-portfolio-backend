# Media uploads (Cloudinary, server-side)

Aligned with **byte-forge-auth** `modules/media` + `libs/modules/cloudinary`. Portfolio requirements: A10. Decisions: [project-decisions.md](../../docs/project-decisions.md).

## Principle

- **Server-side upload only** — admin sends `multipart/form-data` to `siam-api`; Nest uses Multer → buffer → Cloudinary SDK with API secrets.
- **No client-direct Cloudinary upload** (no unsigned preset / widget from the browser). Appropriate for low-frequency owner uploads; keeps secrets off the client.

Public site never uploads files; it only displays URLs from **published** content that reference `media` rows.

---

## Request flow

```text
siam-frontend /admin  →  POST /api/v1/admin/media/upload(…)
                         FileInterceptor (MIME + size)
                         AdminMediaService.uploadFile()
                           → CloudinaryService.uploadFile(buffer, { folder })
                           → DB transaction:
                               media + cloudinary_media + admin_upload_media
                         ← { id, url, fileName, mimeType, size, … }

On DB failure after Cloudinary success  →  destroy(public_id)  (compensating rollback)
```

Delete:

```text
DELETE /api/v1/admin/media/:id
  → load media + ownership
  → if usesCount > 0 → 403 (file in use)
  → transaction: delete junction + cloudinary_media + media
  → CloudinaryService.deleteFile(publicKey)
```

Attach to content (publication, project, profile, …) in **domain services**:

- Insert join row (e.g. `publication_media.mediaId`).
- Call `MediaRepository.incrementMediaUsage(mediaIds, tx)` inside the same transaction (same idea as byte-forge `MediaService.useMedia`).
- On detach, decrement usage (or rely on join FK + triggers — prefer explicit decrement in service).

---

## Nest modules

| Piece | Location (convention) |
|--------|-------------------------|
| `CloudinaryModule` | `src/libs/cloudinary/` — provider, service, `buildCloudinaryUploadOptions()` |
| `MediaModule` | `src/domain/media/` — repository, `AdminMediaService` |
| HTTP | `src/admin-api/media/` — `admin-media.controller.ts`, facade `admin-media.service.ts`, `dto/` — **admin only** |
| No | Public upload controller (byte-forge has seller uploads; SIAM does not) |

`MediaModule` imports `CloudinaryModule`. `AdminApiModule` imports `AdminMediaModule` (`admin-api/media/`), which imports `MediaModule`.

Env (`env.schema` + `AppConfigService`): `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

---

## HTTP endpoints (admin)

Mirror byte-forge `AdminMediaController` paths under global prefix `api/v1`:

| Method | Path | Notes |
|--------|------|--------|
| `POST` | `admin/media/upload` | Allowed MIME enum; max **10MB**; Cloudinary folder `admin/media` |
| `POST` | `admin/media/upload/image` | Image MIMEs only; max **3MB**; folder `admin/images` |
| `DELETE` | `admin/media/:id` | Zod param `id` (uuid); auth required when Phase 5 ships |

Multipart field name: **`file`**.

Guard: `AdminApiModule` auth (stub acceptable until auth phase).

Responses: Zod-shaped JSON (Nest 12 Standard Schema); include `media.id` and `url` for CMS pickers. Plain English `message` strings — **no i18n** (unlike byte-forge `nestjs-i18n`).

---

## Cloudinary upload options

From byte-forge `cloudinary-upload.options.ts`:

- Set `folder` per endpoint.
- Raster images (jpeg/png/webp): `transformation` width/height **2048** `crop: limit`, `quality: auto:good`, `flags: strip_profile`.
- GIF: `strip_profile`.
- PDF/video/audio: folder only (confirm Cloudinary resource type for PDFs/raw).

Implementation: `upload_stream` from Multer `file.buffer` (see byte-forge `CloudinaryService`).

---

## Drizzle schema

### Tables

**`media`**

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `fileName` | varchar | original name |
| `mimeType` | pg enum | whitelist matches upload filter |
| `size` | integer | bytes |
| `url` | text | Cloudinary `secure_url` |
| `usesCount` | integer default 0 | block delete when &gt; 0 |
| `alt` | text optional | A10 |
| `caption` | text optional | A10 |
| `license` | text optional | A10 |
| `createdAt` / `updatedAt` | timestamptz | |

Optional: `uses` **jsonb** — small list `{ table, recordId }[]` like byte-forge for “where used” hints; join tables remain source of truth for FK integrity.

**`cloudinary_media`**

| Column | Type |
|--------|------|
| `id` | uuid PK |
| `mediaId` | uuid FK → media, unique, on delete cascade |
| `publicKey` | varchar unique — Cloudinary `public_id` |

**`admin_upload_media`**

| Column | Type |
|--------|------|
| `id` | uuid PK |
| `mediaId` | uuid FK → media |
| `adminId` | uuid FK → admin/owner user (single-owner portfolio) |

No `user_upload_media` (no marketplace sellers).

### Content links

Use per-domain join tables, not duplicate Cloudinary ids on every entity:

- `publication_media`, `project_media`, portrait FK on profile, etc.
- `displayOrder` where ordering matters (see byte-forge `product_media`).

Files: `src/db/schema/media/*.ts`, `drizzle.config` → `schema: './src/db/schema'`.

---

## Frontend (`/admin`)

- `FormData` append `file`; `fetch('/api/v1/admin/media/upload/image', { method: 'POST', body, credentials: 'include' })`.
- Do **not** load Cloudinary upload widget or expose preset/API key to the browser.

---

## Public API

- No upload routes on `PublicApiModule`.
- Public responses expose `url` (and alt text) only for media attached to **published** entities.

---

## Testing

- Unit: mock `CloudinaryService`; mock `getDrizzleToken()` or `MediaRepository`.
- Assert rollback calls `deleteFile` when insert throws.

---

## Reference implementation

`byte-forge-auth`:

- `src/modules/media/` — `admin-media.service.ts`, `media.repository.ts`, `admin-media.controller.ts`
- `src/libs/modules/cloudinary/` — `cloudinary.service.ts`, `cloudinary-upload.options.ts`
- `src/_db/drizzle/schema/media/` — `media.schema.ts`, `cloudinary.media.schema.ts`, `admin.upload.media.schema.ts`

---

## Related docs

- [architecture.md](./architecture.md) — `domain/media`, admin API layout
- [nest-drizzle-zod.md](./nest-drizzle-zod.md) — Zod, Drizzle, transactions
