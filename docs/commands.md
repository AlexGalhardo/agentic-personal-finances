# Commands

Run from the repository root unless noted.

## Everyday

```bash
bun install                  # Bun ≥ 1.4.4 (see packageManager in package.json)
bun run backend:dev         # API        http://localhost:4000 (spec at /openapi/json)
bun run frontend:dev        # web        http://localhost:4001 (API reference at /api)
bun run bot:dev             # Telegram bot (needs bot/.env)
bun run mobile:dev          # Expo dev server
bun run desktop:dev         # Electron desktop app (loads http://localhost:4001)
bun run dev:all             # all of the above except the bot, Expo pointed at the LAN IP
```

## Verify

```bash
bun run check               # lint + bun check (typecheck) + unit tests — before every commit
bun run lint                # Biome + markdownlint + Prettier check
bun run lint:fix            # apply fixes
bun run typecheck           # bun check --no-script across workspaces (+ typecheck:<name>)
bun check --no-script -p backend   # Bun's built-in typechecker (one workspace)
bun run test                # backend + bot + frontend + mobile unit/integration tests
cd frontend && bunx playwright test      # web E2E
cd mobile && bun run test:e2e:web        # mobile E2E on the Expo web build
cd mobile && maestro test maestro/       # native E2E (emulator/device)
bun run qa                               # QA/pentest pass: API, web, desktop, bot, Android emulator
bun scripts/qa.ts --only api,web --report qa-report.md --shots qa-shots   # against running servers
```

What `pre-push` runs (and CI mirrors):

```bash
(cd backend && bun check --no-script && bun run test:setup && bun run test && bun run build)
(cd frontend && bun check --no-script && bun run build)
```

> The root `check` script is the full quality gate. Bun's built-in typechecker
> is invoked as `bun check --no-script` so it is not shadowed by that script.

## Backend

```bash
cd backend
bun run test:unit                     # *.unit.test.ts, no database
bun run test                          # unit + integration (resets test.db)
bun test src/lib/plan.unit.test.ts    # one file
bun run db:generate                   # Prisma Client for SQLite (db:generate:postgres for Postgres)
bun run db:migrate                    # new migration (dev) — replicate schema changes in both schema files
bun run db:deploy                     # apply migrations (db:deploy:postgres)
bun run db:seed                       # demo data — refuses NODE_ENV=production
bun run db:studio                     # Prisma Studio http://localhost:5555
bun run scripts/encrypt-auto-generated-passwords.ts   # one-off migration, idempotent
curl localhost:4000/openapi/json      # generated OpenAPI spec
```

## Mobile

```bash
cd mobile
bun run test                                                    # Jest
bun check --no-script                                           # typecheck
EXPO_PUBLIC_API_URL=http://localhost:4000 npx expo export --platform android --clear   # prove the native bundle compiles
bun run build:apk | build:aab | submit:play-store               # EAS (paid/quota) — see docs/deploy/android.md
```

## Desktop

```bash
bun run desktop:dev                   # build main process + open the window
bun run desktop:smoke                 # CI-style boot check
bun run desktop:dist                  # installer for the current OS in desktop/release/
DESKTOP_APP_URL=https://… bun run desktop:dev   # or --url; default package.json "appUrl"
```

## Release builds

`release.yml` (tag `v*`, or run manually) builds the Bun executables for
backend and bot (linux x64/arm64, macOS arm64, Windows x64), the Electron
app (Windows NSIS, Linux AppImage, macOS zip), the Android APK (`expo
prebuild` + Gradle) and the iOS simulator app (`xcodebuild`). See
[`deploy/ci-cd.md`](./deploy/ci-cd.md).

## Local stack / deploy

```bash
./setups/setup-docker.sh [sqlite|postgres]    # everything in Docker Compose
./setups/setup-pm2.sh [sqlite|postgres]       # PM2, no Docker for the apps
bun run docker:sqlite:up | docker:postgres:up | docker:*:down
bun run pm2:start | pm2:start:bot | pm2:stop | pm2:restart | pm2:delete
```

Guides: [`deploy/local-setup.md`](./deploy/local-setup.md),
[`deploy/vps.md`](./deploy/vps.md), [`deploy/railway.md`](./deploy/railway.md),
[`deploy/android.md`](./deploy/android.md).
