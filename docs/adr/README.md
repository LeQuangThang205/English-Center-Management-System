# Architecture Decision Records

ADRs record architecturally significant decisions made during the project's lifecycle. They exist so that future contributors (and future you) can understand *why* things are the way they are.

## When to write an ADR

All three conditions must be true:

1. **Hard to reverse** — changing your mind later would be costly.
2. **Surprising without context** — a future reader would look at the code and wonder "why?"
3. **The result of a real trade-off** — there were genuine alternatives, and you chose one for specific reasons.

If a decision is easy to reverse, skip it — you'll just reverse it. If it's not surprising, nobody will wonder. If there was no real alternative, there's nothing to record.

### What qualifies

- **Architectural shape** — monorepo vs polyrepo, module boundaries
- **Integration patterns** — events vs HTTP, sync vs async
- **Technology choices with lock-in** — database, message bus, auth provider, deployment target
- **Boundary and scope decisions** — what each module owns, explicit "no"s
- **Deliberate deviations from the obvious path** — manually SQL instead of an ORM
- **Constraints not visible in code** — compliance, SLAs, partner contracts
- **Rejected alternatives when non-obvious** — so the question isn't re-opened every 6 months

## Format

ADRs live in this directory, numbered sequentially: `0001-slug.md`, `0002-slug.md`, etc.

```markdown
# {Short title}

{1-3 sentences: what's the context, what did we decide, and why.}
```

That's it. An ADR can be a single paragraph. Optional sections (only when they add value):

- `Status: proposed | accepted | deprecated | superseded by ADR-NNNN`
- `Considered Options` — rejected alternatives worth remembering
- `Consequences` — non-obvious downstream effects

## Index

| # | Title | Status | Date |
|---|-------|--------|------|
| — | *No ADRs yet. Create the first one when an architecturally significant decision is made.* | | |

## References

- [ADR Format](../.agents/skills/domain-modeling/ADR-FORMAT.md) — full format specification
- [Domain Modeling Skill](../.agents/skills/domain-modeling/SKILL.md) — how ADRs are created during design
