# I18N-EN — Portuguese → English product strings

Status: done (2026-10-22).

## Scope

Translated user-facing strings in app code (not historical docs/specs or
CHANGELOG entries). Brand name **Money** kept. Brazilian Portuguese URL routes
(`/entrar`, `/minha-conta`, etc.) unchanged.

## Backend

- OpenAPI `detail` summaries/descriptions on transaction and import routes;
  tag names (`Transactions`, `Import`).
- Global HTTP messages in `app.ts` (validation, 404, parse, 500).
- `AppError` / service messages: plan limit, import parse errors, telegram link,
  payment/PIX, account deletion guard, webhook/cron unauthorized responses.
- Auth email subjects in `lib/auth.ts`.
- React Email templates: reset password, verify email, two-factor OTP.

## Shared maps (sync points)

- `frontend/src/lib/auth-errors.ts`, `bot/src/lib/auth-errors.ts`,
  `mobile/src/lib/auth-errors.ts` — better-auth codes → English.
- Category labels: `frontend/src/lib/categories.ts`, `bot/src/formatting/format.ts`,
  `mobile/src/lib/categories.ts`.

## Frontend

- Auth, dashboard, account, checkout, Telegram link, import modal, PIX modal,
  plan section, delete account, transaction form, two-factor UI, landing hero,
  site header, API page copy, export CSV headers.
- E2E expectations updated for English labels (`Free`, `Create account`, etc.).

## Bot

- Menu keyboards, auth flows, conversations (add/list/delete/search/report/balance),
  user gate / PIX replies, PDF report labels, date-range error messages.

## Mobile

- Auth screens, profile/subscription/import flows, application-layer error
  fallbacks, password rule labels.

## Verification

```bash
bun check --no-script -p backend -p frontend -p bot
```

Manual spot-check: `/api` Scalar docs, sign-in/sign-up forms, bot `/start` menu,
dashboard free-plan banner.

## Out of scope (left in Portuguese on purpose)

- Nubank CSV column header `Descrição` in import tests and parser samples.
- Seed/demo transaction descriptions in `backend/prisma/seed.ts`.
- Some mobile import/search copy may still mix English with Nubank column names
  (`Data`, `Valor`, `Descrição`) where they mirror the bank export format.
