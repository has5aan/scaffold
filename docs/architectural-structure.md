# Architectural Structure

## Overview

This project follows a **modular, domain-driven architecture** with a transport-independent core. The architecture is organized into self-contained modules (domains) that can operate independently while sharing common infrastructure through dependency injection containers.

## Core Principles

1. **Domain Isolation** - Self-contained domains with clear boundaries
2. **Transport Independence** - Business logic is independent of HTTP, WebSocket, or any other protocol
3. **Dependency Injection** - Explicit dependencies managed through containers
4. **Layered Architecture** - Clear separation between transport, business logic, and data access
5. **Model-Driven Queries** - Flexible data access using knex-tools with projections and relations

## Domain Isolation

The codebase is organized into self-contained domains within `src/`, each representing a distinct business capability:

- **`src/auth/`** - Authentication and authorization using GoTrue (Supabase Auth)
- **`src/example/`** - Tag management (fully implemented reference domain)

### Module Structure

Each module may contain:

```
module/
├── actions/          # Business logic layer
├── domain/           # Domain models and objects
├── models/           # Data models (knex-tools format)
├── repositories/     # Data access layer
├── services/         # Business services
├── validators/       # Input and business rule validation
│   ├── rules/        # Business rule validation
│   └── schema/       # Joi schemas for input validation
├── migrations/       # Database schema definitions
└── {module}.container.js  # Domain-specific dependency injection
```

**Why this structure?**

- **Vertical slicing** - All domain code lives together
- **Clear boundaries** - Each domain is self-contained and independent
- **Scalability** - Easy to add new domains without affecting existing ones
- **Team collaboration** - Teams can own entire modules

### Cross-Cutting Concerns (Outside Modules)

The following concerns are shared across all domains and live outside individual modules:

```
src/
├── transport/        # HTTP transport layer (platform-independent)
│   ├── handlers/     # HTTP handlers (work with any HTTP framework)
│   ├── middleware/   # HTTP middleware core logic (work with any HTTP framework)
│   └── error-mapping.js # Maps domain errors to HTTP status codes
├── platforms/        # Platform-specific implementations
│   ├── containers.js # Shared infrastructure instances
│   └── express/      # Express framework
│       ├── adapters/ # Express-specific adapters
│       ├── middleware/ # Express-specific middleware wrappers
│       └── example/    # Express-specific routes and setup
├── lib/              # Shared utilities (errors, logging, database helpers)
├── config/           # Configuration files
└── container.js      # Common DI container
```

## Transport Independence

The architecture achieves Transport Independence by separating business logic from protocol-specific concerns.

### Layered Flow

```
Platform Layer (Express Router)
    ↓
Transport Layer (HTTP Handler)
    ↓
Actions Layer (Business logic)
    ↓
Repository Layer (Data access with knex-tools)
    ↓
Database
```

### Example: Tag Creation Flow

**1. Express Router** (`src/platforms/express/example/routers/tag.router.js`)

- Platform-specific (Express)
- Maps HTTP methods to handler calls
- Uses adapter to convert domain responses to Express JSON responses

**2. Handler** (`src/transport/handlers/example/tag.handler.js`)

- HTTP-dependent, platform-independent
- Orchestrates business logic
- Returns domain response objects (CreatedResponse, OkResponse, etc.)

**3. Actions** (`src/example/actions/tag.actions.js`)

- Pure business logic
- Input validation and business rule enforcement
- Coordinates repository operations

**4. Repository** (`src/example/repositories/tag.repository.js`)

- Data access abstraction
- Uses knex-tools for model-driven queries

## Transport Layer and Platform Adapters

The architecture separates HTTP-level concerns (transport) from framework-specific implementations (platform).

### Transport Layer

HTTP-dependent but platform-independent logic that works with any HTTP framework.

**Handlers** (`src/transport/handlers/example/tag.handler.js`):

- Process HTTP requests using Express-style request objects (req.body, req.params, req.query)
- Return domain response objects
- Compatible with Express and frameworks using the same request format (Vercel, etc.)

**Middleware Core** (`src/transport/middleware/`):

- Header validation logic
- Rate limiting logic
- Pure functions that return result objects

**Error Mapping** (`src/transport/error-mapping.js`):

- Maps domain errors (ValidationError, AuthenticationError) to HTTP status codes
- Platform-independent error handling logic

### Platform Layer

Framework-specific wrappers that adapt transport logic to specific platforms.

**Express Middleware** (`src/platforms/express/middleware/auth.middleware.js`):

- Wraps auth service for Express request/response model
- Extracts bearer token from headers
- Attaches user object to request

**Express Header Validation** (`src/platforms/express/middleware/header-validation.middleware.js`):

- Adapts transport middleware to Express API
- Validates platform-specific headers (X-Platform, X-Install-ID)
- Returns Express JSON responses

**Express JSON Error Handler** (`src/platforms/express/middleware/error-handler.middleware.js`):

- Adapts error mapping to Express error handling
- Uses Express response API (`res.status()`, `res.json()`)

Most middleware follows a builder pattern (e.g., `buildJsonErrorHandlerMiddleware`), making it clear what they handle (JSON, future HTML or XML). Header validation is an exception and created inline as a simple function.

### Platform Adapters

Platform-specific adapters convert domain response objects to framework-specific responses.

**Express JSON Response Adapter** (`src/platforms/express/adapters/response.adapter.js`):

- Converts domain response objects to Express JSON responses
- Uses Express API (`res.status()`, `res.json()`, `res.send()`)
- Name clearly indicates it's JSON-specific

Future platforms like Fastify would have their own adapters using their respective APIs.

**Response Classes** (`src/lib/http-responses.js`):

- Domain response objects (OkResponse, CreatedResponse, etc.)
- Accept complete return value from actions (including metadata if present)
- Handlers pass action's return value directly to response classes

## Authentication with GoTrue

The project uses **GoTrue (Supabase Auth)** for authentication via the `@supabase/gotrue-js` client.

**How it works:**

1. Client sends bearer token in Authorization header
2. Express middleware extracts token from headers
3. Auth service validates token with GoTrue server
4. Returns immutable User domain object
5. User object attached to request for downstream handlers

The core auth logic (`auth.service.js`) is platform-independent. Each platform has its own middleware wrapper (e.g., `buildAuthMiddleware()` for Express) that adapts the service to that platform's request/response model.

## Data Access with knex-tools

Repositories use **knex-tools** for flexible, model-driven queries.

### Models

Models define table structure, projections, relations, and query modifiers (`src/example/models/tag.model.js`):

- **Projections** - Define which columns to select (default, summary, minimal)
- **Relations** - Define relationships (belongsTo, hasMany, manyToMany)
- **Modifiers** - Reusable query logic (forUser, byStatus, etc.)

### Query Building

knex-tools `buildQuery` function constructs queries from models and options:

- Supports projections, relations, filtering, pagination, and metadata
- Declarative query building
- Reusable projections and relations
- Consistent query patterns across repositories

**Benefits:**

- Declarative query building
- Reusable projections and relations
- Type-safe column selection
- Consistent query patterns across repositories

## Container Architecture

The project uses **dependency injection containers** to manage dependencies.

### Infrastructure Container (`src/platforms/containers.js`)

Creates and instantiates shared infrastructure instances:

- Knex database connection
- Redis cache client
- Logger instance
- Common container (middleware and cross-cutting services)
- Domain containers (e.g., exampleContainer) - instantiated with knex and common container references

### Common Container (`src/container.js`)

Manages shared middleware and cross-cutting services:

- Middleware registration and retrieval
- Cross-cutting concerns (logging, caching, monitoring)

### Domain Container (`src/example/example.container.js`)

Each domain has its own container for isolated dependency management:

- Repository builders (buildTagRepository, etc.)
- Actions builders (buildTagActions, etc.)
- Singleton pattern with Map caching

### Wiring It All Together

**Express App** (`src/platforms/express/app.js`):

- Registers middleware in common container
- Mounts domain routes with containers

**Domain Integration** (`src/platforms/express/example/example.app.js`):

- Builds handlers from domain container
- Creates routers with handlers
- Applies middleware and mounts routes

**Benefits:**

- **Isolation** - Each domain manages its own dependencies
- **Testability** - Easy to create test containers with mocks
- **Flexibility** - Dependencies can be swapped without changing business logic
- **Singleton Management** - Containers cache instances to ensure single instances

## Database Migrations

Migrations are organized by domain using a custom migration script that leverages Knex's API. Each migration file follows the naming pattern `{domain}-{execution order}-{name}.js` for clarity and organization.

### Migration Management Script

The project uses `scripts/migrate.js` - a unified script that provides granular control over migrations at three levels:

1. **All domains** - Run migrations across multiple domains in order
2. **Per-domain** - Run/rollback migrations for specific domains
3. **Individual files** - Apply/rollback specific migration files

**Why a custom script?**

Knex's `--migrations-directory` flag has a limitation: it maintains a single global `knex_migrations` table that references all applied migrations across all directories. When you override the directory, Knex still expects to find ALL previously-applied migration files and throws errors if they're missing from the current directory context.

Our script solves this by:

- Reading migration files from each domain's directory
- Using Knex's API (`migrate.up()`, `migrate.down()`) to run individual migrations
- Letting Knex handle all tracking automatically
- Keeping migrations distributed in domain directories

### Running Migrations

See `scripts/README.md` for detailed migration commands.

### Key Features

- ✅ **Knex API** - Uses `migrate.up()` and `migrate.down()` for proper tracking
- ✅ **Per-domain control** - Run/rollback specific domains
- ✅ **Individual file control** - Apply/rollback specific migrations out of order
- ✅ **Distributed structure** - Migrations stay in domain directories
- ✅ **No directory conflicts** - Avoids Knex's `--migrations-directory` limitation
- ✅ **Smart skipping** - Knex automatically skips already-applied migrations
- ✅ **Clear ownership** - Filename starts with domain name

### Migration Naming Convention

**Format:** `{domain}-{execution order}-{name}.js`

**Example Structure:**

```
auth/migrations/
  ├── auth-01-schema.js      # Creates auth schema
  └── auth-02-user.js        # Creates users table

example/migrations/
  ├── example-01-schema.js       # Creates example schema
  ├── example-02-tag.js          # Creates tag table (can FK to auth.users)
  ├── example-03-bookmark.js     # Creates bookmark table
  └── example-04-bookmark-tag.js # Junction table
```

**Domain Migrations Execution Order:**

When running migrations, domains execute in this order:

1. **auth** - Foundational (run first)
2. **example** - Depends on auth.users (run after auth)

**Why this naming:**

- ✅ **Domain-first grouping** - All auth migrations are grouped together alphabetically
- ✅ **Readable filenames** - `example-02-tag.js` is clearer than `02-02-tag.js`
- ✅ **Clear ownership** - Domain name is front and center
- ✅ **Explicit ordering** - Execution order visible in filename

Each domain maintains its own schema and tables:

- **Auth**: `auth.users`
- **Example**: `example.tag` (fully implemented), `example.bookmark`, `example.bookmark_tag` (database schema only)

## Validation Strategy

The project uses **two-tier validation**:

### 1. Input Validation (Schema)

Validates request structure using Joi schemas (`src/example/validators/schema/tag.schema.js`).

### 2. Business Rules Validation

Enforces domain-specific business rules (`src/example/validators/rules/tag.rules.js`):

- Uniqueness checks
- Ownership validation
- Custom business logic validation

This separation ensures:

- Input structure validation is separate from business logic validation
- Business rules can be reused across different operations
- Clear error messages for different validation failures

## Directory Structure Reference

```
src/
├── transport/                      # HTTP transport layer (platform-independent)
│   ├── handlers/                   # HTTP request handlers
│   │   └── example/
│   │       └── tag.handler.js
│   ├── middleware/                 # HTTP middleware core logic
│   │   ├── header-validation.middleware.js
│   │   └── rate-limiting.middleware.js
│   └── error-mapping.js            # Maps domain errors to HTTP status codes
│
├── platforms/                      # Platform-specific implementations
│   ├── containers.js               # Shared infrastructure (knex, redis, logger, containers)
│   └── express/                    # Express platform
│       ├── adapters/               # Express-specific adapters
│       │   └── response.adapter.js
│       ├── middleware/             # Express-specific middleware wrappers
│       │   ├── auth.middleware.js
│       │   ├── error-handler.middleware.js
│       │   ├── header-validation.middleware.js
│       │   └── rate-limiting.middleware.js
│       ├── app.js                  # Express app setup
│       └── example/                  # Example domain Express routes
│           ├── routers/            # Express routers
│           └── example.app.js        # Domain integration
│
├── auth/                           # Auth module (GoTrue-based)
│   ├── domain/                     # User domain objects
│   ├── models/                     # User data models
│   ├── services/                   # Auth services (GoTrue integration)
│   ├── migrations/                 # Auth schema and tables
│   └── README.md
│
├── example/                          # Example module (tag management reference)
│   ├── actions/                    # Business logic
│   ├── models/                     # Data models with projections/relations
│   ├── repositories/               # Data access with knex-tools
│   ├── validators/                 # Schema and business rule validation
│   ├── migrations/                 # Example schema and tables
│   └── example.container.js        # Domain DI container
│
├── lib/                            # Shared utilities
│   ├── database/                   # Database strategies and helpers
│   ├── logger/                     # Logging infrastructure
│   ├── storage/                    # File storage and object storage utilities
│   ├── errors.js                   # Error classes
│   ├── http-responses.js           # Domain response objects (CreatedResponse, OkResponse, etc.)
│   ├── date-tools.js               # Date utilities
│   └── param-tools.js              # Parameter parsing utilities
│
├── config/                         # Configuration
│   ├── knex.config.js
│   ├── redis-client.config.js
│   └── rate-limit.config.js
│
└── container.js                    # Common DI container
```

## Design Philosophy

1. **Domain-Driven** - Business logic organized by domain, not technical layer
2. **Layered Separation** - Clear separation between transport (HTTP) and platform (Express/Fastify)
3. **Explicit Dependencies** - Service dependencies (repositories, actions) injected through constructors; domain-specific files imported as modules
4. **Pragmatic** - Simple patterns, minimal abstraction, easy to understand
5. **Testable** - Clean separation enables isolated testing at each layer

## Deployment and Scaling Architecture

### Deployment Flexibility

The container architecture supports both monolithic and microservices deployment patterns without code changes.

```
Monolith Architecture:
┌───────────────────────────────┐
│        One Application        │
│  ┌─────┬──────┬────────┬────┐ │
│  │Tasks│Users │Orders  │Pay │ │
│  └─────┴──────┴────────┴────┘ │
└───────────────┬───────────────┘
                │
         ┌──────▼──────┐
         │  Database   │
         └─────────────┘

Microservices Architecture:
┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐
│ Tasks  │  │ Users  │  │Orders  │  │Payment │
│Service │  │Service │  │Service │  │Service │
└───┬────┘  └───┬────┘  └───┬────┘  └───┬────┘
    │           │            │            │
    └───────────┴────────────┴────────────┘
                      │
               ┌──────▼──────┐
               │  Database   │
               │  (Shared)   │
               └─────────────┘
```

**Monolith:** All containers in one app
**Microservices:** Deploy separately - each service imports only its domain container

### Horizontal Scaling

Scale different parts of your application independently based on actual usage patterns.

#### Scaling Strategies

```
Strategy 1: Scale entire application
┌─────────────────┐
│  Load Balancer  │
└────────┬────────┘
         │
    ┌────┴─────────────┐
    │                  │
┌───▼────┐        ┌────▼───┐
│ App    │        │ App    │
│Instance│        │Instance│
│1       │        │2       │
└───┬────┘        └────┬───┘
    │                  │
    └──────┬───────────┘
           │
    ┌──────▼──────┐
    │  Database   │
    │  (Shared)   │
    └─────────────┘

Strategy 2: Scale by transport
┌─────────────────┐
│  Load Balancer  │
└────────┬────────┘
         │
    ┌────┴──────────────────────┐
    │                           │
┌───▼────┐                 ┌────▼───┐
│ REST   │                 │GraphQL │
│Instance│                 │Instance│
│×3      │                 │×1      │
└───┬────┘                 └────┬───┘
    │                           │
    └──────────┬────────────────┘
               │
        ┌──────▼──────┐
        │  Database   │
        └─────────────┘

Strategy 3: Scale by domain (microservices)
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Tasks   │     │  Users   │     │ Orders   │
│ Service  │     │ Service  │     │ Service  │
│   ×3     │     │   ×2     │     │   ×5     │
└────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │
┌────▼──────────────────▼────────────────▼────┐
│              Shared Database                │
│         (or separate per service)           │
└─────────────────────────────────────────────┘
```

#### Benefits

- Scale hot paths independently
- Cost-effective resource allocation
- Domain-specific scaling strategies
- Gradual migration to microservices

## Key Architectural Patterns

**Transport vs Platform:**

- **Transport** (HTTP) - Protocol-level concerns, framework-independent
- **Platform** (Express) - Framework-specific implementations

**Example:** Header validation

- Core logic in `transport/middleware/` works with plain objects
- Express wrapper in `platforms/express/middleware/` adapts Express req/res
- Future: Fastify wrapper would adapt Fastify req/reply

This separation enables adding new HTTP frameworks without rewriting business logic.
