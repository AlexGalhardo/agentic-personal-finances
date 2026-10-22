# M03 TanStack Start 1.0 stable

| Field      | Value                                                  |
| ---------- | ------------------------------------------------------ |
| PLAN tasks | M03                                                    |
| Status     | Ready                                                  |
| Depends on | H07 (thin clients); M02 optional but recommended first |
| Risk       | High: SSR/router major; follow official migration      |

## 1. Goal

Upgrade `frontend` to TanStack Start **1.0 stable** and aligned Router/Query
packages per [tanstack.com/llms-full.txt](https://tanstack.com/llms-full.txt).
Keep SSR, API proxy, and dashboard routes working.

## 2. Non-goals

- Full Impeccable redesign (evolve only).
- Mobile Expo upgrade unless required by shared types.

## 3. Current state

- `@tanstack/react-start` ~1.168.x, Router ~1.170.x, Query 5.x
- Proxy in `frontend/server.ts` / Vite config

## 4. Design

1. Read current Start 1.0 migration notes from the llms bundle / docs.
2. Bump exact stable versions (no RC/beta for this spec).
3. Fix file-route / SSR / bundler breakages.
4. Keep H07 application/adapter import layout.

## 5. Files

| Action | Path                                         |
| ------ | -------------------------------------------- |
| Modify | `frontend/package.json`, lockfile            |
| Modify | Start entry, routes, vite config as required |
| Modify | docs                                         |

## 6. Implementation steps

1. Upgrade deps.
2. Fix compile + unit tests.
3. `bun run --cwd frontend build`.
4. Playwright smoke if CI job available locally.

## 7. Acceptance criteria

- **AC-1** `bun check --no-script -p frontend` exit 0.
- **AC-2** `bun run --cwd frontend build` exit 0.
- **AC-3** `bun run --cwd frontend test` exit 0.
- **AC-4** Dev proxy still forwards API paths in `proxy-paths.ts`.

## 8. Tests

- Frontend unit tests; optional Playwright subset

## 9. Verification

```bash
bun check --no-script -p frontend
bun run --cwd frontend test
bun run --cwd frontend build
```

## 10. Documentation updates

- architecture stack table, CHANGELOG, PLAN

## 11. Risks and rollback

SSR subtle breaks — keep a before/after checklist of critical routes
(login, transactions, account). Revert pin if build fails on CI.

## 12. Quality and delivery assertions

| ID   | Check                               | Pass                  |
| ---- | ----------------------------------- | --------------------- |
| DA-1 | No RC tags on @tanstack/react-start | package.json          |
| DA-2 | Build                               | frontend build exit 0 |

Evidence: `docs/verification/specs/M03.md`
