# H01 Core package bootstrap

| Field      | Value                                                   |
| ---------- | ------------------------------------------------------- |
| PLAN tasks | H01                                                     |
| Status     | Done                                                    |
| Depends on | none                                                    |
| Risk       | Low: additive workspace; no runtime behavior change yet |

## 1. Goal

Add `packages/core` as a Bun workspace package `@agentic-personal-finances/core`
that can be imported by `backend`, `bot`, `frontend`, and `mobile`. It exports
a minimal public surface (placeholder `version` constant and empty barrels for
`result`, `failures`, `ports`, `use-cases`). No business logic moves in H01.

## 2. Non-goals

- Do not extract transaction services (H04).
- Do not add Result/AppFailure implementations beyond empty re-export stubs
  if needed for path stability — prefer empty dirs with `index.ts` exporting
  nothing yet, or a single `package.json` + `src/index.ts` with `CORE_VERSION`.
- Do not rename `@agent-money-boilerplate/*` workspaces.
- Do not change Prisma, Elysia, or UI.

## 3. Current state

Re-verify before starting:

- Root `package.json` workspaces: `backend`, `frontend`, `bot`, `mobile`,
  `desktop` — no `packages/*`.
- No `packages/` directory at repo root.
- Clients import backend types via
  `@agent-money-boilerplate/backend/...` (Eden `App` type).

## 4. Design

```text
packages/core/
  package.json          name: @agentic-personal-finances/core
  tsconfig.json         strict, composite-friendly
  src/index.ts          export { CORE_VERSION } from "./version"
  src/version.ts        export const CORE_VERSION = "0.0.0"
```

Root `package.json` workspaces add `"packages/*"`.

Dependents may add `"@agentic-personal-finances/core": "workspace:*"` only
when they first import it (H05+). H01 only needs root + package itself
typechecking via `bun check --no-script -p packages/core` (add
`typecheck:core` script optional).

## 5. Files

| Action | Path                           | Purpose                                                 |
| ------ | ------------------------------ | ------------------------------------------------------- |
| Create | `packages/core/package.json`   | Workspace package                                       |
| Create | `packages/core/tsconfig.json`  | TS config                                               |
| Create | `packages/core/src/version.ts` | Version constant                                        |
| Create | `packages/core/src/index.ts`   | Public entry                                            |
| Modify | `package.json`                 | `workspaces` += `packages/*`; optional `typecheck:core` |
| Modify | `docs/architecture.md`         | Mention `packages/core`                                 |
| Modify | `CHANGELOG.md`                 | Unreleased note                                         |

## 6. Implementation steps

1. Create `packages/core` files as in §4.
2. Update root workspaces; `bun install`.
3. Add `typecheck:core` / include in `typecheck` script.
4. `bun check --no-script -p packages/core` green.
5. Docs + CHANGELOG.

## 7. Acceptance criteria

- **AC-1** Given a clean install, when `bun install` runs, then
  `@agentic-personal-finances/core` resolves as a workspace package.
- **AC-2** Given `packages/core`, when `bun check --no-script -p packages/core`
  runs, then exit 0.
- **AC-3** Given any existing workspace, when `bun run typecheck:desktop`
  runs (smoke), then still exit 0 (no regression from workspace change).
- **AC-4** Given `src/index.ts`, when imported from a one-line Bun script,
  then `CORE_VERSION` equals `"0.0.0"`.

## 8. Tests

- Optional: `packages/core/src/version.test.ts` asserting `CORE_VERSION`.
- No backend test changes required.

## 9. Verification

```bash
bun install
bun check --no-script -p packages/core
bun run typecheck:desktop
bun -e "import { CORE_VERSION } from '@agentic-personal-finances/core'; console.log(CORE_VERSION)"
```

## 10. Documentation updates

- `docs/architecture.md` — workspace map includes `packages/core`
- `docs/system-design.md` — confirm package name if still TBD
- `CHANGELOG.md` `[Unreleased]`
- `PLAN.md` checkbox H01

## 11. Risks and rollback

Risk: Metro/hoisted linker surprises — mitigate by not adding native deps to
core. Rollback: delete `packages/core`, revert workspaces.

## 12. Quality and delivery assertions

| ID      | Check                             | Command / evidence                                       | Pass                              |
| ------- | --------------------------------- | -------------------------------------------------------- | --------------------------------- |
| QG-1..3 | lint/typecheck/test as applicable | `bun run lint` if TS touched at root configs             | exit 0                            |
| DA-1    | Package name exact                | `node -p "require('./packages/core/package.json').name"` | `@agentic-personal-finances/core` |
| DA-2    | Workspace lists packages          | root `package.json` workspaces contains `packages/*`     | true                              |

Evidence: `docs/verification/specs/H01.md`
