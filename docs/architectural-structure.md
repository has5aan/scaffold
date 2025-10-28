# Architectural Structure

## Overview

This project follows a **modular, domain-driven architecture** with a transport-independent core. The architecture is organized into self-contained modules (domains) that can operate independently while sharing common infrastructure through dependency injection containers.

## Core Principles

1. **Module-Based Organization** - Self-contained domains with clear boundaries
2. **Transport Independence** - Business logic is independent of HTTP, WebSocket, or any other protocol
3. **Dependency Injection** - Explicit dependencies managed through containers
4. **Layered Architecture** - Clear separation between transport, business logic, and data access
5. **Model-Driven Queries** - Flexible data access using knex-tools with projections and relations

## Module-Based Architecture

The codebase is organized into self-contained modules within `src/`, each representing a distinct business capability:

- **`src/auth/`** - Authentication and authorization using GoTrue (Supabase Auth)
- **`src/example/`** - Bookmark management with tags and bookmarks

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
│   ├── schema/       # Joi schemas for input validation
│   └── rules/        # Business rule validation
├── migrations/       # Database schema definitions
├── {module}.container.js  # Domain-specific dependency injection
└── README.md
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

The architecture achieves transport independence by separating business logic from protocol-specific concerns.

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

```javascript
router.post('/', async (req, res) => {
  const response = await tagHandler.create(req, req.user)
  adaptExpressJsonResponse(response, res) // Converts domain response to Express JSON
})
```

**2. Handler** (`src/transport/handlers/example/tag.handler.js`)

- HTTP-dependent, platform-independent
- Orchestrates business logic
- Returns domain response objects (CreatedResponse, OkResponse, etc.)

```javascript
TagHandler.prototype.create = async function (req, user) {
  const tag = await this.tagActions.create({
    userId: user.id,
    tag: { name: req.body.name, ... }
  })
  return new CreatedResponse({ data: tag })
}
```

**3. Actions** (`src/example/actions/tag.actions.js`)

- Pure business logic
- Input validation and business rule enforcement
- Coordinates repository operations

```javascript
TagActions.prototype.create = async function ({ userId, tag }) {
  // Input validation
  const { error } = schema.create.validate({ ...tag, user_id: userId })
  if (error) throw new ValidationError(error.message)

  // Business rules
  await tagRules.tagForUserMustBeUnique(
    { tagRepository: this.tagRepository },
    { userId, name: tag.name }
  )

  // Data operation
  const id = await this.tagRepository.create({
    tag: { ...tag, user_id: userId }
  })
  return await this.tagRepository.find({
    options: { projection, where: { id } }
  })
}
```

**4. Repository** (`src/example/repositories/tag.repository.js`)

- Data access abstraction
- Uses knex-tools for model-driven queries

```javascript
TagRepository.prototype.find = async function ({ options }) {
  return await buildQuery(this.knexInstance, tagModel, options)
}
```

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

```javascript
const { authenticateToken } = require('../../../auth/services/auth.service')

function buildAuthMiddleware() {
  return async (req, _res, next) => {
    const bearerToken = req.headers.authorization?.replace('Bearer ', '')
    const user = await authenticateToken(bearerToken)
    req.user = user // Express-specific attachment
    next()
  }
}
```

**Express Header Validation** (`src/platforms/express/middleware/header-validation.middleware.js`):

```javascript
const {
  validatePlatformHeaders
} = require('../../../transport/middleware/header-validation.middleware')

function validatePlatformHeadersMiddleware(req, res, next) {
  const result = validatePlatformHeaders({
    platform: req.get('X-Platform'), // Express API
    installId: req.get('X-Install-ID'),
    userAgent: req.get('User-Agent')
  })

  if (!result.valid) {
    res.status(result.statusCode).json({ error: result.error }) // Express JSON response
    return
  }
  next()
}
```

**Express JSON Error Handler** (`src/platforms/express/middleware/error-handler.middleware.js`):

```javascript
const { mapErrorToHttp } = require('../../../transport/error-mapping')

function buildJsonErrorHandlerMiddleware(logger) {
  return (err, req, res, next) => {
    logger.error({ err, url: req.originalUrl, method: req.method })

    if (res.headersSent) {
      return next(err)
    }

    const { statusCode, message } = mapErrorToHttp(err)
    res.status(statusCode).json({ error: message }) // Express JSON response
  }
}
```

The naming `buildJsonErrorHandlerMiddleware` makes it clear this is JSON-specific, allowing for future HTML or XML error handlers in the same file.

### Platform Adapters

Platform-specific adapters convert domain response objects to framework-specific responses.

**Express JSON Response Adapter** (`src/platforms/express/adapters/response.adapter.js`):

```javascript
function adaptExpressJsonResponse(response, res) {
  if (response.data !== null) {
    return res.status(response.statusCode).json(response.data)
  }
  return res.status(response.statusCode).send()
}
```

This adapter is Express-specific because it uses Express's API (`res.status()`, `res.json()`, `res.send()`). The name clearly indicates it's JSON-specific. Future platforms like Fastify would have their own adapters using their respective APIs.

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

```javascript
const tagModel = {
  tableName: 'example.tag',
  primaryKey: 'id',

  projections: {
    default: (_, alias) => [`${alias}.id`, `${alias}.name`, ...],
    summary: (_, alias) => [`${alias}.id`, `${alias}.name`],
    minimal: (_, alias) => [`${alias}.id`, `${alias}.name`]
  },

  relations: {
    user: {
      type: 'belongsTo',
      table: 'auth.users',
      foreignKey: 'user_id',
      modelDefinition: () => require('../../auth/models/user.model')
    },
    bookmarks: {
      type: 'manyToMany',
      table: 'bookmark',
      through: { table: 'bookmark_tag', foreignKey: 'tag_id', otherKey: 'bookmark_id' }
    }
  },

  modifiers: {
    forUser: (query, alias, { userId }) => query.where(`${alias}.user_id`, userId)
  }
}
```

### Query Building

knex-tools `buildQuery` function constructs queries from models and options:

```javascript
// In repository
TagRepository.prototype.find = async function ({ options }) {
  return await buildQuery(this.knexInstance, tagModel, options)
}

// In actions
await this.tagRepository.find({
  options: {
    projection: 'summary', // Which columns to select
    where: { user_id: userId }, // Filter conditions
    paging: { limit: 10, offset: 0 }, // Pagination
    sorting: { field: 'name', order: 'asc' } // Ordering
  }
})
```

**Benefits:**

- Declarative query building
- Reusable projections and relations
- Type-safe column selection
- Consistent query patterns across repositories

## Container Architecture

The project uses **dependency injection containers** to manage dependencies.

### Infrastructure Container (`src/platforms/containers.js`)

Manages shared infrastructure instances:

```javascript
const knexInstance = knex(knexConfig[process.env.NODE_ENV])
const cacheClient = createClient({ ... })
const logger = createLogger('app', knexConfig.logger)

const commonContainer = new CommonContainer({ knexInstance, cacheClient })
const exampleContainer = new ExampleContainer({ knexInstance, commonContainer })

module.exports = { knexInstance, cacheClient, logger, commonContainer, exampleContainer }
```

### Common Container (`src/container.js`)

Manages shared middleware and cross-cutting services:

```javascript
function DI({ knexInstance, cacheClient }) {
  this.middlewares = new Map()
}

DI.prototype.setMiddleware = function (name, middleware) {
  this.middlewares.set(name, middleware)
}

DI.prototype.getMiddleware = function (name) {
  return this.middlewares.get(name)
}
```

### Domain Container (`src/example/example.container.js`)

Each domain has its own container for isolated dependency management:

```javascript
function DI({ knexInstance, commonContainer }) {
  this.knexInstance = knexInstance
  this.repositories = new Map()
  this.actions = new Map()
}

DI.prototype.buildTagRepository = function () {
  if (!this.repositories.has('tag')) {
    this.repositories.set(
      'tag',
      new TagRepository({ knexInstance: this.knexInstance })
    )
  }
  return this.repositories.get('tag')
}

DI.prototype.buildTagActions = function () {
  if (!this.actions.has('tag')) {
    this.actions.set(
      'tag',
      new TagActions({ tagRepository: this.buildTagRepository() })
    )
  }
  return this.actions.get('tag')
}
```

### Wiring It All Together

**Express App** (`src/platforms/express/app.js`):

```javascript
const { commonContainer, exampleContainer } = require('../containers')
const { buildAuthMiddleware } = require('./middleware/auth.middleware')

// Register middleware
commonContainer.setMiddleware(Middlewares.auth, buildAuthMiddleware())

// Mount domain routes
exampleApp({
  expressInstance: app,
  commonContainer,
  container: exampleContainer
})
```

**Domain Integration** (`src/platforms/express/example/example.app.js`):

```javascript
module.exports = ({ expressInstance, commonContainer, container }) => {
  // Build handler from domain container
  const tagHandler = new TagHandler({ tagActions: container.buildTagActions() })
  const router = tagRouter({ tagHandler })

  // Apply middleware and mount routes
  expressInstance.use(
    '/api/example/tags',
    commonContainer.getMiddleware(Middlewares.auth)
  )
  expressInstance.use('/api/example/tags', router)
}
```

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

**Run all domains (in order):**

```bash
npm run migrate              # Runs auth → example
```

**Per-domain control:**

```bash
npm run migrate:auth         # Only auth domain
npm run migrate:example      # Only example domain
node scripts/migrate.js auth example  # Multiple domains in custom order
```

**Individual file control:**

```bash
node scripts/migrate.js up example-05-category.js    # Apply specific file
node scripts/migrate.js down example-05-category.js  # Rollback specific file
```

**Check status:**

```bash
npm run migrate:status       # All domains
npm run migrate:status example  # Specific domain
```

**Rollback migrations:**

```bash
npm run migrate:rollback            # Rollback last batch (all domains)
npm run migrate:rollback example    # Rollback last batch (example domain)
node scripts/migrate.js down example-05-category.js  # Rollback specific file
```

**Create new migration:**

```bash
npm run migrate:create auth role
npm run migrate:create example category
```

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
  ├── example-01-schema.js      # Creates example schema
  ├── example-02-tag.js         # Creates tag table (can FK to auth.users)
  ├── example-03-bookmark.js    # Creates bookmark table
  └── example-04-bookmark-tag.js # Junction table
```

**Domain Migrations Execution Order:**

When running `npm run migrate`, domains execute in this order:

1. **auth** - Foundational (run first)
2. **example** - Depends on auth.users (run after auth)

You can override this order: `node scripts/migrate.js example auth`

**Why this naming:**

- ✅ **Domain-first grouping** - All auth migrations are grouped together alphabetically
- ✅ **Readable filenames** - `example-02-tag.js` is clearer than `02-02-tag.js`
- ✅ **Clear ownership** - Domain name is front and center
- ✅ **Explicit ordering** - Execution order visible in filename

Each domain maintains its own schema and tables:

- **Auth**: `auth.users`
- **Example**: `example.tag`, `example.bookmark`, `example.bookmark_tag`

## Validation Strategy

The project uses **two-tier validation**:

### 1. Input Validation (Schema)

Validates request structure using Joi schemas (`src/example/validators/schema/tag.schema.js`).

### 2. Business Rules Validation

Enforces domain-specific business rules (`src/example/validators/rules/tag.rules.js`):

```javascript
tagRules.tagForUserMustBeUnique({ tagRepository }, { userId, name })
tagRules.userMustOwnTheTag({ tagRepository }, { id, userId })
```

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
├── example/                          # Example module (bookmarks and tags)
│   ├── actions/                    # Business logic
│   ├── models/                     # Data models with projections/relations
│   ├── repositories/               # Data access with knex-tools
│   ├── validators/                 # Schema and business rule validation
│   ├── migrations/                 # Example schema and tables
│   ├── example.container.js          # Domain DI container
│   └── README.md
│
├── lib/                            # Shared utilities
│   ├── database/                   # Database strategies and helpers
│   ├── logger/                     # Logging infrastructure
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
3. **Explicit Dependencies** - All dependencies injected, no hidden globals for domain obejcts within domain layer
4. **Pragmatic** - Simple patterns, minimal abstraction, easy to understand
5. **Testable** - Clean separation enables isolated testing at each layer

## Key Architectural Patterns

**Transport vs Platform:**

- **Transport** (HTTP) - Protocol-level concerns, framework-independent
- **Platform** (Express) - Framework-specific implementations

**Example:** Header validation

- Core logic in `transport/middleware/` works with plain objects
- Express wrapper in `platforms/express/middleware/` adapts Express req/res
- Future: Fastify wrapper would adapt Fastify req/reply

This separation enables adding new HTTP frameworks without rewriting business logic.

---

_Last updated: 2025-10-28_
