# Workflows

Step-by-step procedures for recurring work. Each has a matching skill in
`.agents/skills/agent-money-*` that agents load automatically.

## Shipping a change

1. Work on **`main`** — `.agents/skills/git-branch-workflow` (direct push;
   no standing `dev` branch).
2. Prefer the next Ready item in [`PLAN.md`](../PLAN.md) /
   [`specs/`](./specs/) (one H\* or M\* spec). Finish ACs + evidence under
   `docs/verification/specs/<ID>.md` in the same commit that ticks PLAN.
3. `bun run check` (Bun ≥ 1.4.4; typecheck = `bun check --no-script`), plus
   the E2E suite for the surfaces you touched.
4. Commit in atomic [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/):
   one concern per commit, lowercase subject, `!` + `BREAKING CHANGE:`
   footer for breaking changes. Stage paths explicitly — `git commit`
   takes the whole index, including anything staged earlier.
5. Add an entry under `## [Unreleased]` in `CHANGELOG.md`.
6. Before pushing: the `open-source-guidelines-pre-push` checklist
   (`.agents/skills/`) — no secrets in the diff, no `*.csv`/`*.env`.
7. `git push origin main` → wait for `ci.yml` on `main` to be green
   (`gh run watch <id> --exit-status`). CI gates the Railway production
   deploy. Release APKs come from `release.yml` on `v*` tags (not an
   automatic EAS production build on every push — see `mobile-build.yml`).

Skill: `agent-money-ship`.

## Spec-driven implementation (hexagonal / stack upgrades)

1. Read locked design: [`brainstorming.md`](./brainstorming.md),
   [`system-design.md`](./system-design.md), [`architecture.md`](./architecture.md).
2. Open [`specs/README.md`](./specs/README.md) — pick the first Ready spec
   whose dependencies are Done (order: H01…H08, then M01–M03).
3. Load `clean-architecture-in-practice` for any core/ports/use-case work.
4. Implement → verify gates from the spec → evidence file → PLAN checkbox.
5. Do not mix stack upgrades (M\*) into unfinished hexagonal slices (H\*).

## Releasing

Versions follow [SemVer](https://semver.org/). Project is at `1.0.0-rc`
until the final `1.0.0`. On `main`:

1. Move `## [Unreleased]` in `CHANGELOG.md` to `## [x.y.z] - YYYY-MM-DD`,
   update the compare links at the bottom ([Keep a Changelog](https://keepachangelog.com/en/1.1.0/)).
2. Bump `version` in the root and workspace `package.json` files.
3. `chore(release): vX.Y.Z` commit on `main`, then
   `git tag vX.Y.Z && git push origin main && git push origin vX.Y.Z` —
   `release.yml` builds every downloadable (Bun executables, Electron
   installers, Android APK, iOS simulator app) and attaches them, with
   `SHA256SUMS.txt`, to the GitHub Release. Create the GitHub Release
   notes from the CHANGELOG section (style reference:
   <https://github.com/AlexGalhardo/vukem/releases>). Run Actions →
   Release → Run workflow to build the same files as artifacts without
   publishing a tag.

## QA / pentest pass

`bun run qa` (= `bun scripts/qa.ts --start`) behaves like a human tester
over every app — see `.agents/skills/qa-pentest/SKILL.md`. Run it before a
release and after security-sensitive changes; CI runs it without the
Android group. A new screen or endpoint gets a check in the matching group.

## Adding or changing an API route

1. Zod schemas in `<domain>.schema.ts` (request + response).
2. Route in `<domain>.routes.ts` with `body`/`query`/`params`, `response`,
   and — for the public developer API — `detail: { summary, description }`
   in pt-BR (it renders on `/api`).
3. Logic in the service, errors as `AppError` subclasses, Prisma only in the
   repository.
4. Tests: unit for the service, integration in `server.integration.test.ts`
   (including the unauthorized/invalid cases).
5. Clients get the types automatically through Eden; `bun run typecheck`.
6. New public path outside `/transactions`? Adjust `exclude.paths` in
   `backend/src/app.ts` and the OpenAPI integration test.

## Security-sensitive change

Anything touching auth, the Telegram link, payments, webhooks, secrets or
user input: follow `security-and-hardening` (`.agents/skills/`), write the
abuse case as a test first, and record findings/decisions in
[`security.md`](./security.md). Skill: `agent-money-security`.

## Changing a sync point

Categories, auth error translations, password rules and plan rules are
duplicated across workspaces on purpose — see
[`code-conventions.md`](./code-conventions.md#sync-points-intentional-duplication).
Skill: `agent-money-sync-points`.

## Mobile UI work and visual review

1. Follow [`design-system.md`](./design-system.md) (tokens, components, patterns).
2. `bun run typecheck:mobile && bun run mobile:test`.
3. Prove the native bundle compiles:
   `cd mobile && EXPO_PUBLIC_API_URL=http://localhost:4200 npx expo export --platform android --clear`.
4. **Visual review without a device**: `cd mobile && bun run test:e2e:web`
   leaves the Expo web export in `mobile/dist-e2e/`; serve it with
   `bun scripts/serve-web-export.ts dist-e2e 4301` next to the E2E backend
   and screenshot it with Playwright at a phone viewport (390×844). Check
   hierarchy, spacing rhythm, empty/loading states — then keep the testIDs
   in the design system's list intact.
5. Native-only behavior (alerts, secure storage, deep links) needs Maestro
   on an emulator/device.

Skill: `agent-money-mobile-ui`.

## When CI is red

- Read the failing job: `gh run view <id> --log-failed`.
- A red job blocks Railway production deploys — fix forward with a new
  commit; never force-push `main`.
- Flaky E2E? Look for nondeterminism (random data, time, ordering) before
  adding retries or timeouts.

## Updating vendored skills

`.agents/skills/SOURCES.md` lists each upstream repo and commit. Replace the
folder from a fresh clone at the new commit, update the commit hash, and
never hand-edit vendored files.
