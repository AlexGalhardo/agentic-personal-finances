# Scope rename verification

Renamed workspace npm scope `@agent-money-boilerplate/*` →
`@agentic-personal-finances/*`.

## Packages updated

| Package       | New name                                      |
| ------------- | --------------------------------------------- |
| backend       | `@agentic-personal-finances/backend`          |
| frontend      | `@agentic-personal-finances/frontend`         |
| bot           | `@agentic-personal-finances/bot`              |
| mobile        | `@agentic-personal-finances/mobile`           |
| desktop       | `@agentic-personal-finances/desktop`          |
| packages/core | `@agentic-personal-finances/core` (unchanged) |

## Checks

```bash
bun install
bun check --no-script -p backend -p frontend -p bot -p packages/core
rg '@agent-money-boilerplate'  # expect no matches outside historical git history
```

## Evidence

- All workspace `package.json` `name` and `workspace:*` deps updated.
- Import paths in bot, frontend, mobile, and `scripts/check-dependency-rule.ts`
  updated.
- Docker comments and docs aligned with the new scope.
