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
**Register body:** `{ firstName, lastName, userName, email, password }` — `userName` `[a-zA-Z0-9_-]{3,50}`; password **8–128** chars with at least one letter, one digit, one special (set includes `.`), letters/digits/specials only (no spaces). Same policy for **reset** and **change-password** `newPassword`. **Login** password: 8–128 only (no composition). See `admin-password-policy.ts`.  
**Verify body:** `{ otp }` — six digits.

---

## Implementation status (siam-api ↔ frontend)

Audited against `src/admin-api/auth/admin-auth.controller.ts` and `siam-frontend` `adminAuthApi`. Limits are defined in `admin-auth-throttle.constants.ts` and applied via `@nestjs/throttler` (AA2). **429** responses use `{ success: false, message, statusCode: 429 }` (`ThrottlerExceptionFilter`).

| Method | Path | Auth / CSRF | Request DTO | Success `data` | Status | Throttle actual | Frontend |
|--------|------|-------------|-------------|----------------|--------|-----------------|----------|
| `POST` | `login` | `@Public()` | `admin-login.dto.ts` | `AdminProfile` | implemented | 5 / 15 min | `login` → `/admin/login` |
| `POST` | `logout` | Guard + CSRF | — | `null` | implemented | — | `logout` → header |
| `GET` | `check` | Access cookie | — | `AdminProfile` | implemented | — | `check` → `AdminAuthProvider` |
| `POST` | `refresh` | `@Public()` + refresh cookie | — | `{ ok: true }` | implemented | 5 / min | `adminClient` (401 retry) |
| `POST` | `register` | `@Public()` | `admin-register.dto.ts` | `{ pendingId, otpExpiresAt }` | implemented | 3 / hour | `register` → `/admin/register` |
| `POST` | `verify-registration` | `@Public()` | `admin-verify-registration.dto.ts` | `AdminProfile` + cookies | implemented | 5 / 15 min | `verifyRegistration` → `/admin/register/verify` |
| `POST` | `resend-registration-otp` | `@Public()` | — | `{ otpExpiresAt }` | implemented | 3 / 15 min | `resendRegistrationOtp` → verify page |
| `GET` | `registration-status` | `@Public()` | — | `{ registrationEnabled, hasPending, otpExpiresAt?, locked? }` | implemented | — | `registrationStatus` → login/register/verify |
| `POST` | `forgot-password` | `@Public()` | `admin-forgot-password.dto.ts` | `{ message }` | implemented | 5 / 15 min | `forgotPassword` → `/admin/forgot-password` |
| `POST` | `reset-password` | `@Public()` | `admin-reset-password.dto.ts` | `{ message }` | implemented | 5 / 15 min | `resetPassword` → `/admin/reset-password` |
| `POST` | `change-password` | Guard + CSRF | `admin-change-password.dto.ts` | `{ message }` | implemented | — | `changePassword` → `/admin/change-password` |
| `POST` | `mfa/enroll` | Guard + CSRF | — | stub message | **stub** | — | **missing** |
| `POST` | `mfa/verify` | Guard + CSRF | — | — | **missing** | none | **missing** |
| `POST` | `mfa/disable` | Guard + CSRF | — | — | **missing** | none | **missing** |
| `POST` | `login/mfa` (or login + `totp`) | TBD | TBD | TBD | **missing** | — | **missing** (AA6) |

Frontend route map: [siam-frontend/docs/admin-auth-map.md](../../siam-frontend/docs/admin-auth-map.md). Delivery phases: [admin-auth-delivery-phases.md](../../docs/admin-auth-delivery-phases.md).

---

## HTTP errors (API → UI)

Envelope: failed requests use Nest exceptions → `{ success: false, message, … }` (see `apiSuccess` / global filter). Frontend auth forms use `getAuthFormErrorMessage` in `siam-frontend/src/lib/api/errors.ts`.

| Flow | HTTP | When | Typical `message` | Frontend notes |
|------|------|------|-------------------|------------------|
| **Login** | `404` | Unknown email | `Admin not found` | Not mapped to generic 401 copy; user sees API message |
| **Login** | `400` | Wrong password | `Invalid password` | Same |
| **Login** | `429` | Throttled | `Too many requests. Please try again later.` | `getAuthFormErrorMessage` → user throttle copy |
| **Register** | `403` | `ADMIN_REGISTRATION_ENABLED=false` | `Registration disabled` | Login hides register link; register page shows disabled message (AA1) |
| **Register** | `409` | Email taken | `Email already registered` | |
| **Verify OTP** | `400` | No pending | `No pending registration` | |
| **Verify OTP** | `400` | Expired | `OTP expired` | |
| **Verify OTP** | `400` | Wrong code | `Invalid OTP` | Increments `otpAttempts` |
| **Verify OTP** | `403` | Max attempts | `OTP attempts exceeded` | `registration-status.locked` |
| **Forgot password** | `200` | Always | Same generic `message` | No email enumeration |
| **Reset password** | `400` | Bad/expired token | `Invalid or expired token` | |
| **Change password** | `400` | Wrong current | `Invalid current password` | |
| **Change password** | `401` | No session | Unauthorized | Guard |
| **Guarded write** | `403` | CSRF mismatch | Forbidden | Mutations without `X-XSRF-TOKEN` |
| **Session** | `401` | Invalid/expired access | Unauthorized | `adminClient` refresh → retry or `forceLogout` → `/admin/login?reason=session_expired` (+ `returnUrl` when expired on a protected path) |

**Intentional (portfolio):** login distinguishes unknown email (`404`) vs bad password (`400`). Do not collapse to a single `401` without an explicit product change.

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

**Non-auth admin modules (AA1):** `admin-site`, `admin-site-pages`, `admin-media`, and `admin-dashboard` controllers use `@UseGuards(AdminAuthGuard)`; unauthenticated requests receive `401`.

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
6. **`registration-status`:** `{ registrationEnabled, hasPending, otpExpiresAt?, locked?, nextResendAt? }` for UI.

Env: `OTP_EXPIRY_MINUTES`, `OTP_MAX_ATTEMPTS`, `OTP_RESEND_COOLDOWN_SECONDS`, mail provider (`MAIL_PROVIDER`, Gmail or console for dev).

After first admin exists, set **`ADMIN_REGISTRATION_ENABLED=false`** in production (portfolio pattern).

---

## Account recovery and security (A01 — SIAM additions)

Portfolio-api does **not** ship password reset; SIAM implements full **A01** per [project-decisions.md](../../docs/project-decisions.md).

### Password reset

1. **`forgot-password`:** Body `{ email }`. Always return the same success message (do not reveal whether the email exists).
2. Create a **single-use, hashed token** with expiry (e.g. 1 hour); email link to `/admin/reset-password?token=…` (frontend) calling **`reset-password`**.
3. **`reset-password`:** Body `{ token, password }`. Validate token, Argon2id hash new password, mark token `usedAt`. **Existing sessions are not revoked** on reset (AA5); stolen sessions expire naturally or user can sign out elsewhere.

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
