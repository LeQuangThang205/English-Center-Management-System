# Contributing

Thank you for considering contributing to this project.

## Getting Started

1. Read [DEVELOPMENT.md](DEVELOPMENT.md) to set up your local environment.
2. Read [CODE_STYLE.md](CODE_STYLE.md) to understand coding conventions.
3. Read [PROJECT.md](PROJECT.md) to understand the project goals and domain.
4. Check the issue tracker under `.scratch/` for open tickets.

## Development Workflow

1. **Create a branch** from `main`:
   - `feature/<short-description>` — for new features
   - `fix/<short-description>` — for bug fixes
   - `chore/<short-description>` — for maintenance tasks
2. **Make changes** in small, focused commits.
3. **Run tests** and ensure the full suite passes.
4. **Open a pull request** against `main`.
5. **Address review feedback** and merge once approved.

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`, `perf`, `ci`, `build`.

Examples:
- `feat(auth): add OAuth2 login flow`
- `fix(api): handle null response in user endpoint`
- `docs(readme): update setup instructions`

## Pull Request Process

1. Keep PRs small and focused on a single concern.
2. Write a clear description explaining what and why.
3. Link to the relevant issue or spec under `.scratch/`.
4. Ensure CI passes and code review is addressed.
5. Squash-merge commits to keep `main` history clean.

## Code Review Guidelines

- Review for correctness, clarity, and adherence to `CODE_STYLE.md`.
- Check that tests cover the change at the appropriate seam.
- Verify the change implements what the spec or issue describes.
- Flag any Fowler code smells (see `CODE_STYLE.md`).

## Issue Tracking

Issues and specs are tracked as local markdown files under `.scratch/`. See `docs/agents/issue-tracker.md` for conventions.

## Code of Conduct

Be respectful, constructive, and professional. Focus on the work, not the person.
