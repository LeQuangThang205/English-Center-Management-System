# Development Setup

## Prerequisites

- **Node.js** — v20 LTS or later (check with `node --version`)
- **Package manager** — pnpm (recommended), npm, or yarn
- **Git** — v2.40 or later
- **Docker** (optional) — for containerized development
- **Database** — as specified in `docs/database/`

## Initial Setup

```bash
# Clone the repository
git clone <repo-url>
cd <project-directory>

# Install dependencies (choose one)
pnpm install
# or
npm install
# or
yarn install

# Copy environment variables
cp .env.example .env
# Edit .env with your local configuration
```

## Running the Application

### Backend

```bash
cd backend
# Follow backend-specific setup in backend/README.md
```

### Frontend

```bash
cd frontend
# Follow frontend-specific setup in frontend/README.md
```

## Testing

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test -- --coverage

# Run tests in watch mode
pnpm test -- --watch
```

## Code Quality

```bash
# Lint code
pnpm lint

# Type-check
pnpm typecheck

# Format code
pnpm format
```

## Common Tasks

| Task | Command |
|------|---------|
| Install dependencies | `pnpm install` |
| Run development server | `pnpm dev` |
| Run tests | `pnpm test` |
| Build for production | `pnpm build` |
| Lint code | `pnpm lint` |
| Format code | `pnpm format` |

## Environment Variables

See `.env.example` for the full list of required environment variables. Key variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |
| `DATABASE_URL` | Database connection string | — |

## Docker (Optional)

```bash
# Start development services (database, cache, etc.)
docker compose up -d

# Stop services
docker compose down
```

## Troubleshooting

### Port already in use
Change the `PORT` in `.env` or stop the process using the port.

### Database connection refused
Ensure Docker services are running: `docker compose up -d`
