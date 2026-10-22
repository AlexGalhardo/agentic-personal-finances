---
name: agent-money-verify
description: >
  Verify a change in the Agentic Personal Finances monorepo and manage
  dependencies without breaking the bun lockfile. Use before calling any task
  done, before a commit or push, when adding/updating a dependency, or when
  `bun.lock` shows up in a diff.
---

# Verify a change (Agentic Personal Finances)

## Pick the smallest check that proves the change

| Touched                         | Run                                                          |
| ------------------------------- | ------------------------------------------------------------ |
| Anything                        | `bun run lint`                                               |
| One workspace                   | `bun run typecheck:<backend\|frontend\|bot\|mobile\|desktop\|core>` (Bun `check --no-script`) |
| `packages/core`                 | `bun run typecheck:core` and `bun test packages/core`        |
| `scripts/`                      | `bun run typecheck:scripts`                                  |
| Backend logic                   | `bun run backend:test` (integration needs `test:setup`)      |
| Bot / frontend / mobile logic   | `bun run bot:test` / `frontend:test` / `mobile:test`         |
| Web routes or flows             | `cd frontend && bunx playwright test`                        |
| Mobile screens                  | `cd mobile && bun run test:e2e:web`                          |
| Web↔native parity spot-check    | `agent-browser` snapshot/screenshot vs Expo (see expo-web-to-native) |
| Desktop packaging               | `bun run desktop:smoke`                                      |
| Auth, payments, bot, release, H05+ wiring | `bun run qa` (= `scripts/qa.ts --start`; see `qa-pentest`) |
| Finished H\*/M\* spec           | Evidence in `docs/verification/specs/<ID>.md` + PLAN tick    |
| Several workspaces / before push | `bun run check` (lint + typecheck + unit tests)             |

Phase 4 ladder: unit → typecheck → backend integration → Playwright /
mobile E2E / desktop smoke → `bun run qa`. Skip outer rings only when the
spec is compile-only (H01–H03). Record every gate in the evidence file.

Builds: `bun run --cwd backend build`, `bun run --cwd frontend build`. The
`pre-push` hook runs the backend/frontend typecheck, tests and builds.

Report the command and its result. Red before your change? Say so — record
the baseline first when in doubt (`git stash`, run, `git stash pop`).

## Dependencies and the lockfile

- Runtime: Bun **1.4.4** (`packageManager` in root `package.json`).
- `bun.lock` must stay `lockfileVersion: 1` (what 1.4.4 writes here). The
  pre-commit hook rejects other versions.
- Install: `bun install`. Add: `bun add --exact <pkg>@<version>` in the
  workspace folder — latest **stable** version, exact pin, never a range
  or pre-release. Ask before adding a new dependency.
- Typecheck: `bun check --no-script` (or `bun run typecheck`). Use
  `--no-script` so the root `check` quality-gate script does not shadow
  the built-in checker.
- Stale workspace symlinks (typecheck red for no reason after moving the
  repo) → `bun install` again.

Details: `docs/tooling.md`, `docs/commands.md`.
