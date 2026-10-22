# H03 Transaction ports

| Field      | Value                               |
| ---------- | ----------------------------------- |
| PLAN tasks | H03                                 |
| Status     | Ready                               |
| Depends on | H02                                 |
| Risk       | Low: interfaces only; no wiring yet |

## 1. Goal

Declare consumer-owned port interfaces in `packages/core` for the transactions
vertical slice: persistence of transactions, reading plan quota for a user,
and an injectable clock. Signatures must be implementable by the existing
Prisma repositories without leaking Prisma types into core.

## 2. Non-goals

- Do not implement Prisma adapters (H05).
- Do not move encryption into core (stays in backend adapter).
- Do not add payment/mail ports (later domains).

## 3. Current state

- `transaction.repository.ts` — Prisma create/list/update/delete.
- `userRepository.findPlanQuota` used by `transactionService.create`.
- Encryption of description/amount happens in the service before repository
  write — adapters will own encryption; ports speak **domain** values
  (plaintext description, numeric amount) or explicitly documented encrypted
  payloads. **Decision for H03:** ports use domain plaintext fields; the
  Prisma adapter encrypts/decrypts (moves encrypt call from service into
  adapter in H05).

## 4. Design

```typescript
// packages/core/src/ports/transaction-repository.ts
import type { Result } from "../result";
import type { AppFailure } from "../failures";

export type TransactionRecord = {
  readonly id: string;
  readonly userId: string;
  readonly description: string;
  readonly amount: number;
  readonly category: string;
  readonly type: "income" | "expense";
  readonly date: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date | null;
};

export type NewTransaction = Omit<
  TransactionRecord,
  "id" | "createdAt" | "updatedAt"
>;

export type TransactionRepository = {
  create(input: NewTransaction): Promise<Result<TransactionRecord, AppFailure>>;
  findById(
    userId: string,
    id: string,
  ): Promise<Result<TransactionRecord, AppFailure>>;
  list(
    userId: string,
    query: ListQuery,
  ): Promise<Result<readonly TransactionRecord[], AppFailure>>;
  update(
    userId: string,
    id: string,
    patch: Partial<NewTransaction>,
  ): Promise<Result<TransactionRecord, AppFailure>>;
  delete(userId: string, id: string): Promise<Result<void, AppFailure>>;
  countForUser(userId: string): Promise<Result<number, AppFailure>>;
};

export type ListQuery = {
  readonly type?: "income" | "expense";
  readonly category?: string;
  readonly from?: Date;
  readonly to?: Date;
  readonly search?: string;
  readonly limit?: number;
  readonly offset?: number;
};
```

```typescript
// packages/core/src/ports/plan-quota.ts
export type PlanQuota = {
  readonly plan: string;
  readonly planExpiresAt: Date | null;
  readonly transactionCount: number;
};

export type PlanQuotaReader = {
  getQuota(userId: string): Promise<Result<PlanQuota, AppFailure>>;
};
```

```typescript
// packages/core/src/ports/clock.ts
export type Clock = { now(): Date };
```

Refine field lists against `transaction.schema.ts` / repository during
implementation; keep Prisma types out of these files.

## 5. Files

| Action | Path                                              |
| ------ | ------------------------------------------------- |
| Create | `packages/core/src/ports/*.ts` + `ports/index.ts` |
| Modify | `packages/core/src/index.ts`                      |

## 6. Implementation steps

1. Add port modules; export barrels.
2. Typecheck core.
3. Doc note in architecture.md ports table.

## 7. Acceptance criteria

- **AC-1** Ports compile with no value imports from backend.
- **AC-2** `TransactionRecord.amount` is `number` (not encrypted string).
- **AC-3** Every port method that can fail returns `Promise<Result<…>>`
  (Clock is sync/pure).

## 8. Tests

- Compile-only / type-level: a fake `TransactionRepository` object in a test
  file that returns `ok`/`err` satisfies the type (assignability test).

## 9. Verification

```bash
bun check --no-script -p packages/core
bun test packages/core
```

## 10. Documentation updates

- `docs/architecture.md` ports section
- `PLAN.md`, `CHANGELOG.md`

## 11. Risks and rollback

Mismatch with Zod schemas — resolve in H04/H05 by adapting at boundaries.
Rollback: delete `ports/`.

## 12. Quality and delivery assertions

| ID   | Check                      | Pass                                      |
| ---- | -------------------------- | ----------------------------------------- |
| DA-1 | No Prisma import in ports  | rg Prisma packages/core/src/ports → empty |
| DA-2 | Fake repository typechecks | test file compiles                        |

Evidence: `docs/verification/specs/H03.md`
