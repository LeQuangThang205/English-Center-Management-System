# Changelog

This directory tracks releases and noteworthy changes across the project.

## Structure

```
docs/changelog/
├── README.md              # This file — conventions
├── unreleased.md          # Changes not yet in a release
├── v0.1.0.md              # Per-release changelogs
└── ...
```

## Conventions

This project follows [Keep a Changelog](https://keepachangelog.com/) and [Semantic Versioning](https://semver.org/).

### Format

```markdown
# v{MAJOR}.{MINOR}.{PATCH} — YYYY-MM-DD

### Added
- New feature A
- New feature B

### Changed
- Updated library X from v1 to v2

### Deprecated
- Old behaviour Y will be removed in v2.0

### Removed
- Removed deprecated feature Z

### Fixed
- Bug fix for issue #123

### Security
- Security patch for dependency X
```

### Types of changes

- **Added** — new features
- **Changed** — changes in existing functionality
- **Deprecated** — soon-to-be-removed features
- **Removed** — removed features
- **Fixed** — bug fixes
- **Security** — vulnerability fixes

## Unreleased Changes

See [unreleased.md](./unreleased.md) for changes staged for the next release.

## Versions

| Version | Date | Summary |
|---------|------|---------|
| — | — | *No releases yet.* |
