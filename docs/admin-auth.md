# Admin authentication (portfolio-api parity)

Match **`portfolio-api`** (`/home/wtaslim2/Desktop/projects/portfolio/portfolio-api`) admin login and registration: cookie-based JWT, DB sessions, email OTP for first admin signup. SIAM uses Nest 12 **Zod Standard Schema** on routes (not `nestjs-zod` / `createZodDto`). **No i18n** — plain English messages.

Reference module: `src/api/admin/admin-auth/`.

---

## Endpoints

Base: `api/v1/admin/auth` (portfolio uses `@Controller({ path: 'admin/auth', version: '1' })` + global prefix `api`).

| Method | Path | Auth | Throttle (portfolio) | Purpose |
|--------|------|------|----------------------|---------|
| `POST` | `login` | Public | 5 / 15 min | Email + password → cookies + `{ admin }` |
| `POST` | `logout` | `AdminAuthGuard` | — | Revoke session, clear cookies |
| `GET` | `check` | Cookie access token | — | Validate session → `{ admin }` |
| `POST` | `refresh` | Refresh cookie | 5 / min | New access token cookie |
| `POST` | `register` | Public | 3 / hour | Start signup → email OTP |
| `POST` | `verify-registration` | Public | 5 / 15 min | 6-digit OTP → create `admins` row |
| `POST` | `resend-registration-otp` | Public | 3 / 15 min | Resend OTP (cooldown) |
| `GET` | `registration-status` | Public | — | Pending OTP state for UI |

**Login body:** `{ email, password }`  
**Register body:** `{ firstName, lastName, userName, email, password }` — `userName` `[a-zA-Z0-9_-]{3,50}`, password min 8.  
**Verify body:** `{ otp }` — six digits.

---

## Cookies & CSRF (same as portfolio-api)

Set on login (`CookieService`):

| Cookie | httpOnly | Purpose |
|--------|----------|---------|
| `adminAccessToken` | yes | JWT access (~1h `maxAge` in portfolio) |
| `adminRefreshToken` | yes | JWT refresh (`SESSION_MAX_AGE`) |
| `xsrf-token` | **no** (readable) | CSRF double-submit |

Options: `secure: true`, `sameSite: 'none'` (cross-origin frontend + API), `domain: COOKIE_DOMAIN` in production.

**`AdminAuthGuard`:** for `POST`/`PUT`/`PATCH`/`DELETE`, require header `X-XSRF-TOKEN` === cookie `xsrf-token`.  
On expired access token: auto-refresh from `adminRefreshToken`, set new access cookie, continue.

**Frontend (`/admin`):** `credentials: 'include'`; on mutating requests send `X-XSRF-TOKEN` from `document.cookie` / parsed `xsrf-token`.

**`main.ts`:** `cookie-parser()`, CORS `credentials: true`, `FRONTEND_URL` (+ dev localhost ports as in portfolio).

---

## JWT payloads

Access & refresh both include: `{ sub: admin.id, sessionId: session.id, role: 'admin' }`.

Separate secrets: `JWT_ADMIN_ACCESS_SECRET`, `JWT_ADMIN_REFRESH_SECRET`  
Expiries: `JWT_ADMIN_ACCESS_EXP`, `JWT_ADMIN_REFRESH_EXP` (duration strings, e.g. `1h`, `7d`).

---

## Login flow

1. `findByEmail` → `admin_local_auth` ⋈ `admins`.
2. `HashingService.verify(password, hash)` — **Argon2id** (not bcrypt; portfolio-api uses bcrypt — SIAM diverges here).
3. `createSession(adminId, userAgent, ip)` → `sessions` + `admin_sessions`.
4. Sign access + refresh JWT; random `xsrfToken` (32-byte hex).
5. Set cookies; return admin profile (no tokens in JSON body).

Errors: unknown email → `404` “Admin not found”; bad password → `400` “Invalid password” (portfolio behaviour).

---

## Registration flow (single-owner)

Controlled by **`ADMIN_REGISTRATION_ENABLED`** (`true` | `false`). When `false`, all register endpoints → `403`.

1. **`register`:** Check email/username unique. Hash password + OTP. **`replacePending`:** delete **all** rows in `pending_admins`, insert one row (only one open registration at a time).
2. Email **`sendAdminRegistrationOtp`** to **`ADMIN_OTP_RECIPIENT_EMAIL`** (not necessarily the registrant’s inbox — owner approves via code sent to trusted email).
3. Return `{ pendingId, otpExpiresAt }`.
4. **`verify-registration`:** Load latest pending; check attempts &lt; `OTP_MAX_ATTEMPTS`, OTP not expired, `compare(otp, otpHash)`; on success `createAdmin` transaction (`admins` + `admin_local_auth`), delete pending.
5. **`resend-registration-otp`:** Cooldown `OTP_RESEND_COOLDOWN_SECONDS` if OTP still active.
6. **`registration-status`:** `{ hasPending, otpExpiresAt?, locked? }` for UI.

Env: `OTP_EXPIRY_MINUTES`, `OTP_MAX_ATTEMPTS`, `OTP_RESEND_COOLDOWN_SECONDS`, mail provider (`MAIL_PROVIDER`, Gmail or console for dev).

After first admin exists, set **`ADMIN_REGISTRATION_ENABLED=false`** in production (portfolio pattern).

---

## Drizzle tables (relational)

| Table | Role |
|--------|------|
| `admins` | `id`, `firstName`, `lastName`, `userName` (unique) |
| `admin_local_auth` | `adminId` PK, `email` unique, `password` hash, `verified` |
| `sessions` | `userAgent`, `ip`, `revoked`, `logoutAt`, `expiresAt` |
| `admin_sessions` | `adminId` ↔ `sessionId` |
| `pending_admins` | signup + `otpHash`, `otpExpiresAt`, `otpAttempts`, `otpSentAt` |

Files: `src/db/schema/auth/` (SIAM layout).

---

## Nest module layout (siam-api)

```
src/
  libs/hashing/              # Argon2id hash + verify (e.g. `@node-rs/argon2`)
  libs/cookie/               # CookieService (portfolio parity)
  domain/auth/               # or admin-api/auth/
    admin-auth.module.ts
    admin-auth.service.ts
    admin-registration.service.ts
    admin.repository.ts
    pending-admin.repository.ts
    schemas/admin-auth.schemas.ts   # Zod: login, register, verify
  common/guards/
    admin-auth.guard.ts
  admin-api/
    controllers/admin-auth.controller.ts
```

`AdminApiModule` imports `AdminAuthModule`. Other admin controllers use `@UseGuards(AdminAuthGuard)` globally or per-controller.

Dependencies: `@nestjs/jwt`, `@nestjs/throttler`, `cookie-parser`, **`@node-rs/argon2`** (or `argon2`) for passwords.

---

## Env (add to `env.schema.ts`)

Portfolio reference — `portfolio-api/src/_config/env.schema.ts`:

- `JWT_ADMIN_ACCESS_SECRET`, `JWT_ADMIN_REFRESH_SECRET` (min 32 chars)
- `JWT_ADMIN_ACCESS_EXP`, `JWT_ADMIN_REFRESH_EXP`
- `SESSION_MAX_AGE` (ms, cookie maxAge)
- `COOKIE_DOMAIN` (production)
- `FRONTEND_URL`, optional `CORS_EXTRA_ORIGINS`
- Argon2 params (document in env or constants): e.g. `ARGON2_MEMORY_KIB`, `ARGON2_TIME_COST`, `ARGON2_PARALLELISM` — no `SALT_ROUNDS` / bcrypt
- `ADMIN_REGISTRATION_ENABLED`, `ADMIN_OTP_RECIPIENT_EMAIL`
- `OTP_EXPIRY_MINUTES`, `OTP_MAX_ATTEMPTS`, `OTP_RESEND_COOLDOWN_SECONDS`
- Mail: `MAIL_PROVIDER`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASSWORD`, `MAIL_FROM_*`

---

## Differences for SIAM (intentional)

| Topic | portfolio-api | siam-api |
|--------|---------------|----------|
| DTOs | `nestjs-zod` `createZodDto` | Zod 4 + `StandardSchemaValidationPipe` |
| Password hash | bcrypt (`SALT_ROUNDS`) | **Argon2id** |
| Responses | `ResponseService.success` wrapper | Same shape recommended for frontend reuse |
| i18n | none in auth | none |
| Rate limit | `@nestjs/throttler` on controller | replicate limits |

---

## Tests

Mirror `portfolio-api/test/admin-registration.e2e-spec.ts`: mock `EmailService`, capture OTP from `sendAdminRegistrationOtp`, exercise register → verify → login.

---

## Related

- [architecture.md](./architecture.md) — `AdminApiModule`, guards
- [project-decisions.md](../../docs/project-decisions.md) — `/admin` CMS, CORS/cookies
- [media.md](./media.md) — admin routes use same guard + CSRF
