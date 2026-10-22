# Architecture

## Purpose and scope

**Agentic Personal Finances** is a forkable personal-finance monorepo
(transactions, categories, reports, PIX subscriptions). It demonstrates one
policy core serving five clients — REST API, web dashboard, Telegram bot,
mobile app, and desktop shell — with shared auth, business rules, and
database.

This document describes the **current** system and a **target** Clean
Architecture / hexagonal mapping for the upcoming refactor. Implementation
choices that change behavior belong in [`decisions/`](./decisions/). Agent
guidance for Lemos-style Clean Architecture:
[`.agents/skills/clean-architecture-in-practice`](../.agents/skills/clean-architecture-in-practice/SKILL.md).

## System context

```text
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Web (Start)  │  │ Mobile       │  │ Desktop      │  │ Telegram bot │
│ + API proxy  │  │ (Expo/Eden)  │  │ (Electron)   │  │ (grammY)     │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │ HTTP            │ HTTP            │ loads web       │ in-process
       └─────────────────┴─────────────────┘                 │
                         │                                   │
                    ┌────▼────┐                              │
                    │ Backend │◄─────────────────────────────┘
                    │ Elysia  │
                    └────┬────┘
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
    Prisma/DB      better-auth      AbacatePay / Resend / telegram-logger
```

Primary actors (driving): web, mobile, bot, cron/webhooks, developers with
API keys. Secondary actors (driven): database, auth store, payment gateway,
e-mail, encryption library.

## Workspace map

```text
packages/core/  Shared application core (`@agentic-personal-finances/core`) — H01+
backend/        ElysiaJS API — auth, transactions, payments, cron, OpenAPI
frontend/       TanStack Start (SSR) dashboard; proxies API paths through its origin
bot/            Telegram bot — calls backend services in-process (no HTTP)
mobile/         Expo + React Native — HTTP + Eden treaty
desktop/        Electron shell that loads the web dashboard (ADR 0009)
scripts/        dev.ts (local stack), qa.ts (QA/pentest pass)
infra/          Docker, compose, Caddy, PM2
setups/         setup/deploy shell scripts
docs/           knowledge base (this file, ADRs, deploy guides)
.agents/        skills, rules, agents, references
```

## Architectural style

### Dependency rule

Source-code dependencies point **inward**, toward policy. Inner code must
not import framework request types, ORM row shapes, or UI packages. Every
other layering choice is negotiable; this rule is not.

Enforced for `packages/core` by `bun run check:deps`
(`scripts/check-dependency-rule.ts`): no imports of Elysia, Prisma, React,
React Native, Expo, grammY, or client workspaces. Wired into `bun run lint`
and the CI `lint` job (H08).

### Hexagonal view (pragmatic)

| Side                 | Role in this repo                                                                                                                                                    |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Application core** | Growing in `@agentic-personal-finances/core` (`Result` / `AppFailure`, transaction ports); legacy rules still in `*.service.ts` / `plan.ts` until H04–H05            |
| **Ports**            | Formal TypeScript ports in `packages/core/src/ports/` for the transactions slice (`TransactionRepository`, `PlanQuotaReader`, `Clock`). Other domains still implicit |
| **Driving adapters** | Elysia `*.routes.ts`, grammY bot, Eden clients, cron/webhook routes, OpenAPI/Scalar docs                                                                             |
| **Driven adapters**  | `backend/src/adapters/prisma/*` (transaction ports + encryption), better-auth, AbacatePay, Resend, `@galhardoalex/telegram-logger`                                   |
| **Composition root** | `backend/src/app.ts` (+ `server.ts` listen), bot entry, `scripts/dev.ts` / `qa.ts`                                                                                   |

This is **Lemos-lite / hexagonal-lite**: vertical slices by capability
(`transactions`, `payments`, …), thin HTTP adapters, repositories as the
only Prisma touchpoint. Shared core already exposes `Result` /
`AppFailure`; HTTP still maps expected failures through `AppError` at the
edge (ADR 0004) until H05 bridges `Result` → response.

### What we deliberately avoid (for now)

- Kind-only top-level folders (`services/`, `repositories/` across domains)
- Interfaces “for mocking” with a single implementation
- One type used as JSON DTO + SQL row + domain model
- Business rules in Elysia handlers or grammY conversations
- Premature CQRS / Unit of Work / full entity-VO layer at this size

## Backend structure

Each domain lives under `backend/src/modules/<domain>/`:

```text
<domain>.schema.ts      Zod request/response schemas + DTO types (contract)
<domain>.routes.ts      Elysia: validation, auth guard, OpenAPI detail; no logic
<domain>.service.ts     business rules; throws AppError; unit-testable
<domain>.repository.ts  the only layer that touches Prisma (when needed)
```

| Domain         | Notes                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------- |
| `users`        | Full four-file module                                                                    |
| `transactions` | Plus `transaction-import.*` (schema/routes/service); reuses `transaction.repository`     |
| `payments`     | Full module + unit tests on the service                                                  |
| `telegram`     | schema/routes/service; **no** repository — orchestrates `userRepository` and link tokens |

- `src/app.ts` builds the app (CORS, OpenAPI, global error mapper, routes)
  without listening; `src/server.ts` calls `listen()` and re-exports the
  `App` type for Eden. Tests import `app.ts`.
- **Errors**: expected failures extend `AppError` (`src/lib/errors.ts`);
  one `onError` maps to `{ success: false, message }`. Validation failures
  return a generic invalid-input message plus field errors without echoing
  schemas; unexpected errors are logged and answered with a generic 500.
- **Auth**: the `auth` macro (`src/lib/auth.plugin.ts`) resolves a
  better-auth session from the cookie **or** an `x-api-key` header.
- **Encryption at rest**: sensitive transaction fields and
  `user.autoGeneratedPassword` use AES-256-GCM (`ENCRYPTION_KEY`).
- **Plans**: free plan allows a fixed transaction quota (`src/lib/plan.ts`);
  PIX payments extend `planExpiresAt`.

### Target mapping (refactor direction)

| Clean Architecture layer | Current home                                 | Likely next step                                                                |
| ------------------------ | -------------------------------------------- | ------------------------------------------------------------------------------- |
| Entities / value objects | Implicit in services                         | Optional shared money/plan types if rules grow                                  |
| Use cases                | `*.service.ts`                               | Keep; rename/split for “screaming” use cases where helpful                      |
| Ports                    | Transactions: `packages/core/src/ports/`     | Wire Prisma/HTTP in H05; add payments/mail ports later — see `system-design.md` |
| Interface adapters       | Routes, Zod, error mapper, bot conversations | Keep thin; map DTOs at the boundary                                             |
| Frameworks & drivers     | Elysia, Prisma, grammY, Expo, Electron       | Stay outside the core                                                           |
| Main                     | `app.ts`, bot entry, scripts                 | Explicit wiring; no new DI container unless needed                              |

## How each client reaches the backend

| Client     | Transport                                                                                                    | Auth                                         | Notes                                                                                                 |
| ---------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Web        | HTTP via frontend origin — `frontend/server.ts` (prod) and Vite proxy (dev) use `frontend/proxy-paths.ts`    | session cookie                               | Proxy makes `Set-Cookie` land on the frontend domain for SSR                                          |
| Mobile     | HTTP, Eden treaty (`mobile/src/lib/api.ts`)                                                                  | cookie via `@better-auth/expo` + SecureStore | Normalize revived `Date`s at the query layer                                                          |
| Bot        | **In-process** — `@agentic-personal-finances/core` use cases + backend Prisma adapters (`bot/src/adapters/`) | chat ↔ `user.telegramChatId`                 | Same use cases as HTTP (ADR 0002). No API HTTP for transactions; bot lockouts and Zod at the boundary |
| Desktop    | Loads the web dashboard URL (`desktop/src/main.ts`)                                                          | same web session                             | No second UI (ADR 0009)                                                                               |
| Developers | OpenAPI 3.1 at `/openapi/json`, Scalar on web `/api`                                                         | `x-api-key`                                  | Documented surface is intentionally narrow today (`/transactions*`)                                   |

End-to-end types: frontend and mobile import `type App` from
`backend/src/server.ts`, so a breaking API change fails client typecheck
(`bun check --no-script`).

## Telegram linking

A chat links only by proving account control: bot e-mail/password login
(rate-limited per chat), or a single-use 15-minute token redeemed on the
web (`/telegram-vincular`). Linking by pasting an account ID was removed
(ADR 0003). Unlink: `DELETE /telegram/link` or the bot’s switch-account flow.

## Stack (current pins)

| Layer         | Technology                                                                   |
| ------------- | ---------------------------------------------------------------------------- |
| Runtime       | **Bun 1.4.4** (`packageManager` / CI); typecheck via `bun check --no-script` |
| API           | ElysiaJS 1.4.x + Zod + `@elysiajs/openapi`                                   |
| Auth          | better-auth (cookies, optional 2FA, API keys, Expo plugin)                   |
| Database      | Prisma 7 — dual schemas SQLite / PostgreSQL                                  |
| Web           | TanStack Start + Query + Tailwind CSS v4; Scalar API reference               |
| Mobile        | Expo SDK 57, Expo Router, NativeWind v4 (dark-only tokens)                   |
| Bot           | grammY + conversations, pdfkit reports                                       |
| Desktop       | Electron + electron-builder                                                  |
| Payments      | AbacatePay PIX                                                               |
| E-mail        | Resend + react-email                                                         |
| Ops alerts    | `@galhardoalex/telegram-logger` (API, bot, web server; optional env)         |
| Tests         | `bun:test`, Jest (mobile), Playwright, Maestro                               |
| Agent tooling | `.agents/skills/` (incl. clean-architecture-in-practice)                     |

Planned upgrades (see `PLAN.md` / project prompt): Elysia 2 RC, Prisma 8 RC,
TanStack Start 1.0 stable — treat each as its own migration, not a drive-by
bump inside a CA refactor.

## Monorepo and runtime constraints

- **`bunfig.toml` → `install.linker = "hoisted"`** — Metro cannot walk bun’s
  isolated linker layout. Side effect: NativeWind/Tailwind resolution needs
  the `mobile/metro.config.js` patch and `patches/nativewind@4.2.7.patch`
  (Dockerfiles must `COPY patches`).
- **Lockfile**: Bun 1.4.4 writes `lockfileVersion: 1` here; pre-commit
  rejects other versions. Install with Bun 1.4.4 only.
- **Two Prisma schemas** — keep both identical except provider;
  `DATABASE_PROVIDER` selects one; regenerate the client to match.
- **Mobile `EXPO_PUBLIC_*`** — inlined at transform time; change values with
  `--clear`.

## Testing (architecture level)

| Layer       | Where                                                                      |
| ----------- | -------------------------------------------------------------------------- |
| Unit        | Service / pure helpers (`*.unit.test.ts`); bot formatting                  |
| Integration | Backend with reset `test.db`; bot with `.env.test`                         |
| Contract    | Eden `App` type across frontend/mobile                                     |
| E2E         | Playwright (web + Expo web), Maestro (native), desktop smoke, `bun run qa` |

Prefer fakes at the **repository / gateway** boundary over mocking Elysia
internals. Bot tests exercise real services when the rule is shared policy.

## Deployment topology (summary)

Production default: Railway (API, web, bot) + Postgres, gated by CI.
Alternatives: VPS (Docker or PM2 + Caddy). Mobile: EAS Build. Details:
[`deploy/`](./deploy).

## Related docs

| Doc                                                                                                          | Role                                                             |
| ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| [`brainstorming.md`](./brainstorming.md)                                                                     | Locked refactor decisions                                        |
| [`system-design.md`](./system-design.md)                                                                     | Target CA layout (`packages/core`, adapters, upgrade order)      |
| [`specs/`](./specs/)                                                                                         | SDD contracts H01–H08 / M01–M03                                  |
| [`../PLAN.md`](../PLAN.md)                                                                                   | Roadmap / session checklist                                      |
| [`decisions/`](./decisions/)                                                                                 | Normative ADRs (Prisma dual schema, bot in-process, AppError, …) |
| [`security.md`](./security.md)                                                                               | Threat notes and deferred risks                                  |
| [`tooling.md`](./tooling.md)                                                                                 | Bun, Biome, hooks, lockfile, telegram-logger                     |
| [`design-system.md`](./design-system.md)                                                                     | Mobile (and evolving web) tokens                                 |
| [`workflows.md`](./workflows.md)                                                                             | Agent/human workflows                                            |
| [`deploy/`](./deploy/)                                                                                       | Railway, Docker/Compose, CI/CD, VPS                              |
| [`.agents/skills/clean-architecture-in-practice`](../.agents/skills/clean-architecture-in-practice/SKILL.md) | Lemos frameworks for the refactor                                |

## Research baseline (Phase 1)

Sources used for this rewrite:

- Current codebase + ADRs 0001–0009
- Otávio Lemos, _Arquitetura Limpa na Prática_ (skill vendored from
  [kali-tools](https://github.com/AlexGalhardo/kali-tools/tree/main/.agents/skills/clean-architecture-in-practice))
- kali-tools `docs/architecture.md` / `architecture-research.md` (hexagon
  vocabulary, anti-patterns, boundary testing — adapted away from that
  product’s Go/Wails domain)
- Bun 1.4.4 tooling: built-in `bun check` as the monorepo typechecker

Phase 2 brainstorming is **locked** — see [`brainstorming.md`](./brainstorming.md)
(shared core, Result in use cases, ports at real boundaries, CA before RC
upgrades). Remaining delivery work is tracked in [`../PLAN.md`](../PLAN.md).
