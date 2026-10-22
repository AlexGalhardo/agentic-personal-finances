# M02 Elysia 2 RC

| Field      | Value                                    |
| ---------- | ---------------------------------------- |
| PLAN tasks | M02                                      |
| Status     | Ready                                    |
| Depends on | M01 recommended; **hard depend** H05     |
| Risk       | High: framework RC; Eden client breakage |

## 1. Goal

Upgrade backend to Elysia 2 RC per [next.elysiajs.com/llms-full.txt](https://next.elysiajs.com/llms-full.txt),
keep OpenAPI plugin working, and update Eden consumers (frontend/mobile)
so `App` type and runtime calls succeed.

## 2. Non-goals

- Do not expand OpenAPI public surface (brainstorming #9).
- Do not redesign CA layers.

## 3. Current state

- Elysia **1.4.30**
- `@elysiajs/openapi`, CORS, better-auth plugin integration
- Eden treaty in frontend/mobile

## 4. Design

1. Bump `elysia` and official plugins to compatible 2 RC exact versions.
2. Fix `app.ts` / route definitions per breaking changes.
3. Regenerate/adjust Eden usage; fix type errors in clients.
4. Keep Result→HTTP mapper behavior.

## 5. Files

| Action | Path                                                |
| ------ | --------------------------------------------------- |
| Modify | `backend/package.json`, plugins                     |
| Modify | `backend/src/app.ts`, routes, auth plugin as needed |
| Modify | frontend/mobile Eden clients                        |
| Modify | docs stack pins                                     |

## 6. Implementation steps

1. Upgrade backend; fix compile.
2. Fix clients; run typecheck + unit tests.
3. Smoke `bun run --cwd backend` + one Eden call if feasible.
4. Docs.

## 7. Acceptance criteria

- **AC-1** Backend typecheck + tests + build green.
- **AC-2** Frontend/mobile typecheck green.
- **AC-3** OpenAPI JSON still served at `/openapi/json`.
- **AC-4** Auth cookie and `x-api-key` paths still work (integration or manual
  evidence).

## 8. Tests

- Backend suite; add/adjust plugin tests if boot fails

## 9. Verification

```bash
bun run --cwd backend test
bun check --no-script -p backend -p frontend -p mobile
bun run --cwd backend build
# manual or qa: curl openapi + authenticated transactions
```

## 10. Documentation updates

- architecture stack, CHANGELOG, PLAN

## 11. Risks and rollback

Eden mismatch — revert Elysia pin. Prefer M02 on a long-lived branch.

## 12. Quality and delivery assertions

| ID   | Check                | Pass              |
| ---- | -------------------- | ----------------- |
| DA-1 | Exact elysia version | package.json      |
| DA-2 | OpenAPI reachable    | curl or test      |
| DA-3 | Clients typecheck    | frontend + mobile |

Evidence: `docs/verification/specs/M02.md`
