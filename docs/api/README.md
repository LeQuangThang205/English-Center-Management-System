# API Documentation

This directory contains API contracts, specifications, and reference documentation.

## Structure

```
docs/api/
├── README.md              # This file — overview and conventions
├── openapi.yaml           # OpenAPI / Swagger specification
├── endpoints/             # Detailed endpoint documentation
└── examples/              # Request/response examples
```

## Conventions

- **API-first design.** Define the contract before implementing.
- Use **OpenAPI 3.1** format for REST APIs.
- Use **GraphQL SDL** for GraphQL APIs (store schema in `schema.graphql`).
- Version APIs via URL prefix: `/api/v1/`, `/api/v2/`.
- One endpoint per file under `endpoints/` for detailed documentation.

## API Design Principles

- **Consistent naming.** Resources are nouns, actions are HTTP methods.
- **Predictable URLs.** `GET /resources`, `GET /resources/:id`, `POST /resources`.
- **Standard status codes.** 200 for success, 201 for created, 400 for bad request, 404 for not found, 500 for server error.
- **Pagination.** List endpoints return paginated results using cursor or offset pagination.
- **Error responses.** Consistent error shape: `{ "error": { "code": "...", "message": "..." } }`.

## Index

| Endpoint | Method | Description | Status |
|----------|--------|-------------|--------|
| — | — | *No endpoints defined yet.* | — |

## References

- [Architecture](../architecture/) — System context and container diagrams
- [Database](../database/) — Data model and schema
