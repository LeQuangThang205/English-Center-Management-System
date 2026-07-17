# Feature Documentation

This directory contains feature specifications (PRDs) and related documentation.

## Structure

```
docs/features/
├── README.md              # This file — overview
└── <feature-name>/        # One directory per feature
    ├── spec.md            # Feature specification
    └── issues/            # Implementation tickets (also tracked in .scratch/)
```

## Feature Specification Template

Each spec should cover:

```markdown
# Feature: {Name}

## Problem Statement
{What problem does this solve, from the user's perspective?}

## Solution
{What does the solution look like from the user's perspective?}

## User Stories
- As a {role}, I want {goal}, so that {benefit}.

## Implementation Decisions
{Key technical decisions, module boundaries, interfaces, schema changes}

## Testing Decisions
{What makes a good test for this feature? Which seams are tested?}

## Out of Scope
{What is explicitly not included in this feature?}
```

## Tickets

Implementation tickets for features are tracked under `.scratch/<feature-slug>/issues/`. See [docs/agents/issue-tracker.md](../agents/issue-tracker.md) for the ticket format.

## Index

| Feature | Status | Spec | Tickets |
|---------|--------|------|---------|
| — | — | — | — |
