# Claude Code project config

Tracked here:

- `settings.json` — shared Claude Code settings (plugins, etc.)
- `PROMPT.md` — session prompts for large refactors (optional)

Skills, rules, agent definitions, and reference checklists live under
[`.agents/`](../.agents/):

```text
.agents/skills/       — project + vendored skills
.agents/rules/        — coding rules (e.g. karpathy.md)
.agents/agents/       — subagent prompts
.agents/references/   — engineering checklists
```

See [`CLAUDE.md`](../CLAUDE.md) and [`AGENTS.md`](../AGENTS.md).
