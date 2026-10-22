# H06 Bot adapters

| Field      | Value                                      |
| ---------- | ------------------------------------------ |
| PLAN tasks | H06                                        |
| Status     | Ready                                      |
| Depends on | H05                                        |
| Risk       | Medium: bot UX copy and lockouts must stay |

## 1. Goal

Point the Telegram bot’s transaction flows at `@agentic-personal-finances/core`
use cases using the same Prisma port implementations as the backend
(in-process), mapping `Result` to chat messages. Preserve ADR 0002 intent
(shared policy, no bot HTTP identity).

## 2. Non-goals

- Do not add HTTP calls from bot to API.
- Do not redesign conversation UX.
- Do not migrate payment conversations beyond what they already share.

## 3. Current state

- Bot imports `@agent-money-boilerplate/backend/src/modules/...` services
  and repositories directly (`bot/src/conversations/*`, `bot/src/lib/*`).
- Per-chat lockouts and Zod validation live in the bot.

## 4. Design

```typescript
// bot/src/adapters/core-deps.ts — build CreateTransactionDeps etc. from
// backend prisma adapters (import adapter factories from backend, or shared
// adapter package later). Prefer importing backend adapter factories to avoid
// a third copy of Prisma wiring.
```

Conversations call use cases; on `err`, map codes to existing Portuguese or
English user-facing strings **as already shown to users** — if changing
language, follow English-only project rule and update all bot copy in the
touched flows.

Add `bot` dependency on `@agentic-personal-finances/core`.

## 5. Files

| Action | Path                              |
| ------ | --------------------------------- |
| Create | `bot/src/adapters/*` (thin)       |
| Modify | transaction-related conversations |
| Modify | `bot/package.json`                |
| Modify | bot unit tests                    |

## 6. Implementation steps

1. Wire deps module.
2. Switch add/list/delete/search conversations one by one; keep tests green.
3. Remove direct `transactionService` imports where replaced.

## 7. Acceptance criteria

- **AC-1** Adding a transaction via bot still enforces plan limit.
- **AC-2** Bot unit tests green.
- **AC-3** No new HTTP client to the API for transactions.

## 8. Tests

- Existing bot unit tests; add mapping tests for `plan_limit` / `not_found`
  message selection if logic branches.

## 9. Verification

```bash
bun run --cwd bot test
bun check --no-script -p bot
bun run --cwd bot build
```

## 10. Documentation updates

- `docs/architecture.md` client table (bot → core)
- `PLAN.md`, `CHANGELOG.md`

## 11. Risks and rollback

Broken conversations — keep service shim temporarily if needed. Rollback:
restore service imports.

## 12. Quality and delivery assertions

| ID   | Check                                      | Pass                                                                |
| ---- | ------------------------------------------ | ------------------------------------------------------------------- |
| DA-1 | Bot tests                                  | `bun run --cwd bot test`                                            |
| DA-2 | Uses core use cases for create/list/delete | rg transactionService in bot/src/conversations → empty or shim-only |

Evidence: `docs/verification/specs/H06.md`
