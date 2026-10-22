<!-- markdownlint-disable-next-line MD041 -->
<div align="center">

<img src="./docs/assets/logo.svg" alt="Logo" width="96" />

# Agentic Personal Finances

Personal finance monorepo — API, web, Telegram bot, mobile, and desktop —
built for personal use, open-source practice, and agent-assisted development.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://www.conventionalcommits.org/en/v1.0.0/)
[![SemVer](https://img.shields.io/badge/SemVer-2.0.0-blue.svg)](https://semver.org/)

</div>

## Stack

| Workspace       | Role                                                      |
| --------------- | --------------------------------------------------------- |
| `packages/core` | Shared hexagonal core (`@agentic-personal-finances/core`) |
| `backend`       | Bun + ElysiaJS API, Prisma, better-auth                   |
| `frontend`      | TanStack Start web dashboard                              |
| `bot`           | Telegram bot (grammY)                                     |
| `mobile`        | Expo + React Native                                       |
| `desktop`       | Electron shell around the web app                         |

## Quick start

```bash
bun install
cp backend/.env.example backend/.env
bun run dev:all    # API :4000, web :4001, Expo, desktop
bun run check      # lint + typecheck + unit tests
```

## Docs

- [`docs/README.md`](./docs/README.md) — knowledge base index
- [`docs/specs/`](./docs/specs/) — Spec Driven Development (H01–H08, M01–M03)
- [`PLAN.md`](./PLAN.md) — roadmap / session checklist
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — branches, commits, PRs
- [`.agents/skills/`](./.agents/skills/) — agent skills (see `SOURCES.md`)

## License

[MIT](./LICENSE) © Alex Galhardo
