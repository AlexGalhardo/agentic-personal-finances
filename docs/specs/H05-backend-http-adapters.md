# H05 Backend HTTP and Prisma adapters

| Field      | Value                                                        |
| ---------- | ------------------------------------------------------------ |
| PLAN tasks | H05                                                          |
| Status     | Done                                                         |
| Depends on | H04                                                          |
| Risk       | High: production API path; must keep Eden types and statuses |

## 1. Goal

Wire `packages/core` transaction use cases into the backend: Prisma
repositories implement ports (with encryption), Elysia routes call use cases
and map `Result` → HTTP via a single mapper. Remove or thin
`transaction.service.ts` so it does not own business rules anymore.

## 2. Non-goals

- Do not migrate payments/users/telegram.
- Do not upgrade Elysia/Prisma versions (M01/M02).
- Do not change public OpenAPI field names.
- Do not modify bot yet (H06).

## 3. Current state

- Routes in `transaction.routes.ts` / `transaction-import.routes.ts` call
  `transactionService`.
- Global `onError` maps `AppError` (ADR 0004).
- Eden `App` type from `server.ts` consumed by frontend/mobile.

## 4. Design

```typescript
// backend/src/adapters/prisma/transaction-repository.ts
export function createPrismaTransactionRepository(...): TransactionRepository

// backend/src/adapters/http/map-result.ts
export function resultToResponse<T>(result: Result<T, AppFailure>): { status: number; body: unknown }

// Mapping sketch:
// ok → 200/201 + existing success envelope
// plan_limit → 402 or current FreeLimitReached status (preserve exact code)
// not_found → 404
// invalid_input → 400
```

Routes become:

```typescript
const result = await createTransaction(deps, userId, body);
return resultToResponse(result); // or throw AppError from mapper for onError compatibility
```

**Compatibility option (allowed):** mapper converts `AppFailure` → existing
`AppError` subclasses so `onError` stays unchanged; prefer one path, document
choice in the PR.

Composition: build `deps` once in module scope or per-request in routes file.

Backend may depend on `@agentic-personal-finances/core` via `workspace:*`.

## 5. Files

| Action | Path                                                    |
| ------ | ------------------------------------------------------- |
| Create | `backend/src/adapters/prisma/*`                         |
| Create | `backend/src/adapters/http/map-result.ts` (+ tests)     |
| Modify | `transaction.routes.ts`, import routes                  |
| Modify | `transaction.repository.ts` and/or replace with adapter |
| Modify | `transaction.service.ts` — delete or re-export shims    |
| Modify | `backend/package.json` — workspace dep on core          |
| Modify | unit tests to target adapters/use cases                 |

## 6. Implementation steps

1. Add core dependency; implement Prisma port + encryption.
2. Implement Result→HTTP/AppError mapper with tests for each code.
3. Switch routes; run backend unit + integration tests.
4. Delete dead service code.
5. `bun check --no-script -p backend -p frontend -p mobile` (Eden).

## 7. Acceptance criteria

- **AC-1** Create/list/update/delete/import HTTP behavior matches pre-H05
  (status + JSON shape) for happy path and plan limit / not found.
- **AC-2** `transaction.service.ts` no longer contains quota/business rules
  (or file removed).
- **AC-3** Frontend/mobile typecheck still passes against `App`.
- **AC-4** Encryption still applied at rest (integration or unit on adapter).

## 8. Tests

- Mapper unit tests per `AppFailureCode`
- Adapted former service unit tests → use case + prisma fake or keep use
  case tests in core; adapter encrypt tests
- Existing integration tests green

## 9. Verification

```bash
bun run --cwd backend db:generate   # DATABASE_URL set
bun run --cwd backend test          # unit + integration
bun check --no-script -p backend -p frontend -p mobile
bun run --cwd backend build
cd frontend && bunx playwright test
bun run desktop:smoke
bun run qa                          # scripts/qa.ts --start (api + web + bot; android if SDK)
```

## 10. Documentation updates

- `docs/architecture.md` backend layering
- ADR note or new ADR if AppError bridge is temporary
- `PLAN.md`, `CHANGELOG.md`

## 11. Risks and rollback

Breaking Eden or status codes — mitigate with integration tests. Rollback:
revert H05 commit; core can remain.

## 12. Quality and delivery assertions

| ID   | Check                             | Pass                                      |
| ---- | --------------------------------- | ----------------------------------------- |
| DA-1 | Backend tests green               | `bun run --cwd backend test`              |
| DA-2 | No business quota logic in routes | reviewer                                  |
| DA-3 | Client typecheck                  | frontend + mobile `bun check --no-script` |

Evidence: `docs/verification/specs/H05.md`
