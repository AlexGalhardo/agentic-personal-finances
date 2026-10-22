# Brainstorming — Agentic Personal Finances refactor

Decisions for the Clean Architecture / hexagonal refactor. Mark options with
`[x]`.

## Status

- Phase 0: agents layout, desktop rename, remote, Bun 1.4.4 — done (uncommitted)
- Phase 1: `docs/architecture.md` research rewrite — done
- Phase 2: decisions below — **locked** (2026-10-22)
- Phase 3: specs under `docs/specs/` — written; implement via `PLAN.md`

## Decisions

### 1. Where does Clean Architecture apply?

- [x] **Backend and all clients** (web, bot, mobile, desktop)
- [ ] Backend only; clients stay thin UI/adapters

**Notes:** Clients get a CA-shaped structure too, not only the API.

### 2. How deep on each client?

- [ ] **A — Full rings per client**
- [x] **B — Shared core + thin clients**
- [ ] **C — Feature slices, light CA**

**Notes:** Shared workspace for entities, use cases, and ports. `frontend`,
`mobile`, and `bot` are mainly driving adapters + composition; `desktop`
stays an Electron shell around web. Shared core must not import
Elysia/Prisma/React.

### 3. What lives in the shared package?

- [ ] **A — Domain only**
- [x] **B — Domain + application**
- [ ] **C — Fat shared kit**

**Notes:** Entities, use cases, and port interfaces in shared. Zod HTTP DTOs
and Eden helpers stay in adapters.

### 4. Formal ports (TypeScript interfaces)?

- [x] **A — Ports only at real boundaries**
- [ ] **B — Port for every dependency**
- [ ] **C — Keep concrete modules for now**

**Notes:** Persistence, payments, mail, clock/id (and similar). No ports
invented only for unit-test mocking.

### 5. Errors: exceptions vs Result/Either?

- [ ] **A — Keep AppError exceptions + edge mapper**
- [x] **B — Result/Either in use cases**
- [ ] **C — Hybrid**

**Notes:** Shared use cases return Result (ok/err). Adapters map to
HTTP/bot/UI. Exceptions = bugs. HTTP `onError` remains for the edge until
migration completes.

### 6. Functional style (pure functions / immutability)?

- [x] **A — Core only**
- [ ] **B — Aggressive FP**
- [ ] **C — Light touch**

**Notes:** Pure + immutable in the shared package. Adapters stay pragmatic.

### 7. RC upgrades vs CA refactor order?

- [ ] **A — Stabilize stack first**
- [x] **B — CA skeleton first**
- [ ] **C — Interleave by domain**

**Notes:** Shared package + one vertical slice (transactions) on current
Elysia 1.4 / Prisma 7 / TanStack. Then Prisma 8 RC, Elysia 2 RC, TanStack
1.0 stable.

### 8. Design system / Impeccable scope?

- [x] **A — Evolve current system**
- [ ] **B — Full Impeccable redesign**
- [ ] **C — Defer UI**

**Notes:** Keep mobile dark-only tokens. Align web with Impeccable against
`docs/design-system.md` — no greenfield brand redesign.

### 9. OpenAPI public surface?

- [x] **A — Keep narrow documented surface**
- [ ] **B — Document the full authenticated API**
- [ ] **C — Split specs**

**Notes:** Public OpenAPI/Scalar stays focused (e.g. transactions); other
routes remain app-internal.

## Summary

| #   | Choice                                        |
| --- | --------------------------------------------- |
| 1   | CA on backend **and** clients                 |
| 2   | Shared core + thin clients                    |
| 3   | Shared = domain + application (ports)         |
| 4   | Formal ports only at real boundaries          |
| 5   | Result/Either in use cases                    |
| 6   | FP pure/immutable in core only                |
| 7   | CA skeleton before major RC upgrades          |
| 8   | Evolve existing design system with Impeccable |
| 9   | Narrow public OpenAPI surface                 |
