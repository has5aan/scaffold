# scaffold

A domain-driven Node.js API template with transport independence and granular migration control while trying to say pragmatic.

## Features

- **Domain-Driven Architecture** - Self-contained modules with clear boundaries
- **Transport Independence** - Business logic separated from HTTP/platform concerns
- **Granular Migration Control** - Apply/rollback migrations at domain or file level
- **Dependency Injection** - Explicit dependencies via containers
- **GoTrue Authentication** - Supabase Auth integration
- **Example Domain** - Working reference implementation to learn from

## What's Included

- **Authentication module** (`auth`) - GoTrue integration with user management
- **Example module** (`example`) - Tools to manage bookmarks
- **Migration system** - Custom script for domain-based migrations
- **Transport layer** - Platform-independent handlers
- **Express platform** - Express-specific implementations
- **Docker setup** - PostgreSQL, GoTrue, Redis, and MinIO containers
- **Development tooling** - ESLint, Prettier, Husky pre-commit hooks

## Documentation

For more detailed information:

- [Getting Started](docs/getting-started.md) - Step-by-step setup and first domain creation
- [Architectural Structure](docs/architectural-structure.md) - Overall project structure and patterns
- [Container Architecture](docs/container-architecture.md) - Dependency injection and container system
- [Design Flexibility](docs/design-flexibility.md) - Architecture flexibility and scalability patterns
- [Recipes](docs/recipes.md) - Common customizations (OAuth, GraphQL, WebSockets, etc.)
- [Migration and Seed Scripts](scripts/README.md) - Database migration and seed commands

## License

MIT License - see [LICENSE](LICENSE) file for details
