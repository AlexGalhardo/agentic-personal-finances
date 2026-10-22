# Spec Driven Development (SDD)

Status: active, created 2026-10-22. Audience: implementation agents and
human reviewers.

Modeled on
[kali-tools/docs/specs](https://github.com/AlexGalhardo/kali-tools/tree/main/docs/specs).
Every non-trivial change starts from a written specification here. A spec is a
**contract**: files, TypeScript signatures, Given/When/Then acceptance,
tests, and verification commands.

An agent implements **one spec at a time**, in the order in §7, and does not
invent requirements the spec does not state.

## 1. Mandatory reading before any spec

1. [`AGENTS.md`](../../AGENTS.md) / [`CLAUDE.md`](../../CLAUDE.md)
2. [`docs/architecture.md`](../architecture.md)
3. [`docs/system-design.md`](../system-design.md)
4. [`docs/brainstorming.md`](../brainstorming.md) (locked decisions)
5. [`.agents/skills/clean-architecture-in-practice`](../../.agents/skills/clean-architecture-in-practice/SKILL.md)
6. The spec itself, including **Non-goals**

## 2. The SDD loop

```text
1. READ      spec + referenced files; re-verify "Current state". If wrong, STOP.
2. TEST      failing tests first (or pin behavior for pure refactors).
3. BUILD     smallest change for the ACs; only listed files.
4. VERIFY    every command in §9 + applicable QGs/DAs. Evidence under
             docs/verification/specs/<ID>.md
5. DOCUMENT  update docs named in §10; tick PLAN.md with evidence.
6. COMMIT    one Conventional Commit per spec (or numbered step), e.g.
             `refactor(core): add Result type (H02)`.
```

Rules: no scope creep (record Follow-ups); no silent behavior change in
refactor specs; never weaken tests; Bun ≥ 1.4.4; English only in code/docs.

## 3. Spec template (12 sections)

```markdown
# <ID> <Title>

| Field      | Value                                     |
| ---------- | ----------------------------------------- |
| PLAN tasks | H0x / M0x                                 |
| Status     | Ready / In progress / Done (date, commit) |
| Depends on | other spec IDs                            |
| Risk       | Low / Medium / High + one line            |

## 1. Goal

## 2. Non-goals

## 3. Current state

## 4. Design

## 5. Files

## 6. Implementation steps

## 7. Acceptance criteria

## 8. Tests

## 9. Verification

## 10. Documentation updates

## 11. Risks and rollback

## 12. Quality and delivery assertions
```

## 4. Global quality gates (QG)

| ID    | Gate                         | Command / artifact                                       | Pass                 | Enforced by            |
| ----- | ---------------------------- | -------------------------------------------------------- | -------------------- | ---------------------- |
| QG-1  | Format/lint                  | `bun run lint`                                           | exit 0               | pre-commit, CI         |
| QG-2  | Typecheck                    | `bun run typecheck` (`bun check --no-script`)            | exit 0               | CI, pre-push (partial) |
| QG-3  | Unit tests                   | `bun run test`                                           | all pass             | CI                     |
| QG-4  | Backend build                | `cd backend && bun run build` (needs Prisma generate)    | exit 0               | CI, pre-push           |
| QG-5  | Frontend build               | `cd frontend && bun run build`                           | exit 0               | CI, pre-push           |
| QG-6  | Lockfile                     | `bun.lock` `lockfileVersion: 1`, Bun 1.4.4               | pre-commit           | hook                   |
| QG-7  | Conventional commits         | commitlint                                               | hook pass            | commit-msg             |
| QG-8  | English-only product surface | no new Portuguese UI/API strings in touched files        | reviewer             |                        |
| QG-9  | Dependency rule (after H08)  | listed assertion / lint rule                             | no forbidden imports | CI / reviewer          |
| QG-10 | Docs sync                    | architecture / system-design / CHANGELOG / PLAN as named | present              | reviewer               |

Native/EAS/hardware checks are `[native]` and may stay pending with an honest
evidence row.

## 5. Capability map

| Module id    | Responsibility                               | Depends on                 |
| ------------ | -------------------------------------------- | -------------------------- |
| core         | Shared entities, use cases, ports, Result    | —                          |
| transactions | Money movements, import, plan quota at write | core                       |
| payments     | PIX plans via AbacatePay                     | core, transactions (quota) |
| identity     | Users, better-auth, telegram link            | core                       |
| clients      | Web/mobile/bot/desktop adapters              | core + HTTP/in-process     |

**Build order:** H01–H08 (hexagonal foundation + transactions slice) → then
payments/identity migration specs (later) → M01–M03 (stack upgrades).

## 6. Shared conventions

- Package name: `@agentic-personal-finances/core` under `packages/core`.
- Ports: TypeScript interfaces **owned by the core** (consumer side), only
  at real boundaries (persistence, payments, mail, clock/id).
- Use cases return `Result<T, AppFailure>`; adapters map to HTTP/bot/UI.
- Pure/immutable code in `packages/core` only.
- Workspace package scopes may still be `@agent-money-boilerplate/*` until a
  dedicated rename spec; new shared package uses the new scope.
- Typecheck: `bun check --no-script`. Full gate: `bun run check`.

## 7. Spec index and execution order

| Order | Spec                                  | Summary                                            |
| ----- | ------------------------------------- | -------------------------------------------------- |
| 1     | [H01](H01-core-package.md)            | Create `packages/core` workspace + exports         |
| 2     | [H02](H02-result-and-failures.md)     | `Result` + `AppFailure` tagged union               |
| 3     | [H03](H03-transaction-ports.md)       | Transaction + plan/clock ports                     |
| 4     | [H04](H04-transaction-use-cases.md)   | Extract create/list/update/delete/import use cases |
| 5     | [H05](H05-backend-http-adapters.md)   | Elysia routes + Prisma adapters → core             |
| 6     | [H06](H06-bot-adapters.md)            | Bot calls core use cases in-process                |
| 7     | [H07](H07-web-mobile-thin-clients.md) | Thin client façades; shared failure codes          |
| 8     | [H08](H08-dependency-rule.md)         | Enforce core cannot import adapters                |
| 9     | [M01](M01-prisma-8.md)                | Prisma 8 RC migration                              |
| 10    | [M02](M02-elysia-2.md)                | Elysia 2 RC + Eden clients                         |
| 11    | [M03](M03-tanstack-1.md)              | TanStack Start 1.0 stable                          |

## 8. Agent report format

```text
Spec: <ID>   Commit(s): <sha…>
ACs: AC-1 ✅ …
Gates: QG-… · DAs: DA-…
Evidence: docs/verification/specs/<ID>.md
Deviations: <none | list>
Follow-ups: <list>
```
