# Tooling

What checks the code, where it's configured, and the traps each tool has.

## Formatting and linting

| Tool                                                                      | Scope             | Config                                                        |
| ------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------- |
| [Biome](https://biomejs.dev) 2.5                                          | TS, JS, JSON, CSS | `biome.json` (reads `.editorconfig`)                          |
| [Prettier](https://prettier.io) 3.9                                       | Markdown only     | `.prettierrc.json`, `.prettierignore`                         |
| [markdownlint-cli2](https://github.com/DavidAnson/markdownlint-cli2) 0.23 | Markdown rules    | `.markdownlint-cli2.jsonc`                                    |
| [EditorConfig](https://editorconfig.org)                                  | Editors           | `.editorconfig` — tabs width 4; spaces (2) for `*.md`/`*.yml` |

```bash
bun run lint        # biome + markdown + prettier + Dependency Rule (`check:deps`)
bun run lint:fix    # biome --write + markdownlint --fix + prettier --write
bun run check:deps  # packages/core must not import outer rings (H08)
bun run format      # formatters only
```

- Vendored skills (`.agents/skills`, `.agents/agents`, `.agents/references`,
  `.agents/skills`) are excluded from every tool — they mirror upstream.
- Prettier owns Markdown layout; markdownlint rules that fight it
  (`MD013` line length, `MD060` table style, emphasis/list markers) are off.
- Run Biome through the project (`bun run lint` or `bunx biome`), **never
  `npx biome`** — npm resolves an unrelated package named `biome`.

## Commits and hooks (Husky)

| Hook         | Runs                                                                                                                       |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `pre-commit` | blocks staged `*.exe` and `*.csv`, blocks a `bun.lock` that isn't `lockfileVersion: 1`, `bun run lint`                     |
| `commit-msg` | [commitlint](https://commitlint.js.org) with `@commitlint/config-conventional` + the `merge` type (`commitlint.config.js`) |
| `pre-push`   | backend `bun check --no-script` + tests + build; frontend `bun check --no-script` + build                                  |

commitlint traps worth knowing (see the `agent-money-ship` skill):

- `subject-case`: the subject can't start with an uppercase word —
  `feat(api): add OpenAPI…` passes, `feat(api): OpenAPI spec…` fails.
- `header-max-length` 100, `body-max-line-length` 100.
- Breaking changes: `type(scope)!:` **and** a `BREAKING CHANGE:` footer.

Never bypass hooks with `--no-verify` without the maintainer's explicit OK.

## Package management

- **Bun 1.4.4** is the pinned runtime (`packageManager` / `engines` in the
  root `package.json`, CI `bun-version: 1.4.4`). `bunfig.toml` pins the
  hoisted linker (Metro needs it).
- **Lockfile**: keep `lockfileVersion: 1` (what Bun 1.4.4 writes here).
  Install and add packages with Bun 1.4.4 (`bun install`,
  `bun add --exact <pkg>@<version>`). The pre-commit hook rejects other
  lockfile versions.
- **Exact stable versions** — no `^`/`~`, no `latest`/`next`/`beta`. Look
  up the current stable with `npm view <pkg> version dist-tags`.
- **Stack pins (M01–M03):** Prisma CLI `8.0.0-rc.26` + client/adapters
  `7.10.1` (`prisma7` for migrate/generate); Elysia `2.0.0-rc.0` and
  `@elysia/*` plugins; TanStack Start `1.169.4`, Router `1.170.46` (see
  `docs/architecture.md` stack table).
- **Moved the repo?** Workspace links in `node_modules/@agentic-personal-finances/*`
  are absolute symlinks — after moving the folder, `bun install` again or
  typecheck fails with "Cannot find module" /
  "Please install Elysia before using Eden".
- Audit: `bun audit`; triage by reachability and record deferrals in
  [`security.md`](./security.md#accepted--deferred).

## TypeScript

Each workspace has its own `tsconfig.json` (`strict`, and
`noUncheckedIndexedAccess` in the backend). Typechecking uses Bun's built-in
checker: `bun run typecheck` → `bun check --no-script` across workspaces
(see [Bun check](https://bun.com/docs/runtime/check)). The backend and bot
need a generated Prisma Client first (`cd backend && bun run db:generate`).

## Ops logging (Telegram)

Server workspaces (`backend`, `bot`, `frontend` production server) depend on
[`@galhardoalex/telegram-logger`](https://github.com/AlexGalhardo/telegram-logger)
and export `telegramLogger` from each workspace's `src/lib/telegram-logger.ts`.
Levels: `debug` / `info` / `success` / `warn` / `error` / `fatal` (treat
"critical" as `fatal`). Delivery is a no-op when
`TELEGRAM_LOGGER_BOT_TOKEN` + `TELEGRAM_LOGGER_CHAT_ID` (or the
`TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` fallbacks) are unset, and always
off in `NODE_ENV=test`. Never put these secrets in `EXPO_PUBLIC_*` or other
client bundles.

## Tests

| Workspace  | Runner           | Command                               | Notes                                         |
| ---------- | ---------------- | ------------------------------------- | --------------------------------------------- |
| backend    | `bun:test`       | `bun run backend:test`                | Resets `backend/test.db` first (`test:setup`) |
| bot        | `bun:test`       | `bun run bot:test`                    | Uses `bot/.env.test`                          |
| frontend   | `bun:test`       | `bun run frontend:test`               | Pure `lib/` helpers                           |
| mobile     | Jest (jest-expo) | `bun run mobile:test`                 | `src/**/*.test.ts(x)`                         |
| web E2E    | Playwright       | `cd frontend && bunx playwright test` | Backend `:4200`, Vite `:4201`, reseeded DB    |
| mobile E2E | Playwright       | `cd mobile && bun run test:e2e:web`   | Backend `:4210`, Expo web export `:4301`      |
| native E2E | Maestro          | `cd mobile && maestro test maestro/`  | Emulator/device required                      |
| desktop    | Electron smoke   | `bun run desktop:smoke`               | Boots the window, exits 0 once a page renders |
| QA/pentest | `scripts/qa.ts`  | `bun run qa`                          | API `:4400`, web `:4401`, Metro `:8091`       |

Both Playwright configs and `bun run qa` reseed the E2E database
(`backend/e2e.db`), so don't run them at the same time. The seed is deterministic (fixed-seed PRNG).

## Expo / Metro

- `EXPO_PUBLIC_*` values are inlined at transform time — pass `--clear` to
  `expo export`/`expo start` after changing them.
- `npx expo export --platform android` is the fastest way to prove the
  native bundle (NativeWind classes included) compiles without a device.
