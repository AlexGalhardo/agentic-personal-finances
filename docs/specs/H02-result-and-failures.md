# H02 Result and AppFailure

| Field      | Value                                                 |
| ---------- | ----------------------------------------------------- |
| PLAN tasks | H02                                                   |
| Status     | Done                                                  |
| Depends on | H01                                                   |
| Risk       | Low: pure types/helpers; unused by adapters until H04 |

## 1. Goal

Define a small, dependency-free `Result` type and an `AppFailure` tagged union
in `@agentic-personal-finances/core` so use cases can return ok/err without
throwing. Provide `ok`, `err`, `isOk`, `isErr`, and `map`/`mapErr` helpers.
Document stable failure codes aligned with HTTP mapping later (H05).

## 2. Non-goals

- Do not replace `AppError` in backend yet (H05).
- Do not add a third-party fp-ts / neverthrow dependency unless already in
  the monorepo — prefer ~40 lines of local types.
- Do not change API responses.

## 3. Current state

- Backend uses `AppError` subclasses (`backend/src/lib/errors.ts`) and throws
  from services (e.g. `TransactionNotFoundError`, `FreeLimitReachedError`).
- Portuguese messages still appear in some `AppError` constructors
  (`transaction.service.ts`) — out of scope unless a file is touched; if
  touched, translate to English (project rule).

## 4. Design

```typescript
// packages/core/src/result.ts
export type Ok<T> = { readonly ok: true; readonly value: T };
export type Err<E> = { readonly ok: false; readonly error: E };
export type Result<T, E> = Ok<T> | Err<E>;

export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });
export const err = <E>(error: E): Err<E> => ({ ok: false, error });
export const isOk = <T, E>(r: Result<T, E>): r is Ok<T> => r.ok;
export const isErr = <T, E>(r: Result<T, E>): r is Err<E> => !r.ok;
```

```typescript
// packages/core/src/failures.ts
export type AppFailureCode =
  | "invalid_input"
  | "not_found"
  | "plan_limit"
  | "unauthorized"
  | "forbidden"
  | "conflict"
  | "failed";

export type AppFailure = {
  readonly code: AppFailureCode;
  readonly message: string;
  readonly details?: Readonly<Record<string, unknown>>;
};

export const failure = (
  code: AppFailureCode,
  message: string,
  details?: Readonly<Record<string, unknown>>,
): AppFailure =>
  details === undefined ? { code, message } : { code, message, details };
```

Export from `src/index.ts`.

## 5. Files

| Action | Path                                                           |
| ------ | -------------------------------------------------------------- |
| Create | `packages/core/src/result.ts`                                  |
| Create | `packages/core/src/failures.ts`                                |
| Create | `packages/core/src/result.test.ts`                             |
| Create | `packages/core/src/failures.test.ts`                           |
| Modify | `packages/core/src/index.ts`                                   |
| Modify | `packages/core/package.json` — `"test": "bun test"` if missing |

## 6. Implementation steps

1. Add types/helpers + unit tests (table-driven).
2. Export from package entry.
3. Run `bun test` in `packages/core` and `bun check --no-script -p packages/core`.

## 7. Acceptance criteria

- **AC-1** `ok(1)` → `isOk` true and `value === 1`.
- **AC-2** `err(failure("not_found", "x"))` → `isErr` true and `error.code === "not_found"`.
- **AC-3** `Result` / `AppFailure` values are readonly at the type level
  (no mutable class instances).
- **AC-4** `packages/core` has zero imports from `backend`, `elysia`,
  `prisma`, `react`.

## 8. Tests

- `result.test.ts` — ok/err/isOk/isErr
- `failures.test.ts` — failure() shape with and without details

## 9. Verification

```bash
bun test packages/core
bun check --no-script -p packages/core
```

## 10. Documentation updates

- `docs/system-design.md` — link Result/AppFailure codes
- `CHANGELOG.md`, `PLAN.md`

## 11. Risks and rollback

None significant. Delete the two modules if abandoned.

## 12. Quality and delivery assertions

| ID   | Check                        | Pass                                                                                         |
| ---- | ---------------------------- | -------------------------------------------------------------------------------------------- |
| DA-1 | Unit tests green             | `bun test packages/core` exit 0                                                              |
| DA-2 | No framework imports in core | ripgrep `from \"@agent-money\|elysia\|@prisma\|react` under `packages/core/src` → no matches |

Evidence: `docs/verification/specs/H02.md`
