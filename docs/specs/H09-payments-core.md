# H09 Payments → core

| Field      | Value                         |
| ---------- | ----------------------------- |
| PLAN tasks | Payments → core               |
| Status     | Done (2026-10-22)             |
| Depends on | H05, H08                      |
| Risk       | Medium: money path; keep HTTP |

## 1. Goal

Move payment/plan application rules into `@agentic-personal-finances/core`
ports + use cases (`Result`/`AppFailure`). Backend AbacatePay + Prisma become
adapters; routes/cron/webhook keep the same public shapes and status codes.

## 2. Non-goals

- Do not change AbacatePay API contract or PIX amounts/labels.
- Do not migrate better-auth / telegram (H10).
- Do not upgrade Prisma/Elysia (M01/M02).
- Do not expand OpenAPI.

## 3. Current state

- `backend/src/modules/payments/payment.service.ts` owns checkout, status
  poll, simulate, webhook reconciliation, plan activation math, expire cron.
- `PLAN_DEFINITIONS` in `payment.schema.ts`; `addMonths` / `activatePlanForCharge`
  in the service.
- Bot `user-gate` imports `paymentService` from backend.
- Thin clients already call HTTP (`application/payments.ts`).

## 4. Design

### Ports (core-owned)

```typescript
type PlanId = "monthly" | "yearly"; // match PLAN_DEFINITIONS keys

interface PaymentGateway {
  createPixCharge(input: {
    amount: number;
    description: string;
    expiresInSeconds: number;
    metadata: Readonly<Record<string, unknown>>;
  }): Promise<Result<PixChargeRemote, AppFailure>>;
  getPixChargeStatus(externalId: string): Promise<Result<PixChargeRemote, AppFailure>>;
  simulatePixPayment(externalId: string): Promise<Result<PixChargeRemote, AppFailure>>;
}

interface PaymentStore {
  createPendingCharge(...): Promise<Result<{ chargeId: string }, AppFailure>>;
  findChargeForUser(chargeId: string, userId: string): Promise<Result<ChargeRecord | null, AppFailure>>;
  findChargeByExternalId(externalId: string): Promise<Result<ChargeRecord | null, AppFailure>>;
  findChargeById(chargeId: string): Promise<Result<ChargeRecord, AppFailure>>;
  setChargeStatus(chargeId: string, status: string): Promise<Result<void, AppFailure>>;
  applyPaidPlan(input: { chargeId: string; userId: string; planExpiresAt: Date }): Promise<Result<void, AppFailure>>;
  appendLog(...): Promise<Result<void, AppFailure>>;
  listLogs(userId: string): Promise<Result<PaymentLogRecord[], AppFailure>>;
  getUserPlan(userId: string): Promise<Result<{ planStatus: string; planExpiresAt: Date | null }, AppFailure>>;
  expireOverduePlans(now: Date): Promise<Result<number, AppFailure>>;
}
```

### Pure helpers

- Move `PLAN_DEFINITIONS` (+ months/amount/label) into
  `packages/core/src/plans/catalog.ts`.
- `computePlanExpiry(base: Date, months: number): Date` (current `addMonths`).
- `isPaidRemoteStatus(status: string): boolean`.

### Use cases

| Use case               | Notes                                            |
| ---------------------- | ------------------------------------------------ |
| `createPixCheckout`    | gateway + store + clock                          |
| `getPixCheckoutStatus` | expire locally / poll gateway / activate         |
| `simulatePixCheckout`  | `forbidden` when test mode flag false (via deps) |
| `handlePaymentWebhook` | re-check gateway before activate; log failures   |
| `expireOverduePlans`   | cron                                             |
| `getPlanStatus`        | read model                                       |
| `listPaymentHistory`   | read model                                       |

Failure mapping: not found → `not_found`; test mode off → `forbidden`;
gateway/config → `failed`; invalid plan → `invalid_input`.

Backend: Prisma + AbacatePay adapters; `payment.service.ts` thins to
composition + `unwrapOrThrow` / existing `AppError` subclasses for routes.
Bot: call core use cases via a small adapter (stop importing payment.service
internals for plan reads if possible; gate may keep HTTP/service shim).

## 5. Files

| Action | Path                                                         |
| ------ | ------------------------------------------------------------ |
| Create | `packages/core/src/plans/catalog.ts` (+ tests)               |
| Create | `packages/core/src/ports/payment-*.ts`                       |
| Create | `packages/core/src/use-cases/payments/*` (+ fake-port tests) |
| Create | `backend/src/adapters/prisma/payment-store.ts`               |
| Create | `backend/src/adapters/abacatepay/payment-gateway.ts`         |
| Modify | `payment.service.ts`, `payment.schema.ts`, routes as needed  |
| Modify | `packages/core/src/index.ts`, bot user-gate if coupled       |
| Modify | PLAN, CHANGELOG, architecture                                |

## 6. Implementation steps

1. Catalog + pure helpers + unit tests.
2. Ports + use cases with fakes (mirror `payment.service.unit.test.ts`).
3. Adapters; wire service/routes.
4. Bot import path.
5. Evidence `docs/verification/specs/H09.md`.

## 7. Acceptance criteria

- **AC-1** Create checkout with fake gateway persists pending charge (`ok`).
- **AC-2** Webhook `completed` without paid remote status does not activate.
- **AC-3** Activation extends from current expiry when still active.
- **AC-4** Simulate with `testMode: false` → `forbidden`.
- **AC-5** Existing backend payment unit/integration tests green.
- **AC-6** Dependency rule still passes.

## 8. Tests

- Core: catalog, computePlanExpiry, use cases with fakes.
- Backend: keep/adapt `payment.service.unit.test.ts`.

## 9. Verification

```bash
bun test packages/core
bun run --cwd backend test:unit
bun check --no-script -p packages/core -p backend -p bot
bun run check:deps
```

## 10. Documentation updates

- `docs/specs/README.md` index, PLAN, CHANGELOG, architecture capability note.

## 11. Risks and rollback

Webhook race / double-activate — preserve “only activate if not already paid”
and remote re-check. Revert commit restores service-owned logic.

## 12. Quality and delivery assertions

| ID   | Check        | Pass   |
| ---- | ------------ | ------ |
| DA-1 | Core tests   | exit 0 |
| DA-2 | Backend unit | exit 0 |
| DA-3 | check:deps   | exit 0 |

Evidence: `docs/verification/specs/H09.md`
