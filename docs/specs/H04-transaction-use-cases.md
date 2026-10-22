# H04 Transaction use cases

| Field      | Value                                              |
| ---------- | -------------------------------------------------- |
| PLAN tasks | H04                                                |
| Status     | Ready                                              |
| Depends on | H03                                                |
| Risk       | Medium: behavior must match existing service tests |

## 1. Goal

Move transaction application rules from
`backend/src/modules/transactions/transaction.service.ts` (and import
service) into pure-ish use-case functions in `packages/core` that depend
only on ports + `Result`. Preserve observable behavior for create, list,
get, update, delete, and import validation/quota checks.

## 2. Non-goals

- Do not switch Elysia routes yet (H05).
- Do not change bot (H06).
- Do not change HTTP status codes or DTO JSON field names.
- Do not relocate Prisma schema.

## 3. Current state

- `transactionService` methods: `create`, list/get/update/delete (verify
  exact exports in `transaction.service.ts` before coding).
- Throws `TransactionNotFoundError`, `FreeLimitReachedError`, uses
  `transactionAllowance` from `backend/src/lib/plan.ts`.
- Unit tests: `transaction.service.unit.test.ts`,
  `transaction-import.service.unit.test.ts`.
- Encryption currently in service — use cases receive/return plaintext
  domain records; encryption moves to adapter in H05. **During H04**, use
  cases may still be called only from tests with fakes (no production wire).

## 4. Design

```typescript
// packages/core/src/use-cases/transactions/create-transaction.ts
export type CreateTransactionInput = {/* mirror Zod fields without Zod */};

export type CreateTransactionDeps = {
  readonly transactions: TransactionRepository;
  readonly plans: PlanQuotaReader;
  readonly clock: Clock;
  readonly allowance: (quota: PlanQuota) => number; // or import pure fn from core/plan.ts
};

export function createTransaction(
  deps: CreateTransactionDeps,
  userId: string,
  input: CreateTransactionInput,
): Promise<Result<TransactionRecord, AppFailure>>;
```

Move `transactionAllowance` into `packages/core/src/plan.ts` as a pure
function (copy logic from `backend/src/lib/plan.ts`; backend re-exports or
delegates in H05 to avoid drift).

Failure mapping:

| Old throw                | AppFailure.code |
| ------------------------ | --------------- |
| FreeLimitReachedError    | `plan_limit`    |
| TransactionNotFoundError | `not_found`     |
| validation               | `invalid_input` |

English messages in new failures.

## 5. Files

| Action | Path                                                                 |
| ------ | -------------------------------------------------------------------- |
| Create | `packages/core/src/plan.ts` (+ tests)                                |
| Create | `packages/core/src/use-cases/transactions/*.ts` (+ tests with fakes) |
| Modify | `packages/core/src/index.ts`                                         |
| Keep   | backend service as-is until H05 (duplicate briefly OK)               |

## 6. Implementation steps

1. Port `transactionAllowance` + unit tests from backend plan tests.
2. Implement use cases with fake ports; mirror cases from
   `transaction.service.unit.test.ts`.
3. Export public API.
4. Leave backend service untouched (behavior freeze).

## 7. Acceptance criteria

- **AC-1** Create blocked when allowance < 1 → `err` with `plan_limit`.
- **AC-2** Get/update/delete missing id → `not_found`.
- **AC-3** Successful create returns `ok` with persisted record from fake repo.
- **AC-4** No `throw` of domain failures inside use cases (only Result).
- **AC-5** Existing backend unit tests still pass unchanged.

## 8. Tests

- Ported/adapted table tests under `packages/core/src/use-cases/transactions/`
- `plan.test.ts` for allowance edges

## 9. Verification

```bash
bun test packages/core
bun run --cwd backend test:unit
bun check --no-script -p packages/core -p backend
```

## 10. Documentation updates

- `docs/system-design.md` first slice progress
- `PLAN.md`, `CHANGELOG.md`

## 11. Risks and rollback

Temporary duplication with backend service — resolved in H05. Rollback:
delete use-case files; keep plan.ts only if desired.

## 12. Quality and delivery assertions

| ID   | Check                                   | Pass                              |
| ---- | --------------------------------------- | --------------------------------- |
| DA-1 | Core tests cover plan_limit + not_found | named tests pass                  |
| DA-2 | Backend unit tests unchanged green      | `bun run --cwd backend test:unit` |
| DA-3 | Use cases import only core modules      | no backend imports                |

Evidence: `docs/verification/specs/H04.md`
