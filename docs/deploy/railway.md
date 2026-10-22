# Deploy on Railway (production)

Production target: [Railway](https://railway.com/) — three services
(`backend`, `frontend`, `bot`) from **one image** (`infra/Dockerfile`),
plus managed Postgres. CI on `main` must be green before Railway deploys
("Wait for CI"). Docker details: [`docker.md`](./docker.md). CI map:
[`ci-cd.md`](./ci-cd.md).

## Architecture on Railway

```text
GitHub main ──► ci.yml (green) ──► Railway production
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
               backend            frontend             bot
           (infra/Dockerfile) (same image)        (same image)
                    │                 │                 │
                    └──────── Postgres (plugin) ────────┘
```

Each service has its own logs, restarts, scaling, and variables. The
container process is selected at runtime by `RAILWAY_SERVICE_TARGET`
(`backend` | `frontend` | `bot`) in `setups/railway-entrypoint.sh`.

### Why one image for three services

Railway always builds the whole Dockerfile — it cannot pick a multi-stage
`--target` per service
([Railway staff confirmation](https://station.railway.com/questions/use-dockerfile-targets-564aea7a)).
So `infra/Dockerfile` ends in a single runtime stage with all three apps.

## Prerequisites

1. Railway account + CLI (`railway login`) or dashboard access.
2. GitHub repo connected to Railway
   (`AlexGalhardo/agentic-personal-finances`).
3. Local verify green before push: `bun run check` (Bun ≥ 1.4.4).
4. Fresh secrets (never reuse `.env.example` placeholders):

```bash
openssl rand -hex 32   # BETTER_AUTH_SECRET, CRON_SECRET
openssl rand -hex 32   # ENCRYPTION_KEY (64 hex chars)
```

## CLI quick path (optional)

```bash
railway login
railway init                    # or: railway link -p <existing-project-id>
# Add Postgres plugin in the dashboard (or railway add)
# Create / configure services backend, frontend, bot (Dockerfile Path below)
railway up                      # deploys from linked directory when configured
```

Prefer **GitHub-connected services** so every push to `main` deploys after
CI, instead of only `railway up` from a laptop.

## 1. Project and database

1. **New Project → Empty Project** (name e.g. `agentic-personal-finances`).
2. **Create → Database → Add PostgreSQL** — exposes
   `${{Postgres.DATABASE_URL}}` to sibling services.

Postgres, not SQLite: services have separate filesystems; `backend` and
`bot` must share one database.

## 2. Three services from the same repo

Three times: **Create → GitHub Repo →** this repository, then rename them
`backend`, `frontend`, and `bot` (variable references below use those
names).

In **each** service:

| Setting         | Value                        |
| --------------- | ---------------------------- |
| Root Directory  | _(empty)_                    |
| Dockerfile Path | `infra/Dockerfile`           |
| Watch Paths     | default (whole repo) is fine |
| Branch          | `main`                       |
| Wait for CI     | **on**                       |

Without the Dockerfile Path, Railway falls back to Railpack, which does
not understand `RAILWAY_SERVICE_TARGET`.

## 3. Variables

### `backend`

```bash
RAILWAY_SERVICE_TARGET=backend
NODE_ENV=production
DATABASE_PROVIDER=postgresql
DATABASE_URL=${{Postgres.DATABASE_URL}}
BETTER_AUTH_SECRET=<generated>
ENCRYPTION_KEY=<generated>
CRON_SECRET=<generated>
APP_URL=https://${{backend.RAILWAY_PUBLIC_DOMAIN}}
FRONTEND_URL=https://${{frontend.RAILWAY_PUBLIC_DOMAIN}}
ENABLE_CONFIRM_EMAIL=false
ENABLE_2FA=false
ENABLE_ABACATEPAY=false
ABACATEPAY_PIX_TEST_MODE=false
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
ABACATEPAY_API_KEY=
ABACATEPAY_WEBHOOK_SECRET=
# Optional ops alerts — @galhardoalex/telegram-logger
TELEGRAM_LOGGER_BOT_TOKEN=
TELEGRAM_LOGGER_CHAT_ID=
```

Do **not** set `PORT` — Railway injects it.

### `frontend`

```bash
RAILWAY_SERVICE_TARGET=frontend
VITE_API_URL=https://${{backend.RAILWAY_PUBLIC_DOMAIN}}
# Optional server-side alerts (never EXPO_PUBLIC_ / VITE_ for bot tokens)
TELEGRAM_LOGGER_BOT_TOKEN=
TELEGRAM_LOGGER_CHAT_ID=
```

`VITE_API_URL` is a **build-time** ARG in `infra/Dockerfile`. Changing the
backend domain later requires **redeploying the frontend**.

### `bot`

```bash
RAILWAY_SERVICE_TARGET=bot
NODE_ENV=production
DATABASE_PROVIDER=postgresql
DATABASE_URL=${{Postgres.DATABASE_URL}}
BETTER_AUTH_SECRET=<same as backend>
ENCRYPTION_KEY=<same as backend>
FRONTEND_URL=https://${{frontend.RAILWAY_PUBLIC_DOMAIN}}
TELEGRAM_BOT_TOKEN=<from @BotFather>
BOT_PASSWORD_HASH_BASE64=<cd bot && bun run hash-password "...">
TELEGRAM_BOT_USE_PASSWORD_TO_CONFIRM_ACTIONS=false
TELEGRAM_LOGGER_BOT_TOKEN=
TELEGRAM_LOGGER_CHAT_ID=
TELEGRAM_CHAT_ID=
ENABLE_ABACATEPAY=false
ABACATEPAY_API_KEY=
ABACATEPAY_PIX_TEST_MODE=false
```

The bot is a long-polling worker: **no** public domain / HTTP port.

## 4. Public domains

In `backend` and `frontend` (not `bot`): **Settings → Networking →
Generate Domain**, then **Redeploy** both so `${{...}}` references
resolve.

## 5. Deploy flow

1. Commit on `main`, push (`git push origin main`).
2. GitHub Actions `ci.yml` runs.
3. Railway builds/deploys each service only if Wait for CI passes.
4. Backend entrypoint runs `prisma migrate deploy` then starts the API.

Smoke:

```bash
curl -sf https://YOUR-BACKEND.up.railway.app/
curl -sf https://YOUR-BACKEND.up.railway.app/openapi/json | head -c 200
curl -sI https://YOUR-FRONTEND.up.railway.app/ | head -n 20
```

Do **not** seed production — the seed refuses `NODE_ENV=production`.

## Environments

| Environment      | Branch              | Notes                                                                                                                    |
| ---------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `production`     | `main`              | Gated by CI; primary deploy target                                                                                       |
| Optional sandbox | _(none by default)_ | Create a second Railway environment only if you need a preview; do **not** copy production Resend/Google secrets blindly |

There is no standing git `dev` branch for Railway. Preview EAS builds are
manual (`mobile-build.yml` → workflow_dispatch).

## Cron

Railway has no built-in HTTP cron. Use cron-job.org or a GitHub Actions
`schedule` calling `/cron/check-expired-plans` and
`/cron/delete-pending-accounts` with
`Authorization: Bearer $CRON_SECRET` (see
[`vps.md`](./vps.md#cron-jobs-both-variants)).

## Troubleshooting

| Symptom                                | Fix                                                                                          |
| -------------------------------------- | -------------------------------------------------------------------------------------------- |
| Frontend loads, API/SSR fail           | Wrong `VITE_API_URL` at **build** time → fix var, redeploy frontend                          |
| Backend restart loop                   | Check `RAILWAY_SERVICE_TARGET` (case-sensitive) and `DATABASE_URL`                           |
| Bot 401                                | Invalid `TELEGRAM_BOT_TOKEN`                                                                 |
| Bot 409                                | Another process (local bot) polls the same token                                             |
| Deploy `SKIPPED`                       | CI red for that commit — fix `ci.yml` first                                                  |
| Image build: missing patch / workspace | See [`docker.md`](./docker.md) — `patches/` and `packages/core` must be in the install stage |

## Test the production image locally

```bash
docker build -f infra/Dockerfile -t agentic-personal-finances .
docker run -p 4000:4000 --env-file backend/.env \
  -e RAILWAY_SERVICE_TARGET=backend -e PORT=4000 \
  agentic-personal-finances
```

Day-to-day local work: [`local-setup.md`](./local-setup.md) (Compose or
`bun run dev:all`), not the Railway image.
