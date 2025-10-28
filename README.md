# scaffold

A pragmatic, domain-driven Node.js API template with transport independence and granular migration control.

## Features

- **Domain-Driven Architecture** - Self-contained modules with clear boundaries
- **Transport Independence** - Business logic separated from HTTP/platform concerns
- **Granular Migration Control** - Apply/rollback migrations at domain or file level
- **Dependency Injection** - Explicit dependencies via containers
- **GoTrue Authentication** - Supabase Auth integration
- **Example Domain** - Working reference implementation to learn from

## What's Included

- **Authentication module** (`auth`) - GoTrue integration with user management
- **Example module** (`example`) - Bookmarks and tags demonstrating patterns
- **Migration system** - Custom script for domain-based migrations
- **Transport layer** - Platform-independent handlers
- **Express platform** - Express-specific implementations
- **Docker setup** - PostgreSQL, GoTrue, and Redis containers
- **Development tooling** - ESLint, Prettier, Husky pre-commit hooks

## Requirements

- Node.js 22
- Docker and Docker Compose

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   ```bash
   cp env.sample .env
   ```

   **Important:** Generate a JWT secret for GoTrue authentication:

   ```bash
   # On macOS/Linux, update JWT_SECRET in .env with:
   openssl rand -base64 32
   ```

   Update other values in `.env` as needed:
   - `SMTP_*` - Email configuration (if email confirmation is enabled for GoTrue)
   - `PINO_TRANSPORT_TARGETS` - Logging targets (console, file, or sqlite)

3. **Start Docker containers**

   ```bash
   docker-compose up -d
   ```

   This starts three containers:
   - **PostgreSQL** (port 5431) - Main database
   - **GoTrue** (port 9998) - Supabase authentication service
   - **Redis** (port 6379) - Caching layer

4. **Run migrations**

   ```bash
   npm run migrate
   ```

5. **Start development server**

   ```bash
   npm run dev
   ```

   Server runs on http://localhost:3000

6. **Linting and formatting:**

   ```bash
   npm run format
   npm run lint
   ```

   Formats and lints the code. Is executed by Husky pre-commit.

## Next Steps

After setup, customize the template for your project:

1. **Remove example domain** (optional) - Delete `src/example/` if you don't need the reference
2. **Update project name** - Change `name` in `package.json`
3. **Create your first domain** - Follow the `example` domain structure
4. **Configure authentication** - Update GoTrue settings in `.env` for your needs

## Architecture

The project uses a domain-driven architecture with separate modules:

- `auth` - User authentication (integrated with GoTrue)
- `example` - Reference domain demonstrating the framework

Each domain is self-contained with its own models, repositories, actions, and migrations.

## Documentation

For more detailed information:

- [Architectural Structure](docs/architectural-structure.md) - Overall project structure and patterns
- [Container Architecture](docs/container-architecture.md) - Dependency injection and container system
- [Migration Script](scripts/README.md) - Database migration commands and usage

## License

MIT License - see [LICENSE](LICENSE) file for details
