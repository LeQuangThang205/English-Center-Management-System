# Setup Guide

This directory contains environment-specific setup instructions.

## Structure

```
docs/setup/
├── README.md              # This file — overview
├── local-development.md   # Local development environment setup
├── docker.md              # Docker-based development setup
└── production.md          # Production deployment configuration
```

## Quick Links

- [Local Development Guide](./local-development.md) — Getting started with local dev
- [Docker Setup](./docker.md) — Containerized development environment
- [Production Deployment](./production.md) — Deploying to production

## Environment Variables

See [DEVELOPMENT.md](../../DEVELOPMENT.md) for common environment variables. Full reference:

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `NODE_ENV` | Yes | Runtime environment | `development` |
| `PORT` | No | Application port | `3000` |
| `DATABASE_URL` | Yes | Database connection string | — |
| `LOG_LEVEL` | No | Logging verbosity | `info` |

## Prerequisites

- [Node.js](https://nodejs.org/) v20 LTS or later
- [Docker](https://www.docker.com/) (optional, for containerized services)
- [Git](https://git-scm.com/) v2.40 or later
