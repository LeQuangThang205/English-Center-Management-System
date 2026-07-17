# Installed Skills Reference

This project has the following AI skills installed under `.agents/skills/`. Each skill is invoked by name and provides specialised instructions for specific tasks.

## How to invoke a skill

Skills are invoked by name in conversation: `/skill-name`. For example, `/code-review` runs the code review skill.

## Available Skills

### Engineering

| Skill | When to use |
|-------|-------------|
| `/code-review` | Review changes between HEAD and a fixed point (commit, branch, tag) along Standards and Spec axes |
| `/codebase-design` | Design deep modules with small interfaces and large implementations |
| `/diagnosing-bugs` | Systematic debugging for hard bugs and performance regressions (6-phase loop) |
| `/domain-modeling` | Sharpen domain vocabulary, resolve language conflicts, update CONTEXT.md glossary |
| `/grill-with-docs` | Stress-test a plan or design while generating ADRs and glossary entries |
| `/implement` | Implement a piece of work from a spec or set of tickets |
| `/improve-codebase-architecture` | Scan codebase for deepening opportunities, present candidates, design improvements |
| `/prototype` | Build a throwaway prototype (logic/state feel or UI look) to answer a design question |
| `/research` | Investigate a question against primary sources and capture findings |
| `/setup-matt-pocock-skills` | Bootstrap repository configuration for the engineering skills suite |
| `/tdd` | Test-driven development — red/green loop, test-first, vertical slices |
| `/to-spec` | Synthesise conversation into a spec (PRD) and publish to the issue tracker |
| `/to-tickets` | Break a plan or spec into vertical-slice tickets with blocking edges |

### Productivity

| Skill | When to use |
|-------|-------------|
| `/handoff` | Compact current session for another agent to resume; run before ending a session |
| `/wayfinder` | Plan a large chunk of work as a shared map of decision tickets |

## Skill Dependencies

Some skills compose others:

- `/grill-with-docs` = `/grilling` + `/domain-modeling`
- `/improve-codebase-architecture` uses `/codebase-design` vocabulary and `/grilling` for design review
- `/implement` suggests running `/tdd` where possible, then `/code-review` when done
- `/to-tickets` publishes to the tracker defined in `issue-tracker.md`
