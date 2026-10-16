# Transactional email (Resend)

Admin auth sends **registration OTP** and **password reset** links via [`EmailService`](../src/domain/auth/email.service.ts) and a pluggable **mail transport** ([`libs/mail/`](../src/libs/mail/)).

## Messages

| Method | When | To |
|--------|------|-----|
| `sendAdminRegistrationOtp` | `register`, `resend-registration-otp` | `ADMIN_OTP_RECIPIENT_EMAIL` (owner inbox) |
| `sendPasswordResetLink` | `forgot-password` | Account email from DB |

Templates: [`admin-mail.templates.ts`](../src/domain/auth/admin-mail.templates.ts).

## Environment

| Variable | Default (dev) | Production |
|----------|---------------|------------|
| `MAIL_PROVIDER` | `console` | `resend` |
| `RESEND_API_KEY` | placeholder in `.env.example` | Real key from Resend dashboard (secret, not in git) |
| `MAIL_FROM` | `SIAM Admin <onboarding@resend.dev>` | Verified domain (`noreply@yourdomain.com`) |
| `ADMIN_OTP_RECIPIENT_EMAIL` | your inbox | Ops inbox that receives registration codes |

### `MAIL_PROVIDER=console`

OTP and reset links are written to the API log (`[mail:console] …`). Use this for local dev and CI.

### `MAIL_PROVIDER=resend`

Sends through the [Resend](https://resend.com) API. Requirements:

1. Create an API key (`re_…`).
2. For production, verify your sending domain in Resend and set `MAIL_FROM` accordingly.
3. Sandbox `onboarding@resend.dev` is only for Resend testing — not arbitrary recipients until your domain is verified.

**Boot check:** If `NODE_ENV=production` and `MAIL_PROVIDER=resend`, the API refuses to start without a non-placeholder `RESEND_API_KEY`.

In non-production, `MAIL_PROVIDER=resend` with a placeholder key falls back to console transport and logs a warning.

## Enable Resend locally (when you have a key)

In `siam-api/.env` (do not commit secrets):

```env
MAIL_PROVIDER=resend
RESEND_API_KEY=re_your_key_here
MAIL_FROM=SIAM Admin <onboarding@resend.dev>
ADMIN_OTP_RECIPIENT_EMAIL=you@example.com
```

Restart the API, register or request a password reset, confirm delivery in the Resend **Emails** UI.

## CI and tests

- Unit/e2e use `MAIL_PROVIDER=console` (see [`vitest.setup.ts`](../vitest.setup.ts)).
- E2e mocks `EmailService` — no outbound HTTP to Resend in CI.

## Architecture

- `MailTransport` interface — [`mail-transport.types.ts`](../src/libs/mail/mail-transport.types.ts)
- `ConsoleMailTransport` — dev/CI; logs `devPreview` (may include OTP or reset URL)
- `ResendMailTransport` — production; logs recipient, subject, and Resend `messageId` only (no OTP/token in logs)
