# H08 Dependency rule enforcement

| Field      | Value                                                            |
| ---------- | ---------------------------------------------------------------- |
| PLAN tasks | H08                                                              |
| Status     | Done                                                             |
| Depends on | H05, H06, H07                                                    |
| Risk       | Medium: may reveal accidental imports; fix or exempt with reason |

## 1. Goal

Make the Dependency Rule mechanically checkable: `packages/core` must not
import backend, bot, frontend, mobile, desktop, Elysia, Prisma, React, or
React Native. Document allowed edges. Add a CI/script gate.

## 2. Non-goals

- Do not adopt a heavyweight monorepo ESLint mega-config unless necessary —
  a small `scripts/check-dependency-rule.ts` (Bun) is enough.
- Do not forbid backend from importing core.

## 3. Current state

- After H01–H07, core should already be clean; this spec freezes the rule.
- No depguard equivalent exists today.

## 4. Design

Forbidden import substrings for files under `packages/core/`:

```text
@agentic-personal-finances/backend
@agentic-personal-finances/bot
@agentic-personal-finances/frontend
@agentic-personal-finances/mobile
@agentic-personal-finances/desktop
elysia
@prisma
prisma/
react
react-native
expo
grammy
```

Script exits 1 listing offenders. Wire into `bun run check` or CI lint job.

Optional: assert backend routes do not import Prisma client directly
(only adapters) — start as warning, tighten later.

## 5. Files

| Action | Path                               |
| ------ | ---------------------------------- |
| Create | `scripts/check-dependency-rule.ts` |
| Modify | `package.json` scripts + CI        |
| Modify | `docs/architecture.md`             |

## 6. Implementation steps

1. Write script + unit test with a fixture string or temp file if feasible.
2. Run against repo; fix any violations.
3. Add to `check` or CI `lint` job.
4. Document.

## 7. Acceptance criteria

- **AC-1** Clean tree → script exit 0.
- **AC-2** Introducing `import "elysia"` in `packages/core` → script exit 1
  (proven by a test that writes a temp file or uses a fixture path).
- **AC-3** CI runs the script on PRs.

## 8. Tests

- `scripts/check-dependency-rule.test.ts` or embed self-check

## 9. Verification

```bash
bun scripts/check-dependency-rule.ts
bun run check   # or lint job including the script
```

## 10. Documentation updates

- `docs/architecture.md` Dependency Rule section
- `docs/tooling.md`
- `PLAN.md`, `CHANGELOG.md`

## 11. Risks and rollback

False positives on type-only imports — allow `import type` from nowhere
forbidden; still ban value and type imports from adapter packages.

## 12. Quality and delivery assertions

| ID   | Check        | Pass                                    |
| ---- | ------------ | --------------------------------------- |
| DA-1 | Script in CI | `ci.yml` contains check-dependency-rule |
| DA-2 | Core clean   | script exit 0                           |

Evidence: `docs/verification/specs/H08.md`
