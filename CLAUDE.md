# CLAUDE.md

Guide for Claude Code (and any AI agent) working in this repository.

## Must-follow rules

1. **English only** — code, identifiers, comments, docs, commit messages,
   everything. If you find Portuguese in this app's context (a holdover
   from before the 2026-09-20 rename), translate it to English as you
   touch that file — don't leave new Portuguese behind either.
2. **Use this project's skills** (`.agents/skills/`) whenever relevant —
   in particular `git-branch-workflow` before any commit/push, and
   `open-source-guidelines-pre-push` before every `git push`.
3. **Follow open source practice**: [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
   (enforced by `.husky/commit-msg`), [SemVer](https://semver.org/), and
   the PR checklist in [`CONTRIBUTING.md`](./CONTRIBUTING.md).
4. **No obvious comments** — only the _why_ when it's non-obvious. Tabs,
   not spaces (Biome owns formatting, `bun run format`).
5. Only the root `CHANGELOG.md` ([Keep a Changelog](https://keepachangelog.com/en/1.1.0/))
   is kept — add each change under `## [Unreleased]`; never create
   per-workspace changelogs. Never commit `*.csv` (real
   bank statements have leaked before — see
   [`docs/security.md`](./docs/security.md)).
6. Agent skills, rules, agents and references live under `.agents/`
   (see [`.claude/README.md`](./.claude/README.md)). `.claude/settings.json`
   stays tracked for Claude Code plugins; only `.claude/worktrees/` is
   gitignored.
7. **Karpathy guidelines** ([`.agents/rules/karpathy.md`](./.agents/rules/karpathy.md))
   apply to every coding task: think first, simplest change, surgical
   diffs, verify against a stated goal.
8. For Clean Architecture / hexagonal work, use
   [`.agents/skills/clean-architecture-in-practice`](./.agents/skills/clean-architecture-in-practice/SKILL.md).

## Project at a glance

**Agentic Personal Finances** — a forkable personal finance monorepo: one
ElysiaJS backend consumed by a TanStack Start web dashboard, a Telegram
bot, an Expo mobile app and an Electron desktop app, all sharing one
auth/database (web, bot and mobile typed end-to-end via Eden; the desktop
app wraps the web dashboard).

```text
/packages/core/ — shared hexagonal core (@agentic-personal-finances/core)
/backend/ /frontend/ /bot/ /mobile/ /desktop/  — the 5 clients
/scripts/  — dev.ts (whole local stack), qa.ts (QA/pentest pass)
/infra/    — Dockerfile, docker-compose, Caddy, PM2 configs
/setups/   — setup/deploy shell scripts
/docs/     — architecture, conventions, specs, deploy guides
/.agents/  — skills, rules, agents, references
```

## Working workflow (agents and humans)

1. **Branch:** create/reuse `dev` from `main` — never commit on `main`
   ([`git-branch-workflow`](./.agents/skills/git-branch-workflow/SKILL.md)).
2. **Resume work:** read [`PLAN.md`](./PLAN.md), then the first Ready spec
   under [`docs/specs/`](./docs/specs/) whose dependencies are Done.
3. **Design gates:** locked decisions live in
   [`docs/brainstorming.md`](./docs/brainstorming.md) and
   [`docs/system-design.md`](./docs/system-design.md); architecture map in
   [`docs/architecture.md`](./docs/architecture.md).
4. **Implement one spec at a time** (H01→…→H08, then M01–M03). Tick the
   PLAN checkbox and write evidence in
   `docs/verification/specs/<ID>.md` in the same commit that finishes it.
5. **Verify:** `bun run check` (Bun **≥ 1.4.4**; typecheck is
   `bun check --no-script`). Pre-push runs backend/frontend build+tests —
   see [`open-source-guidelines-pre-push`](./.agents/skills/open-source-guidelines-pre-push/SKILL.md).
6. **Ship:** push `dev` → wait for CI green → merge `dev` into `main` →
   push `main`. Releases: tag `vX.Y.Z` + GitHub Release from
   `CHANGELOG.md` ([`docs/workflows.md`](./docs/workflows.md)).

## Deeper docs

Start at [`docs/README.md`](./docs/README.md) — index of the knowledge base:
architecture, code conventions, tooling, commands, workflows, security
audit, mobile design system, ADRs (`docs/decisions/`) and deploy guides
(`docs/deploy/`). Work in progress and next steps: [`PLAN.md`](./PLAN.md).

- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — branch workflow, commits, SemVer, PR checklist
- [`.agents/skills/git-branch-workflow/SKILL.md`](./.agents/skills/git-branch-workflow/SKILL.md) — branch rules
- [`.agents/skills/open-source-guidelines-pre-push/SKILL.md`](./.agents/skills/open-source-guidelines-pre-push/SKILL.md) — pre-push checklist
- [`.agents/skills/qa-pentest/SKILL.md`](./.agents/skills/qa-pentest/SKILL.md) — running and extending `scripts/qa.ts`
- [`.agents/skills/SOURCES.md`](./.agents/skills/SOURCES.md) — vendored skill sources
- [`docs/specs/README.md`](./docs/specs/README.md) — SDD index (H\*/M\* specs)

## Key commands

```bash
bun run dev:all      # backend + web + Expo (LAN IP injected) + desktop app
bun run qa           # QA/pentest pass on a seeded throwaway stack (Android emulator included)
bun run check        # lint + bun check (typecheck) + unit tests  — requires Bun ≥ 1.4.4
bun run typecheck:core  # packages/core only
```
