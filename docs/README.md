# Documentation

The knowledge base for humans and agents working on this repository. Start
with the project's `CLAUDE.md` / `AGENTS.md`, then open what the task needs.

| Document                                       | What's in it                                                                           |
| ---------------------------------------------- | -------------------------------------------------------------------------------------- |
| [`architecture.md`](./architecture.md)         | Stack, workspaces, hexagonal mapping, how each client reaches the API, monorepo quirks |
| [`system-design.md`](./system-design.md)       | Target CA design (shared `packages/core`, adapters, upgrade order)                     |
| [`brainstorming.md`](./brainstorming.md)       | Locked refactor decisions                                                              |
| [`specs/`](./specs)                            | Spec Driven Development contracts (H01–H08, M01–M03) — start at `specs/README.md`      |
| [`code-conventions.md`](./code-conventions.md) | Language policy, style, backend/client rules, tests, the four sync points              |
| [`tooling.md`](./tooling.md)                   | Biome, Prettier, markdownlint, commitlint, Husky hooks, Bun 1.4.4, test runners        |
| [`commands.md`](./commands.md)                 | Every dev / verify / database / mobile / deploy command                                |
| [`workflows.md`](./workflows.md)               | Shipping, releasing, API routes, security changes, sync points, mobile visual review   |
| [`security.md`](./security.md)                 | Threat model, OWASP audit (2026-09-27), deferrals, incident log                        |
| [`design-system.md`](./design-system.md)       | Mobile design system — tokens, components, patterns; Impeccable evolve scope           |
| [`decisions/`](./decisions)                    | Architecture decision records                                                          |
| [`deploy/`](./deploy)                          | Local setup, Docker/Compose, Railway, VPS, CI/CD, Android, Vercel + Fly.io             |
| [`../PLAN.md`](../PLAN.md)                     | Roadmap / session checklist for the refactor                                           |

Project-specific agent skills live in `.agents/skills/` (branch workflow,
pre-push checklist, `qa-pentest` for `scripts/qa.ts`); coding rules in
`.agents/rules/` (Karpathy guidelines); vendored skills and their sources
are listed in `.agents/skills/SOURCES.md`.
