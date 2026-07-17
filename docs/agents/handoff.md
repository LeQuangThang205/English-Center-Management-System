# Handoff Protocol

Before ending a session, use the `/handoff` skill to compact the current conversation for the next agent. This file describes the handoff process and format.

## When to handoff

- The current session has reached a natural stopping point.
- The task is larger than a single session and needs continuation.
- Another agent needs context to pick up the work.
- End of a work session.

## Handoff process

1. Invoke `/handoff` with a description of what the next session should focus on.
2. The skill writes a handoff document to the OS temporary directory (not the workspace).
3. The document includes:
   - Current session summary
   - Key decisions made
   - Remaining work and next steps
   - Suggested skills for the next agent
   - References to files, issues, and ADRs (not duplicated content)

## Handoff content rules

- **Do not duplicate** content already captured in specs, plans, ADRs, issues, commits, or diffs. Reference them by path or URL instead.
- **Redact** sensitive information (API keys, passwords, PII).
- **Include** a "suggested skills" section recommending skills the next agent should invoke.

## Example handoff structure

```
# Handoff: {Session Topic}

## Session Summary
{2-4 sentences on what was accomplished}

## State
- Current branch: {branch name}
- Files modified: {list of files}
- Pending: {what remains to be done}

## Key Decisions
{List of decisions made, with references to ADRs or notes}

## Suggested Skills for Next Session
- /{skill-name} — why to use it

## References
- Spec: .scratch/{feature}/spec.md
- Tickets: .scratch/{feature}/issues/
- ADRs: docs/adr/
```

## References

- [Handoff Skill](../../.agents/skills/handoff/SKILL.md) — skill that creates the handoff document
