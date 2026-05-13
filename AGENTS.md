# Repository Instructions

Before doing any work in this repository, read [`SKILL.md`](/c:/MyDeveloper/test-multi-agent/SKILL.md) first.

## Order Of Priority

1. Follow `SKILL.md` first.
2. Then follow the most relevant file in `.claude/agents/` for the task you are handling.
3. If there is a conflict, `SKILL.md` wins unless the user explicitly says otherwise.

## Working Rules

- Preserve existing changes unless the user asks to modify them.
- Prefer small, targeted edits over broad refactors.
- Use the project's established stack and conventions.
- Check the current workspace state before changing files.

## Task Routing

- Use `.claude/agents/architect.md` for schema, types, and API contract work.
- Use `.claude/agents/backend-dev.md` for route handlers, MongoDB, and seed data.
- Use `.claude/agents/frontend-dev.md` for UI and component work.
- Use `.claude/agents/devops.md` for Docker and deployment work.
- Use `.claude/agents/reviewer.md` for review tasks.
- Use `.claude/agents/qa.md` for tests and verification.
