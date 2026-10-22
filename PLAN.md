# PLAN.md — Agentic Personal Finances roadmap

Single source of truth for onboarding agents and humans after the 2026-10
refactor initiative. Tick a checkbox in the **same commit** that completes
the work. Evidence for specs lives under `docs/verification/specs/`.

**Branch:** use `dev` for implementation PRs (see
`.agents/skills/git-branch-workflow`). Do not land unfinished slices on
`main`.

**Runtime:** Bun **1.4.4** (`packageManager`). Typecheck:
`bun check --no-script`. Full gate: `bun run check`.

## How to resume

1. Read [`AGENTS.md`](./AGENTS.md), then this file.
2. Read locked decisions: [`docs/brainstorming.md`](./docs/brainstorming.md),
   [`docs/system-design.md`](./docs/system-design.md),
   [`docs/architecture.md`](./docs/architecture.md).
3. Open [`docs/specs/README.md`](./docs/specs/README.md) — implement the
   **first Ready spec** whose dependencies are Done.
4. Run baseline: `bun run check` (generate Prisma first if needed).

## Quality and delivery assertions (global)

| ID  | Assertion                                  | How we know                            |
| --- | ------------------------------------------ | -------------------------------------- |
| G1  | Lint clean                                 | `bun run lint`                         |
| G2  | Types clean                                | `bun run typecheck`                    |
| G3  | Unit tests green                           | `bun run test`                         |
| G4  | Spec evidence exists for each Done ID      | `docs/verification/specs/<ID>.md`      |
| G5  | English-only product/docs in touched files | reviewer                               |
| G6  | Conventional Commits + Keep a Changelog    | hooks + `CHANGELOG.md`                 |
| G7  | Dependency Rule after H08                  | `bun scripts/check-dependency-rule.ts` |
| G8  | No secrets / `*.csv` bank files committed  | pre-commit hooks                       |

A spec is **Done** only when its ACs, applicable QGs/DAs, and evidence file
are complete (native rows may be `not run` with reason).

## Phase status

### Phase 0 — Agent layout & mechanical rename

- [x] Skills/rules/agents/references under `.agents/`
- [x] Skill `clean-architecture-in-practice` vendored
- [x] `desktop-electronjs` → `desktop`
- [x] Remote → `agentic-personal-finances`
- [x] Minimalist README
- [x] Bun 1.4.4 pin + `bun check --no-script` typecheck
- [x] Commit Phase 0+1+docs on `dev`

### Phase 1 — Research

- [x] Rewrite [`docs/architecture.md`](./docs/architecture.md) (hexagonal mapping)

### Phase 2 — Brainstorming / design

- [x] [`docs/brainstorming.md`](./docs/brainstorming.md) — 9 decisions locked
- [x] [`docs/system-design.md`](./docs/system-design.md)
- [x] [`docs/design-system.md`](./docs/design-system.md) — evolve + Impeccable scope
- [x] Design approved (2026-10-22)

### Phase 3 — Spec driven development

- [x] [`docs/specs/README.md`](./docs/specs/README.md) + template/QGs/index
- [x] H01–H08 hexagonal specs
- [x] M01–M03 stack upgrade specs
- [ ] Human review of specs (spot-check H04/H05) before implementation

### Phase 4 — Implementation (one spec at a time)

#### Hexagonal foundation + transactions slice

- [x] [H01](./docs/specs/H01-core-package.md) — `packages/core` workspace
- [ ] [H02](./docs/specs/H02-result-and-failures.md) — Result + AppFailure
- [ ] [H03](./docs/specs/H03-transaction-ports.md) — ports
- [ ] [H04](./docs/specs/H04-transaction-use-cases.md) — use cases
- [ ] [H05](./docs/specs/H05-backend-http-adapters.md) — Prisma + HTTP adapters
- [ ] [H06](./docs/specs/H06-bot-adapters.md) — bot → core
- [ ] [H07](./docs/specs/H07-web-mobile-thin-clients.md) — thin clients
- [ ] [H08](./docs/specs/H08-dependency-rule.md) — enforce Dependency Rule

#### Later domain migrations (specs TBD after H08)

- [ ] Payments → core ports/use cases
- [ ] Identity / telegram → core
- [ ] Translate remaining Portuguese API/UI strings to English

#### Stack upgrades

- [ ] [M01](./docs/specs/M01-prisma-8.md) — Prisma 8 RC
- [ ] [M02](./docs/specs/M02-elysia-2.md) — Elysia 2 RC + Eden
- [ ] [M03](./docs/specs/M03-tanstack-1.md) — TanStack Start 1.0 stable
- [ ] Remaining deps: exact latest stable (no RC/beta) outside M01/M02 pins

#### Product / OSS polish

- [ ] Impeccable pass on web (evolve tokens; no new brand world)
- [ ] Rename npm scope `@agent-money-boilerplate/*` → new name (dedicated spec)
- [x] Retroactive GitHub Releases (Keep a Changelog / SemVer / Conventional
      Commits) — pattern:
      <https://github.com/AlexGalhardo/vukem/releases>

### Carry-over from 2026-09 check-up

- [ ] `mobile-build.yml` EAS quota — re-run when Free plan resets
- [ ] Revoke/delete untracked `scripts/test.ts` if it still exists (never commit)

## Skills (load when relevant)

| Skill                                    | When                         |
| ---------------------------------------- | ---------------------------- |
| `clean-architecture-in-practice`         | Any core/ports/use-case work |
| `spec-driven-development`                | Before starting a spec       |
| `git-branch-workflow`                    | Branch/commit/PR             |
| `open-source-guidelines-pre-push`        | Before `git push`            |
| `agent-money-verify`                     | Definition of done           |
| `tdd` / `test-driven-development`        | H02–H05 especially           |
| `impeccable`                             | UI polish after H07          |
| `karpathy` (`.agents/rules/karpathy.md`) | Every coding task            |

## Out of scope for this PLAN

- Greenfield brand redesign
- Expanding public OpenAPI beyond the narrow transactions surface
- Full CA rings duplicated inside each client (shared core + thin adapters only)
