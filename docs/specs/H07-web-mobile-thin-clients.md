# H07 Web and mobile thin clients

| Field      | Value                                                     |
| ---------- | --------------------------------------------------------- |
| PLAN tasks | H07                                                       |
| Status     | Done                                                      |
| Depends on | H05                                                       |
| Risk       | Low–Medium: UI structure only; network contract unchanged |

## 1. Goal

Introduce a light CA-shaped layout on web and mobile **without** embedding
use cases that talk to Prisma. Clients keep Eden → HTTP → backend. Optionally
depend on `@agentic-personal-finances/core` for shared `AppFailureCode`
unions / helpers when parsing API errors. Separate UI components from API
access modules (façade).

## 2. Non-goals

- Do not call core use cases from the browser/device against local DB.
- Do not redesign UI (Impeccable evolve is separate polish work).
- Do not change desktop beyond docs (still loads web).

## 3. Current state

- `frontend/src/lib/api.ts` and `mobile/src/lib/api.ts` hold Eden treaty.
- Features import API helpers ad hoc from screens/components.

## 4. Design

Suggested layout (adjust names to existing folders):

```text
frontend/src/
  adapters/http/api.ts          # Eden treaty (moved from lib/api.ts)
  application/transactions.ts   # functions wrapping API calls for screens
  routes/ or components/        # UI only imports application/*, not raw Eden

mobile/src/
  adapters/http/api.ts
  application/transactions.ts
  app/ or features/             # UI
```

`application/*` may map HTTP error bodies to `AppFailureCode` when the API
exposes `code` (if not yet, keep message-based handling; do not invent
breaking API fields — prefer additive `code` in H05 mapper if missing).

## 5. Files

| Action      | Path                                          |
| ----------- | --------------------------------------------- |
| Move/create | frontend + mobile adapter/application modules |
| Modify      | imports in screens                            |
| Optional    | workspace dep on core for failure codes       |
| Modify      | package.json files as needed                  |

## 6. Implementation steps

1. Move Eden client to `adapters/http`.
2. Add application façades for transaction screens used today.
3. Update imports; typecheck + unit tests.
4. Document pattern for future features.

## 7. Acceptance criteria

- **AC-1** No React component imports Eden treaty directly (only
  `application/*` or `adapters/http` from application layer).
- **AC-2** `bun check --no-script -p frontend -p mobile` exit 0.
- **AC-3** Frontend + mobile unit tests green.
- **AC-4** Desktop still typechecks (unaffected).

## 8. Tests

- Existing frontend/mobile unit tests
- Optional: application façade tests with mocked fetch/Eden

## 9. Verification

```bash
bun check --no-script -p frontend -p mobile -p desktop
bun run --cwd frontend test
bun run --cwd mobile test
```

## 10. Documentation updates

- `docs/system-design.md` client section
- `docs/design-system.md` if paths change for UI
- `PLAN.md`, `CHANGELOG.md`

## 11. Risks and rollback

Import churn — do in one PR per client if needed. Rollback: restore
`lib/api.ts` paths.

## 12. Quality and delivery assertions

| ID   | Check                | Pass                                                                 |
| ---- | -------------------- | -------------------------------------------------------------------- |
| DA-1 | Eden import confined | rg `treaty\|eden` in frontend components → only adapters/application |
| DA-2 | Typecheck            | frontend + mobile                                                    |

Evidence: `docs/verification/specs/H07.md`
