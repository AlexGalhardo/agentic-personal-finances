---
name: agent-money-ship
description: >
  Ship a change in the Agentic Personal Finances monorepo: commit on main,
  changelog, push, wait for CI, and cut a release. Use for "commit",
  "push", "ship", "release", "tag a version".
---

# Ship a change (Agentic Personal Finances)

Procedure in `docs/workflows.md` ("Shipping a change", "Releasing",
"Spec-driven implementation"). The short version:

1. Work on `main` (`.agents/skills/git-branch-workflow`). Prefer the next
   Ready H\*/M\* spec in `PLAN.md` / `docs/specs/`.
2. Verify with `agent-money-verify` (`bun run check`, Bun ≥ 1.4.4).
3. Add user-facing changes under `## [Unreleased]` in `CHANGELOG.md`. For
   finished specs: PLAN checkbox + `docs/verification/specs/<ID>.md`.
4. Commit in atomic Conventional Commits. Stage paths explicitly — never
   `git add -A` (untracked files here have held real API keys; never
   commit `*.csv`, `*.env`, `scripts/test.ts`, `.claude/PROMPT.md`).
5. Run the `.agents/skills/open-source-guidelines-pre-push` checklist,
   then `git push origin main`.
6. `gh run watch <id> --exit-status` for `ci.yml` on `main`. Red →
   `gh run view <id> --log-failed | tail -n 120`, fix forward on `main`.
7. Railway production deploys from `main` after CI is green. Release APKs
   come from `release.yml` on `v*` tags — not an automatic EAS production
   build on every push. Never force-push `main`.

## Release

Move `[Unreleased]` to `## [x.y.z] - YYYY-MM-DD` with compare links, bump
`version` in the root and every workspace `package.json`, commit
`chore(release): vX.Y.Z` on `main`, then
`git tag vX.Y.Z && git push origin vX.Y.Z` (`release.yml` publishes the
GitHub Release). A tag is public — confirm with the user. To test the
release builds without publishing:
`gh workflow run release.yml --ref main`.
