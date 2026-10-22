---
name: git-branch-workflow
description:
  Standing git convention for this repository — commit and push directly on
  main after local verify. Use whenever starting a task, committing, or
  pushing. Triggers on "commit this", "push this", "ship", or any git branch
  decision in this repo.
license: MIT
metadata:
  author: aleexgvieira
  version: "2.0.0"
---

# Git branch workflow

`main` is the **only** long-lived branch. There is no standing `dev` /
`develop` / `master` workflow. Agents and humans **commit and push on
`main`** after local verification.

## The rule

1. **Work on `main`.** `git checkout main && git pull --ff-only` (or rebase
   onto latest `origin/main` if you already have local commits).
2. **Do the work and commit** with Conventional Commits (see
   `CONTRIBUTING.md` / `CLAUDE.md`).
3. **Verify before pushing.** Run what `.husky/pre-push` runs — at least
   backend + frontend typecheck/test/build for touched surfaces. Prefer
   `bun run check` when the change spans workspaces. Don't push a red
   tree.
4. **Push `main`.** `git push origin main`. CI on `main` is the quality
   gate for Railway production.
5. **Never force-push `main`** unless the user explicitly confirms it —
   treat history rewrite as a deliberate, confirmed operation.
6. Optional short-lived topic branches are allowed only when the user asks
   for a PR review; default remains direct-to-`main`.

## Why this shape

- Solo / agent-heavy cadence: a permanent `dev` branch added merge overhead
  without a second human reviewer in the loop.
- Hooks + CI still protect `main` (pre-commit, pre-push, `ci.yml`).
- Railway production tracks `main` and waits for CI green.

## What NOT to do

- Don't invent a standing `dev` branch and merge ritual unless the user
  asks.
- Don't skip verify because a change "looks small".
- Don't force-push `main` without explicit confirmation.
- Don't leave abandoned remote branches lying around — delete them after
  use (`git push origin --delete <branch>`).
