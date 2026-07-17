# AGENTS.md — AI Context for This Repository

This file is read by AI coding assistants (OpenCode, GitHub Copilot, Cursor, Codex) to understand the repository conventions, available skills, and documentation structure before starting work.

## Quick Start for AI Agents

1. Read this file first.
2. Read `PROJECT.md` for project overview, goals, and domain.
3. Read `docs/agents/domain.md` for the domain documentation layout.
4. Read `docs/agents/issue-tracker.md` to learn where issues and specs live.
5. Read `docs/agents/skills.md` to see which skills are available and when to invoke them.
6. Read `CONTEXT.md` if it exists, and any ADRs in `docs/adr/` relevant to the area of work.
7. Read `docs/agents/handoff.md` before ending a session to compact context for the next agent.

## Repository Structure

```
/
├── backend/             # Backend application code (to be populated)
├── frontend/            # Frontend application code (to be populated)
├── docs/
│   ├── adr/             # Architecture Decision Records
│   ├── agents/          # AI agent configuration files
│   ├── api/             # API contracts and documentation
│   ├── architecture/    # System architecture documentation
│   ├── changelog/       # Release changelogs
│   ├── database/        # Database schema and migration docs
│   ├── features/        # Feature specifications
│   ├── meeting-notes/   # Meeting notes
│   └── setup/           # Environment setup guides
├── scripts/             # Automation scripts (non-application)
├── .scratch/            # Local markdown issue tracker
├── AGENTS.md            # This file
├── PROJECT.md           # Project overview
├── CONTRIBUTING.md      # Contribution guidelines
├── DEVELOPMENT.md       # Development setup guide
├── CODE_STYLE.md        # Coding standards
└── README.md            # Project readme
```

## Agent Behaviour Guidelines

- **Read before writing.** Always read existing files and docs before proposing changes.
- **Respect ADRs.** Do not contradict an existing Architecture Decision Record without explicitly surfacing the conflict.
- **Use the domain glossary.** If `CONTEXT.md` exists, use its defined terms. Do not introduce synonyms.
- **Create ADRs sparingly.** Only offer an ADR when a decision is: (1) hard to reverse, (2) surprising without context, and (3) the result of a real trade-off.
- **Vertical slices.** Prefer narrow, complete vertical slices over horizontal layers.
- **Testable seams.** Write tests at public interfaces, not against internals.
- **No speculative generality.** Do not add abstraction or parameters for needs that don't exist yet.
- **Handoff before ending.** Use the `/handoff` skill to compact the current session for the next agent.

## Agent Skills

### Issue tracker

Issues and specs live as local markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage labels are: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout: `CONTEXT.md` at root + `docs/adr/`. See `docs/agents/domain.md`.

## Domain Documentation

- **CONTEXT.md** (if present) — glossary of domain terms. Must be read before starting work.
- **docs/adr/** — ADRs that record architecturally significant decisions.

## Coding Standards

Refer to `CODE_STYLE.md` for full coding conventions. Key principles:

- Clarity over cleverness
- Deep modules (small interface, large implementation)
- Tests verify behaviour through public interfaces
- Formatting enforced by tooling (not manual review)
- Commits follow Conventional Commits
