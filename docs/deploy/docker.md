# Docker and Compose

How this monorepo is packaged and run in containers — local Compose,
VPS Compose, and the single Railway image. Companion guides:
[`local-setup.md`](./local-setup.md), [`railway.md`](./railway.md),
[`vps.md`](./vps.md).

## File map

| Path                              | Role                                                                                                                            |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `infra/Dockerfile`                | **Railway production image** — one image, three processes (`backend` / `frontend` / `bot`) selected by `RAILWAY_SERVICE_TARGET` |
| `setups/railway-entrypoint.sh`    | Entrypoint for that image (migrate + start the chosen target)                                                                   |
| `backend/Dockerfile`              | Local / VPS API image (Compose)                                                                                                 |
| `frontend/Dockerfile`             | Local / VPS web image (Compose); takes `VITE_API_URL` build arg                                                                 |
| `bot/Dockerfile`                  | Local / VPS Telegram bot image (Compose)                                                                                        |
| `infra/docker-compose.yml`        | Local stack + **Postgres**                                                                                                      |
| `infra/docker-compose.sqlite.yml` | Local stack + **SQLite** volume (no Postgres container)                                                                         |
| `infra/docker-compose.prod.yml`   | VPS stack: Postgres + apps + **Caddy** TLS                                                                                      |
| `infra/Caddyfile`                 | Reverse proxy for Compose prod (used by `docker-compose.prod.yml`)                                                              |
| `infra/Caddyfile.vps`             | Caddy config for PM2-on-host VPS variant                                                                                        |
| `setups/setup-docker.sh`          | Interactive local bring-up (SQLite or Postgres)                                                                                 |
| `.env.example` (repo root)        | `DOMAIN` / `POSTGRES_PASSWORD` for Compose prod / Caddy                                                                         |

Always run Compose from the **repository root** with
`--project-directory .` so `env_file` and build contexts resolve:

```bash
docker compose -f infra/docker-compose.sqlite.yml --project-directory . up -d --build
docker compose -f infra/docker-compose.yml --project-directory . up -d --build
```

Root package scripts:

```bash
bun run docker:sqlite:up    # / down
bun run docker:postgres:up  # / down
```

## Why two packaging styles?

| Context             | Image(s)                                                      | Why                                                                                                                                   |
| ------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Local Compose / VPS | Per-service Dockerfiles under `backend/`, `frontend/`, `bot/` | Fast rebuilds, clear ownership, Compose can start Postgres/Caddy beside them                                                          |
| Railway             | Single `infra/Dockerfile`                                     | Railway always builds the full Dockerfile (no per-service `--target`); one image + `RAILWAY_SERVICE_TARGET` keeps one source of truth |

Do **not** point Railway at `backend/Dockerfile` alone — the production
entrypoint, Prisma migrate-on-boot, and shared layout live in
`infra/Dockerfile` + `setups/railway-entrypoint.sh`.

## Local Compose (SQLite)

Zero database setup. Backend and bot share a named volume (`sqlite_data`)
mounted at `/data` with `DATABASE_URL=file:/data/dev.db`.

```bash
./setups/setup-docker.sh sqlite   # or: bun run docker:sqlite:up
```

Services: `backend` `:4000`, `frontend` `:4001`, `bot` (no port).

## Local Compose (Postgres)

```bash
./setups/setup-docker.sh postgres   # or: bun run docker:postgres:up
```

Services: `postgres` `:5432` (user/pass/db `elysia` / `elysia` /
`elysia_financas`), plus `backend`, `frontend`, `bot`.

## Production Compose (VPS)

Uses `infra/docker-compose.prod.yml` + root `.env` (`DOMAIN`,
`POSTGRES_PASSWORD`). Caddy terminates TLS for `api.$DOMAIN` and
`$DOMAIN`. Full steps: [`vps.md`](./vps.md).

## Railway image — build and smoke locally

Requires Docker. From the repo root:

```bash
# Build (frontend SSR is always built into the image)
docker build -f infra/Dockerfile \
  --build-arg VITE_API_URL=http://localhost:4000 \
  -t agentic-personal-finances .

# API
docker run --rm -p 4000:4000 \
  --env-file backend/.env \
  -e RAILWAY_SERVICE_TARGET=backend \
  -e PORT=4000 \
  agentic-personal-finances

# Web (needs a built dist inside the image; PORT defaults in server.ts)
docker run --rm -p 4001:4001 \
  -e RAILWAY_SERVICE_TARGET=frontend \
  -e PORT=4001 \
  -e VITE_API_URL=http://host.docker.internal:4000 \
  agentic-personal-finances
```

The install stage copies workspace `package.json` files (including
`packages/core`) and `patches/` so `bun install --frozen-lockfile`
succeeds even though mobile is not in the image.

## Environment variables (containers)

| Variable                             | Where                                                        | Notes                                                                           |
| ------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `RAILWAY_SERVICE_TARGET`             | Railway image only                                           | `backend` \| `frontend` \| `bot`                                                |
| `PORT`                               | backend / frontend                                           | Injected by Railway; set explicitly in local `docker run`                       |
| `DATABASE_PROVIDER` / `DATABASE_URL` | backend, bot                                                 | `sqlite` or `postgresql`                                                        |
| `VITE_API_URL`                       | frontend **build arg** (browser) and **runtime** (SSR proxy) | In Compose, build arg = public URL; runtime env = `http://backend:4000`         |
| `TELEGRAM_LOGGER_*`                  | backend, bot, frontend server                                | Optional ops alerts — see [`../tooling.md`](../tooling.md#ops-logging-telegram) |

Never bake real secrets into images. Pass them via Compose `env_file`,
Railway Variables, or `docker run --env-file`.

## Health checks / smoke

```bash
curl -sf http://localhost:4000/          # {"success":true,...}
curl -sfI http://localhost:4001/         # 200 + security headers
```

Prisma Studio (Compose SQLite volume):

```bash
docker compose -f infra/docker-compose.sqlite.yml --project-directory . exec backend \
  bunx prisma studio --port 5555 --hostname 0.0.0.0
```

## Troubleshooting

| Symptom                                                  | Likely cause                                                                                     |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `Couldn't find patch file` during `bun install` in image | `patches/` not copied into the build context                                                     |
| Frontend talks to itself / SSR can't reach API           | Runtime `VITE_API_URL` still `localhost` inside the container — use the Compose service hostname |
| Bot 409 Conflict                                         | Another process (local or another env) long-polls the same `TELEGRAM_BOT_TOKEN`                  |
| Railway restart loop                                     | Missing / wrong `RAILWAY_SERVICE_TARGET`, or bad `DATABASE_URL`                                  |
| Workspace install fails after adding `packages/core`     | `infra/Dockerfile` install stage must `COPY packages/core/package.json`                          |
