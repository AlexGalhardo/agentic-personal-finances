# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `ENABLE_PAYWALL` feature flag (backend and bot, default `true`). Set it to
  `false` to switch the whole payment requirement off: no free-plan
  transaction limit, the Telegram bot no longer asks for a plan or offers PIX
  checkout, `/payments/*` and the AbacatePay webhook answer 404/503, and the
  web app hides the plan section and redirects `/checkout` to the account
  page. `/config` exposes it as `enablePaywall`.

## [1.2.0] - 2026-10-27

### Added

- Mobile: on-device account. First launch shows **Create your account**
  (name, email, password; stored in the local SQLite `account` table, password
  hashed with PBKDF2-SHA256); later launches show **Sign in**. The app locks on
  cold start and after 60 s in the background.
- Mobile: **Settings > Biometric unlock** (fingerprint / face through the
  Android system prompt, device PIN or pattern as fallback) and **Lock now**.
- Mobile: unit tests for password hashing and sign-up validation.

## [1.1.0] - 2026-10-24

### Added

- `APP_MODE` (`local` default, offline-first/SQLite; `hosted` for the
  multi-user production deploy, which requires PostgreSQL). The Railway image
  sets `hosted`.
- README tour with five GIFs (`docs/assets/gifs/`) and the
  `scripts/readme-gifs.ts` recorder.
- Landing, sign-in and sign-up redesigned around green "money" branding: a
  viewport-fit landing page with only a **Login** button in the navbar and an
  animated balance card in the second grid column; split-screen auth pages.
- Whole-account JSON backup (`account-backup` in
  `@agentic-personal-finances/core`): **Export .json** on the web/desktop
  dashboard and **Settings > Export all data** on mobile; the web **Import**
  dialog and the mobile **Import backup** screen accept it.
- Desktop app embeds the standalone server (API + web + SQLite) and runs
  fully offline; `DESKTOP_APP_URL` / `--url` still point it at a remote one.
- `setups/setup-standalone.sh` and `deploy-android-apk.sh --gradle`.

### Fixed

- Railway deploys failed since the dashboard started importing
  `@agentic-personal-finances/core`: the Docker images now copy
  `packages/core` and every workspace manifest the lockfile expects.

### Changed

- Web routes translated to English: `/login`, `/signup`, `/forgot-password`,
  `/reset-password`, `/account`, `/contact`, `/terms`, `/privacy`,
  `/telegram-link` (old Portuguese URLs no longer exist).
- Signed-out pages (landing, login, sign-up, contact, terms, privacy) are
  always dark and their navbar only has a **Login** button; the theme can only
  be changed from the user menu once logged in.
- **Mobile is offline-first**: transactions live in local SQLite
  (`expo-sqlite`); login, sign-up, API client, subscription and 2FA screens
  and the Playwright web E2E were removed. Maestro flow updated.
- Root `bun run build` and `backend` `bun run build` now target SQLite
  (`build:postgres` keeps the production binary).
- Release workflow: 30/60-minute job timeouts (a hung Electron smoke test held
  a runner for 6 h), standalone server built before packaging the desktop app,
  no API URL baked into the APK.
- Setup scripts no longer require `mobile/.env`; README documents testing
  every workspace and downloading release builds.

- Remaining Portuguese UI copy, aria-labels, validation/error messages, bot
  replies and PDF/export labels translated to English (frontend, bot,
  backend payment route). Nubank CSV sample data and `Salário` fixtures are
  unchanged.

## [0.10.0] - 2026-10-22

### Added

- Identity and Telegram link ports/use cases in
  `@agentic-personal-finances/core` (`UserProfileStore`,
  `TelegramLinkTokenStore`; profile, deletion, chat link flows) — H10.
- Backend Prisma identity/telegram adapters; bot calls core use cases
  in-process via `bot/src/adapters/identity-telegram.ts` (H10).
- `bun run build:standalone` — single Bun-compiled binary (API + web +
  SQLite) at the repo root (gitignored); Zod-validated boot env.
- Zod env validation for frontend (`src/config/env.ts`, `server-env.ts`),
  desktop (`src/config/env.ts`), and tighter mobile `EXPO_PUBLIC_*` parsing;
  SSR session/plan responses parsed with Zod.
- Shared workspace `@agentic-personal-finances/core` (`packages/core`) —
  bootstrap for the hexagonal refactor (H01).
- `Result` / `AppFailure` helpers in `@agentic-personal-finances/core` (H02).
- Transaction ports in `@agentic-personal-finances/core`
  (`TransactionRepository`, `PlanQuotaReader`, `Clock`) — H03.
- Transaction use cases + pure `plan` helpers in
  `@agentic-personal-finances/core` (H04; backend service still wired until
  H05).
- Backend Prisma ports + `Result`→`AppError` HTTP bridge for transactions
  (H05).
- Bot transaction conversations wired to `@agentic-personal-finances/core`
  use cases via shared Prisma adapters (H06).
- Web and mobile thin-client layout: Eden in `adapters/http`, screen-facing
  `application/*` façades (H07).
- Dependency Rule gate: `bun run check:deps` /
  `scripts/check-dependency-rule.ts` (H08).
- Payment plan catalog, `PaymentGateway` / `PaymentStore` ports, and PIX
  checkout/webhook use cases in `@agentic-personal-finances/core` (H09).
- Backend Prisma payment store and AbacatePay gateway adapters; thin
  `payment.service` façade over core use cases (H09).
- Ops alerts via [`@galhardoalex/telegram-logger`](https://github.com/AlexGalhardo/telegram-logger)
  in `backend`, `bot`, and the frontend production server (`warn` /
  `error` / `fatal`; optional `TELEGRAM_LOGGER_*` env).
- Deploy docs: `docs/deploy/docker.md` (Compose + Railway image), expanded
  `docs/deploy/railway.md` / `ci-cd.md` for main-only push.
- Railway IaC (`.railway/railway.ts`): DOCKERFILE builder, shared
  `infra/Dockerfile`, custom domain `finances.vukem.dev`.
- Release workflow publishes a standalone localhost zip
  (`agentic-personal-finances-standalone-*.zip`) beside the other
  downloadables.
- `@types/node` at the monorepo root; `"type": "module"` on every workspace
  `package.json`.

### Changed

- Stack upgrades M01–M03: Prisma 8 RC CLI with Prisma 7.10.1 client hybrid
  (`prisma7` migrate/generate, `prisma.config.ts` for ORM 8 side-by-side);
  Elysia 2.0.0-rc.0 with `@elysia/*` plugins and route/macro/onError migrations;
  TanStack Start 1.169.4 and Router 1.170.46; aligned mobile Query/Zod pins.
- Product-facing API messages, OpenAPI summaries, web/mobile/bot UI copy, auth
  error maps, category labels, and transactional emails are English-only
  (legacy Portuguese URL paths unchanged).
- Landing footer and contact page copy in English (Contact / Terms of use /
  Privacy policy).
- Renamed workspace npm scope `@agent-money-boilerplate/*` →
  `@agentic-personal-finances/*` (`backend`, `frontend`, `bot`, `mobile`,
  `desktop`); `@agentic-personal-finances/core`
  unchanged.
- App logo (`docs/assets/logo.svg`): green money bag, no outer ring.
- Frontend and mobile screens import `application/*` instead of the Eden treaty
  directly; `lib/api.ts` re-exports the HTTP adapter for compatibility (H07).
- Renamed the project to **Agentic Personal Finances** (repo
  `agentic-personal-finances`); README simplified.
- Moved agent skills, rules, agents and references from `.claude/` to
  `.agents/` (`.claude/settings.json` remains for Claude Code plugins).
- Renamed workspace `desktop-electronjs/` → `desktop/`.
- Added skill `clean-architecture-in-practice` (from kali-tools).
- Pinned **Bun 1.4.4** (`packageManager`, `engines`, CI) and switched
  typechecking to Bun's built-in `bun check --no-script`.
- Rewrote `docs/architecture.md` (hexagonal / Clean Architecture mapping
  for this monorepo; research baseline for the upcoming refactor).
- Added SDD suite (`docs/specs/` H01–H08, M01–M03), `docs/system-design.md`,
  `docs/brainstorming.md`, and replaced `PLAN.md` with the new roadmap.
- Documented the agent/human working workflow (PLAN → one Ready spec →
  evidence → push `main` → CI) in `AGENTS.md` / `CLAUDE.md`,
  `CONTRIBUTING.md`, and `docs/workflows.md`; CI job `core` for
  `packages/core`. Direct-to-`main` replaces the former `dev` merge flow.
- Pre-commit runs Biome format+check on all `*.ts`/`*.tsx`, then
  `bun run typecheck`.

### Fixed

- QA web group aborted (`net::ERR_ABORTED`) on CI: a cold Vite dev server
  discovered TanStack Start and Better Auth deps mid-session and force-reloaded
  the page; they are now pre-bundled via `optimizeDeps.include`.
- QA desktop/bot asserts aligned with English UI and bot copy.
- Standalone build uses `prisma7 migrate deploy` (Prisma 8 CLI no longer owns
  migrate).

## [0.6.0] - 2026-09-30

### Added

- Electron desktop app (`desktop/`), the fifth workspace, wrapping
  the web dashboard (ADR 0009).
- `bun run dev:all` starts the whole local stack (API, web, Expo on the LAN
  IP, desktop).
- `bun run qa`: QA/pentest pass over the API, web, desktop, bot and the
  Android emulator.
- `release.yml` builds every downloadable (Bun executables, Electron
  installers, Android APK, iOS simulator app) and publishes them on `v*` tags.
- `/api` renders the developer API reference with Scalar from an OpenAPI spec
  generated from the routes' Zod schemas.
- Mobile dark-only redesign on a token design system (`docs/design-system.md`)
  and a Playwright suite on the Expo web build; Maestro flows for native E2E.
- Prettier + markdownlint for Markdown, commitlint, root `bun run check`.
- `docs/` knowledge base (architecture, conventions, workflows, ADRs, deploy
  guides) and vendored agent skills in `.agents/skills/`.

### Changed

- Renamed to Agent Money Boilerplate (package scope and app name); infra
  files moved to `infra/`, root shell scripts to `setups/`.
- Backend errors go through one `AppError` hierarchy and a single error
  mapper; the app is built separately from `.listen()`.
- Dashboard and account pages split into focused components.
- Setup scripts consolidated into `setups/setup-docker.sh` and
  `setups/setup-pm2.sh`; setup and infra comments translated to English.
- CI: desktop package and QA jobs, bot binary build, `scripts/` typecheck.
- `mobile-build.yml` no longer queues an EAS `production` build on `main`;
  the release APK comes from `release.yml`.

### Removed

- **BREAKING**: linking a Telegram chat by pasting an account ID (bot) or a
  chat ID (web). Link through the bot login or the single-use web token.
- `xlsx` dependency (abandoned, known CVEs).
- Mobile light theme and toggle.

### Fixed

- Bot `/cancelar` was swallowed by an active conversation.
- Mobile amount field: editing with the caret mid-value scrambled the amount
  (the caret now stays at the end).
- Maestro flows fixed and run on an Android emulator for the first time.
- QA web group no longer flakes on a cold Vite dev server.
- Bot PIX checkout error, main menu reachable before login, Google login link.
- Nubank CSV import button styling and import modal width.
- Invalid `x-api-key` answered 500 instead of 401.
- Per-service Dockerfiles failed without `patches/`; Docker setup skipped
  seeding while waiting on a nonexistent endpoint.
- Deterministic seed data.

### Security

- OWASP Top 10 audit (`docs/security.md`): bot login lockout, encrypted
  auto-generated passwords, `GET /users/me` DTO, constant-time secret
  comparison, Zod-validated webhooks, input size limits, atomic link-token
  redeem, Telegram Markdown escaping, frontend security headers, http(s)-only
  images, CSV/XLSX formula-injection neutralization, no credentials in the
  seed or setup scripts.

## [0.1.0] - 2026-09-20

First versioned release. The 0.0.x entries below were never tagged; they are
recorded from the commit history.

### Added

- `CONTRIBUTING.md`, Conventional Commits and SemVer.

## 0.0.9 - 2026-09-20

### Fixed

- Vite proxy in E2E and admin logout.

### Security

- Leaked secrets removed from the repository.

## 0.0.8 - 2026-09-20

### Added

- Automated EAS Build for the mobile app; documented the deploy gate.

### Fixed

- E2E tests.

## 0.0.7 - 2026-09-20

### Changed

- Mobile UI rewritten with reacticx.

## 0.0.6 - 2026-09-19

### Added

- GitHub Actions CI/CD pipeline gating the Railway deploy.

## 0.0.5 - 2026-09-19

### Changed

- Mobile app rewritten on the shared backend.

## 0.0.4 - 2026-09-19

### Added

- Telegram bot authentication flow, translated auth errors, community skills.

## 0.0.3 - 2026-09-17

### Changed

- `api/` renamed to `backend/`; Railway deploy.

### Fixed

- Proxy and 2FA issues.

## 0.0.2 - 2026-09-15

### Added

- Branding, category icons, developer API keys, bot menu UX.

## 0.0.1 - 2026-09-15

### Added

- Initial application: auth, dashboard, transactions, PIX payments, Telegram
  bot.

[Unreleased]: https://github.com/AlexGalhardo/agentic-personal-finances/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/AlexGalhardo/agentic-personal-finances/compare/v1.1.0...v1.2.0
[0.10.0]: https://github.com/AlexGalhardo/agentic-personal-finances/compare/v0.9.0...v0.10.0
[0.6.0]: https://github.com/AlexGalhardo/agentic-personal-finances/compare/v0.5.0...v0.6.0
[0.1.0]: https://github.com/AlexGalhardo/agentic-personal-finances/releases/tag/v0.1.0
