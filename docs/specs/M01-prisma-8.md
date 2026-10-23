# M01 Prisma 8 RC

| Field      | Value                                                  |
| ---------- | ------------------------------------------------------ |
| PLAN tasks | M01                                                    |
| Status     | Done                                                   |
| Depends on | H05 (transactions on ports — safer migration boundary) |
| Risk       | High: ORM major/RC; dual schema                        |

## 1. Goal

Upgrade Prisma to the latest 8.x RC documented at the time of implementation
([Prisma llms](https://www.prisma.io/llms.txt)), keeping dual SQLite/Postgres
schemas and generated client paths working for backend, bot, and CI.

## 2. Non-goals

- Do not upgrade Elysia/TanStack in this spec.
- Do not redesign repository ports.

## 3. Current state

- Prisma **7.10.0** in `backend/package.json`
- Dual schemas via `DATABASE_PROVIDER` / `prisma7.config.ts` (verify filename
  at implementation time; may rename per Prisma 8 docs)

## 4. Design

Follow official Prisma 8 RC migration guide:

1. Bump `prisma`, `@prisma/client`, adapters to exact RC versions.
2. Update config files per breaking changes.
3. Regenerate clients for sqlite + postgres paths used in CI/Docker.
4. Fix compile errors in adapters only.

Pin exact versions (no `^`).

## 5. Files

| Action | Path                                |
| ------ | ----------------------------------- |
| Modify | `backend/package.json`, lockfile    |
| Modify | Prisma config + schemas as required |
| Modify | adapters if client API changes      |
| Modify | Docker/CI if CLI flags change       |

## 6. Implementation steps

1. Read current Prisma 8 RC notes.
2. Upgrade + regenerate.
3. Fix types; full backend test + bot typecheck.
4. Update docs versions.

## 7. Acceptance criteria

- **AC-1** `bun run --cwd backend db:generate` succeeds with `DATABASE_URL`.
- **AC-2** Backend tests green.
- **AC-3** Docker build path still `COPY`s schemas/patches as needed.
- **AC-4** `docs/architecture.md` stack table shows Prisma 8 RC pin.

## 8. Tests

- Existing backend suite is the acceptance suite.

## 9. Verification

```bash
bun install
bun run --cwd backend db:generate
bun run --cwd backend test
bun check --no-script -p backend -p bot
```

## 10. Documentation updates

- architecture, tooling, CHANGELOG, PLAN

## 11. Risks and rollback

RC regressions — pin previous 7.10.0 in revert commit. Do not merge if
generate/deploy scripts break.

## 12. Quality and delivery assertions

| ID   | Check                          | Pass                        |
| ---- | ------------------------------ | --------------------------- |
| DA-1 | Exact versions in package.json | no caret on prisma packages |
| DA-2 | Tests                          | backend test exit 0         |

Evidence: `docs/verification/specs/M01.md`
