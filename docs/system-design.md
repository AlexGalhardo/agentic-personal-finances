# System design — Agentic Personal Finances

Target shape after the Clean Architecture refactor. Decisions:
[`brainstorming.md`](./brainstorming.md). Current-state detail:
[`architecture.md`](./architecture.md).

## Goals

- One **shared application core** used by API, web, mobile, and bot.
- Clients are **thin driving adapters**; backend owns **driven adapters**
  (DB, payments, mail) and the HTTP edge.
- Teachable open-source layout without over-engineering a personal-finance
  app.
- Stack upgrades (Elysia 2 RC, Prisma 8 RC, TanStack 1.0) happen **after**
  the first CA vertical slice lands.

## Target workspace layout

```text
packages/
  core/                 # name TBD — entities, use cases, ports, Result
backend/                # Elysia routes, Prisma repos, payment/mail adapters, composition
frontend/               # TanStack UI + Eden/HTTP adapter + composition
mobile/                 # Expo UI + Eden/HTTP adapter + composition
bot/                    # grammY adapter; wires in-process adapters to core use cases
desktop/                # Electron shell → web URL (unchanged role, ADR 0009)
```

Exact package name (`@agentic-personal-finances/core` vs `domain`) is fixed
in Phase 3 specs. Root `package.json` workspaces will include `packages/*`.

## Hexagon

```text
                    ┌─────────────────────────────┐
   Web UI ─────────►│                             │
   Mobile UI ──────►│   packages/core             │
   Bot (grammY) ───►│   entities · use cases      │
   HTTP routes ────►│   ports · Result            │
                    │             │               │
                    │             ▼               │
                    │   port interfaces           │
                    └─────────────┬───────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          ▼                       ▼                       ▼
   Prisma repos            Payment gateway            Mail / clock / id
   (backend)               (backend)                  (backend)
```

- **Driving adapters:** Elysia routes, grammY conversations, React screens
  (via a small application façade or direct use-case calls through an HTTP
  port implementation on clients).
- **Driven adapters:** Prisma, AbacatePay, Resend, encryption, system clock.
- **Desktop:** not a domain client — loads the web adapter (ADR 0009).

### Client access to use cases

| Client       | How it runs use cases                                                                                            |
| ------------ | ---------------------------------------------------------------------------------------------------------------- |
| Backend HTTP | Routes → use case → ports (Prisma, …)                                                                            |
| Bot          | Conversations → **same** use cases in-process with backend-provided port implementations (evolves ADR 0002)      |
| Web / mobile | UI → HTTP (Eden) → backend routes → use cases. Optional later: shared query DTOs only — **no** Prisma in clients |
| Desktop      | Web only                                                                                                         |

Clients do **not** embed Prisma. “CA on clients” means: UI / presentation
separated from an application façade and HTTP port, plus shared types from
`packages/core` where useful — not a second copy of repositories.

## First vertical slice

**Transactions** (create, list, delete, import, plan quota checks):

1. Add `packages/core` with Result type, ports (`TransactionRepository`,
   `PlanPolicy` / clock as needed), and use cases extracted from today’s
   `transaction.service.ts`.
2. Backend: repository implements port; routes become thin adapters mapping
   Result → HTTP.
3. Bot: call shared use cases instead of the old service module (same DB
   adapters).
4. Web/mobile: keep Eden → API; adopt shared error/code enums from core where
   it removes duplication.
5. Prove with existing unit tests moved/rewritten against use cases + fakes.

Only after this slice is green: migrate `payments`, `users`/`telegram`, then
dependency upgrades.

## Errors

```text
use case → Result<Output, AppFailure>
                │
                ├─ HTTP adapter → status + { success, message }
                ├─ Bot adapter  → chat copy / lockout
                └─ UI adapter   → toast / inline error
```

`AppFailure` is a tagged union (validation, not found, plan limit, auth, …).
Unexpected throws stay bugs; HTTP `onError` remains a safety net.

## Functional style

- **In `packages/core`:** pure functions, immutable data, no I/O except via
  ports passed into use cases.
- **Outside:** normal Elysia/Prisma/React/grammY code.

## API / OpenAPI

- Public Scalar/OpenAPI surface stays **narrow** (transactions-focused),
  ADR 0008 intent preserved.
- Internal routes need not all appear on the public spec.

## Stack upgrade sequence (after CA slice)

1. Prisma 8 RC (schema/migrations isolated)
2. Elysia 2 RC (+ Eden clients)
3. TanStack Start 1.0 stable
4. Remaining exact stable dep bumps

## Design system

Evolve — see [`design-system.md`](./design-system.md). Impeccable polish on
web aligned to existing tokens; no new brand world in this initiative.

## Quality gates

- `bun run check` (lint + `bun check --no-script` + unit tests) on every
  slice.
- Core package: unit tests with fake ports (no DB).
- Backend/bot: keep integration coverage on the migrated paths.
- No business rules in routes, conversations, or React components.

## Out of scope (this design)

- Full entity/VO catalog for every field on day one
- CQRS / event sourcing
- Second payment provider (port exists for readiness, not dual prod adapters)
- Renaming npm scope `@agent-money-boilerplate/*` (can follow separately)
