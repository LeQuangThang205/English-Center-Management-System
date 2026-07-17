# Code Style Guide

This document defines the coding standards for this project. It is used as the **Standards axis** reference during code review.

## General Principles

- **Clarity over cleverness.** Write code that is easy to read and understand. Optimise for the next reader, not for showing off.
- **Deep modules.** Prefer modules with a small interface and a lot of implementation behind it. A module is deep when it provides strong leverage — a lot of functionality per method.
- **Locality.** Keep related code close together. A change should affect as few files as possible.
- **No speculative generality.** Don't add abstractions, parameters, or hooks for needs that don't exist yet. You can always add them when the need arises.
- **Consistency over correctness.** When in doubt, follow the patterns already established in the codebase, even if a different approach would be marginally better.

## Language Conventions

### Naming

| Concept | Convention | Example |
|---------|-----------|---------|
| Classes / Types | PascalCase | `UserService`, `OrderStatus` |
| Functions / Methods | camelCase | `getUserById`, `validateOrder` |
| Variables | camelCase | `userName`, `orderTotal` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`, `DEFAULT_TIMEOUT` |
| Files | kebab-case | `user-service.ts`, `order-repository.ts` |
| Directories | kebab-case | `api-routes/`, `domain-models/` |

### File Organization

- One primary export per file.
- File name matches the primary export name (kebab-case).
- Group by module/feature, not by technical layer.

```
src/
├── orders/
│   ├── order-service.ts
│   ├── order-repository.ts
│   ├── order-types.ts
│   └── order-service.test.ts
└── users/
    ├── user-service.ts
    └── user-service.test.ts
```

### Formatting

Formatting is enforced by automated tooling (Prettier, ESLint, etc.). Do not debate formatting in code review.

### Imports

- Sort imports: external → internal, absolute → relative.
- No unused imports.
- Prefer named exports over default exports.

## Testing Standards

- Tests verify behaviour through **public interfaces**, not internal implementation.
- One test file per module, co-located: `order-service.ts` → `order-service.test.ts`.
- Test descriptions read as specifications: `"creates an order with valid line items"`.
- Avoid mocks for in-process dependencies. Prefer real implementations or in-memory alternatives.
- A test that must change when the implementation changes is testing the wrong thing.

## Error Handling

- Use typed errors (custom error classes) rather than generic `Error` or string messages.
- Handle errors at the boundary, not in every function.
- Prefer returning result types over throwing exceptions for expected failure modes.

## Documentation

- Document **why**, not **what**. The code itself should make the "what" obvious.
- Comments should explain non-obvious trade-offs, constraints, or reasons.
- Keep `CONTEXT.md` glossary terms precise. Avoid general programming concepts.

## Code Smells (from Fowler, Refactoring)

This project uses the following 12 code smells as a baseline during code review. A documented standard in this file overrides any smell.

1. **Mysterious Name** — a name that doesn't reveal intent → rename it.
2. **Duplicated Code** — same logic in multiple places → extract and share.
3. **Feature Envy** — a method that reaches into another object more than its own → move it.
4. **Data Clumps** — same fields travelling together → bundle into a type.
5. **Primitive Obsession** — primitives standing in for domain concepts → create a type.
6. **Repeated Switches** — same switch on the same type in multiple places → polymorphism or a shared map.
7. **Shotgun Surgery** — one change forces edits in many files → consolidate.
8. **Divergent Change** — one file changes for multiple reasons → split it.
9. **Speculative Generality** — abstractions for needs that don't exist → delete them.
10. **Message Chains** — long `a.b().c()` navigation → hide behind one method.
11. **Middle Man** — a class that mostly delegates → cut it out.
12. **Refused Bequest** — a subclass that ignores most of what it inherits → use composition.

## References

- [Code Review Skill](../.agents/skills/code-review/SKILL.md) — how code reviews are performed
- [Deepening Guide](../.agents/skills/codebase-design/DEEPENING.md) — how to deepen shallow modules
- [Design It Twice](../.agents/skills/codebase-design/DESIGN-IT-TWICE.md) — exploring alternative interfaces
