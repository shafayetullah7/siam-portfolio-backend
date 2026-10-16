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
| `POST` | `forgot-password` | Public | throttled | Start reset → email time-limited token (A01) |
| `POST` | `reset-password` | Public | throttled | Token + new password |
| `POST` | `change-password` | `AdminAuthGuard` | — | Current + new password (A01) |
| `POST` | `mfa/enroll` | `AdminAuthGuard` | — | Start TOTP enrollment (A01, optional) |
| `POST` | `mfa/verify` | `AdminAuthGuard` | — | Confirm TOTP; store secret |
| `POST` | `mfa/disable` | `AdminAuthGuard` | — | Disable MFA (require password or TOTP) |

**Login body:** `{ email, password }` — when MFA enabled for admin, second step: `{ totp }` or dedicated `POST login/mfa` after partial auth (design at implement time).  
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

## Account recovery and security (A01 — SIAM additions)

Portfolio-api does **not** ship password reset; SIAM implements full **A01** per [project-decisions.md](../../docs/project-decisions.md).

### Password reset

1. **`forgot-password`:** Body `{ email }`. Always return the same success message (do not reveal whether the email exists).
2. Create a **single-use, hashed token** with expiry (e.g. 1 hour); email link to `/admin/reset-password?token=…` (frontend) calling **`reset-password`**.
3. **`reset-password`:** Body `{ token, password }`. Validate token, Argon2id hash new password, invalidate token and optionally revoke other sessions.

Reuse **`EmailService`** and throttling patterns from registration OTP.

### Change password (signed in)

**`change-password`:** `{ currentPassword, newPassword }` — verify current hash, update `admin_local_auth.password`.

### MFA (optional enrollment)

Requirements: owner may **enroll** in MFA, not forced for all users (single admin).

- Store TOTP secret (encrypted) on `admin_local_auth` or `admin_mfa` table; `mfaEnabled` flag.
- **Login:** if MFA enabled, require valid TOTP after password (two-step).
- **Enroll / disable:** guarded routes; disable requires re-auth.

Exact table columns and endpoint names can match Nest module layout at implementation time; behaviour must satisfy A01 acceptance checks.

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

Auth HTTP lives under **`admin-api/auth/`** (feature module). Persistence helpers may stay in `domain/auth/` (repositories) or co-locate with specialists — facades call domain/repos, not controllers.

```
src/
  libs/hashing/                 # Argon2id hash + verify (e.g. `@node-rs/argon2`)
  libs/cookie/                  # CookieService (portfolio parity)
  domain/auth/                  # optional: AdminRepository, PendingAdminRepository, shared types
    admin.repository.ts
    pending-admin.repository.ts
  common/guards/
    admin-auth.guard.ts
  admin-api/
    auth/
      admin-auth.module.ts
      admin-auth.controller.ts
      admin-auth.service.ts           # facade — only entry from controller
      dto/
        admin-login.dto.ts            # one file per body/query/params contract
        admin-register.dto.ts
        admin-verify-registration.dto.ts
        …
      services/
        admin-login.service.ts
        admin-registration.service.ts
        admin-session.service.ts      # refresh, logout, session rows, cookies
        admin-password.service.ts     # forgot / reset / change (optional split)
```

- **Controller** → **`AdminAuthService` (facade)** → `services/*` (+ repositories / `EmailService` / `JwtService`).
- **DTOs:** Zod 4 + `@Body({ schema })`; `export type X = z.infer<typeof xSchema>` in the same `dto/*.dto.ts` file — not `class-validator` classes.
- `AdminApiModule` imports `AdminAuthModule` (and other `admin-api/<feature>` modules). Other admin features use `AdminAuthGuard` at module or route level.

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
