# CI/CD

GitHub Actions is the quality gate; Railway deploys only commits that pass
it. Work and push on **`main`** (see
`.agents/skills/git-branch-workflow`).

```text
push main ─── ci.yml ───────────► Railway production (waits for CI)
tag v*    ─── release.yml ──────► GitHub Release + downloadables
manual    ─── release.yml ──────► same builds as artifacts, no release
manual    ─── mobile-build.yml ─► EAS preview (.apk), optional
```

## Workflows

### `ci.yml` (push to `main`, pull requests)

| Job          | Runs                                                               |
| ------------ | ------------------------------------------------------------------ |
| `lint`       | `bun run lint` — Biome + markdownlint + Prettier                   |
| `backend`    | Prisma generate, typecheck, unit + integration tests, binary build |
| `bot`        | Prisma generate, typecheck, unit tests, binary build               |
| `frontend`   | Prisma generate, typecheck, unit tests, production build           |
| `mobile`     | Prisma generate, typecheck, Jest                                   |
| `core`       | Typecheck + unit tests for `packages/core`                         |
| `desktop`    | Typecheck, package Linux app unpacked, smoke under `xvfb`          |
| `e2e`        | Playwright web (needs backend, frontend)                           |
| `mobile-e2e` | Playwright Expo web (needs backend, mobile)                        |
| `qa`         | `scripts/qa.ts` (API, web, desktop, bot); uploads report           |

`lint` also typechecks `scripts/` (`dev.ts`, `qa.ts`). Cross-platform
packaging lives in `release.yml` so a macOS/Windows runner hiccup never
blocks Railway.

Install: `bun install --frozen-lockfile` (Bun **1.4.4**,
`lockfileVersion: 1` — see [`../tooling.md`](../tooling.md)). Jobs that
typecheck need `bun run db:generate` first.

### `mobile-build.yml` (manual `workflow_dispatch`)

Queues an EAS `preview` build with `--no-wait`. Needs repository secret
`EXPO_TOKEN`. Release/sideload APKs for tags come from `release.yml`
(Gradle, no EAS quota). Store `.aab` builds stay
`eas build --profile production` by hand.

### `release.yml` (tag `v*`, or manual run)

| Job        | Runner(s)                                | Output                                                 |
| ---------- | ---------------------------------------- | ------------------------------------------------------ |
| `binaries` | ubuntu x64, ubuntu arm64, macOS, Windows | `agent-money-backend-<os>-<arch>`, `agent-money-bot-…` |
| `electron` | Windows, Ubuntu, macOS                   | NSIS / AppImage / ad hoc `.app` zip                    |
| `android`  | Ubuntu                                   | `agent-money-android.apk` (debug-keystore, sideload)   |
| `ios`      | macOS                                    | `agent-money-ios-simulator.zip`                        |
| `publish`  | Ubuntu (tags only)                       | GitHub Release + `SHA256SUMS.txt`                      |

Repository variables `DESKTOP_APP_URL` and `MOBILE_API_URL` override
baked-in production URLs. Pre-release tags (`-rc`, `-beta`, …) create
pre-releases. See [`../workflows.md`](../workflows.md#releasing).

## Railway gate

Production services use **Wait for CI** (`source.checkSuites=true`):
Railway deploys a commit only after its check suite is green. A red job
blocks production (deploy shows `SKIPPED`).

| Railway environment | Git branch | Notes                                          |
| ------------------- | ---------- | ---------------------------------------------- |
| `production`        | `main`     | Primary; set public domains after first deploy |

Document the live `*.up.railway.app` hostnames in your runbook once the
project exists — they are not fixed in-repo.

## Secrets

| Secret       | Where               | Used by            |
| ------------ | ------------------- | ------------------ |
| `EXPO_TOKEN` | GitHub repo secrets | `mobile-build.yml` |

App secrets live in Railway variables, never in GitHub.

## Open items

- [ ] Optional Railway sandbox environment with **test** Resend/Google keys
      (never clone production secrets blindly).
- [ ] Maestro on an Android emulator in CI (Actions minutes + decision).
- [x] Bun pinned to **1.4.4**; `actions/checkout@v7`.
- [ ] First full `release.yml` run (Android/iOS + macOS/Windows Electron).
- [ ] Code signing: Windows SmartScreen, macOS Developer ID + notarization,
      Android upload keystore for store APKs.
