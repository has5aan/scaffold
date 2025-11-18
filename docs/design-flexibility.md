# Design Flexibility

This document explains the architectural flexibility of the scaffold template and demonstrates how you can adapt, extend, or replace components without rewriting your business logic.

## Core Principle

The architecture achieves flexibility through **Transport Independence** - your business logic (models, repositories, actions) is completely decoupled from how clients interact with it (REST, GraphQL, WebSockets, etc.).

```
Business Logic (Domain Layer)
    ↓
Domain Container (Dependency Injection)
    ↓
    ├─ REST (Express)
    ├─ GraphQL (Apollo)
    ├─ gRPC
    ├─ WebSockets
    ├─ Message Queue
    ├─ CLI
    ├─ Cron Jobs
    └─ Lambda Functions
```

**One codebase, infinite possibilities.**

---

## 1. Transport Layer Flexibility

Add any transport layer without touching business logic. All transports use the same domain container.

### Example: Multiple Transports

The same domain container can be used with:

- REST (Express) - HTTP endpoints
- GraphQL (Apollo) - GraphQL API
- Fastify - Alternative HTTP framework
- WebSockets - Real-time communication
- gRPC - RPC protocol
- CLI - Command-line interface
- Message Queue - Asynchronous processing

**All use the same actions, repositories, and models.**

### Benefits

- Add new transport layers in minutes
- No duplication of business logic
- Test once, deploy everywhere
- Migrate between transports without refactoring

---

## 2. Database Flexibility

Swap databases by changing the knex connection configuration. Models use `getTableName()` helper to handle database-specific table naming.

### Example: Different Databases

Supported databases:

- **PostgreSQL** - Uses schemas (e.g., `auth.users`, `example.tag`)
- **SQLite** - Uses flat naming (e.g., `auth_users`, `example_tag`)
- **MySQL** - Uses database/table naming

### Table Naming Adaptation

Table naming adapts automatically through the `getTableName()` helper function. See `src/example/models/tag.model.js` for an example.

### Modifiers and Database-Specific Code

**Important:** While basic modifiers using standard Knex methods work across databases, modifiers that use database-specific SQL functions or features must be modified when switching databases.

For example:

- Standard Knex methods (`.where()`, `.orWhere()`) work across databases
- Database-specific functions (PostgreSQL `jsonb`, MySQL `JSON_EXTRACT`, SQLite `json()`) require modification
- Database-specific syntax (PostgreSQL arrays, MySQL `ON DUPLICATE KEY`) must be adapted

See `src/example/models/tag.model.js` for examples of modifiers using standard Knex methods (bookmark model exists but repository/actions are not yet implemented).

### Benefits

- Start with SQLite for development, PostgreSQL for production
- Switch databases with minimal code changes (table naming adapts automatically)
- Test against multiple databases
- Use database-specific features when needed (requires modifier updates)

---

## 3. Domain Isolation

Domains are completely independent, each with its own container. This enables microservices architecture without refactoring.

### Example: Multiple Domains

Each domain has its own container:

- TasksContainer
- UsersContainer
- OrdersContainer
- PaymentsContainer

**Monolith:** All containers in one app

**Microservices:** Deploy separately - each service imports only its domain container

### Deployment Flexibility

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

**Each domain can be extracted into a microservice without refactoring.**

### Benefits

- Start as monolith, split into microservices later
- Deploy domains independently
- Scale domains independently
- Team ownership per domain

---

## 4. Authentication Flexibility

Swap authentication providers easily. Actions only care about `userId`, not how it was authenticated.

### Example: Different Auth Providers

Supported authentication methods:

- **GoTrue (Supabase Auth)** - Current implementation
- **Auth0** - OAuth2 JWT bearer tokens
- **Firebase Auth** - Google Firebase authentication
- **JWT** - Generic JWT tokens
- **Custom** - Any custom authentication service
- **Passport.js** - Strategy-based authentication

### Handler Pattern

Handlers always receive `userId` as a string. The handler doesn't know or care which auth provider was used - it just receives the authenticated user ID.

**Actions and repositories don't care about authentication - they just receive `userId`.**

### Benefits

- Switch auth providers without changing business logic
- Use different auth per transport (REST vs GraphQL)
- Test without real authentication
- Support multiple auth methods simultaneously

---

## 5. Validation Flexibility

Swap validation libraries by only changing the `validators/schema` files.

### Example: Different Validation Libraries

Supported validation libraries:

- **Joi** - Current implementation
- **Zod** - TypeScript-first validation
- **Yup** - Schema-based validation
- **AJV** - JSON Schema validation

**Only change: `validators/schema/*.js` files. Actions and repositories unchanged.**

### Benefits

- Choose validation library based on preference
- Migrate between libraries without refactoring
- Use different validators for different domains
- TypeScript validation with Zod

---

## 6. Caching Flexibility

Add, remove, or swap caching layers at the repository level without changing actions.

### Example: Different Caching Strategies

Supported caching approaches:

- **No cache** - Baseline implementation
- **Redis** - Distributed caching
- **Memcached** - Memory caching
- **In-memory** - Node-cache for simple cases

**Actions don't know or care about caching.**

### Benefits

- Add caching without changing business logic
- Different cache strategies per domain
- Easy to disable caching for testing
- Cache at repository or action level

---

## 7. Testing Flexibility

Test at any layer with appropriate mocks. Each layer has a clear interface to mock.

### Example: Testing Different Layers

**Unit test:** Actions with mock repository - Test business logic in isolation

**Unit test:** Handlers with mock actions - Test HTTP layer without database

**Integration test:** Repository with real database - Test data access layer

**E2E test:** Full HTTP stack - Test complete request flow

### Benefits

- Test business logic without HTTP layer
- Test HTTP layer without database
- Fast unit tests, comprehensive integration tests
- Mock external dependencies easily

---

## 8. Query Builder Flexibility

Not locked into knex-tools. Replace the query builder without changing actions.

### Example: Different Query Builders

Supported query builders:

- **knex-tools** - Current implementation
- **Raw Knex** - Direct Knex queries
- **TypeORM** - TypeScript ORM
- **Prisma** - Next-generation ORM
- **Mongoose** - MongoDB ODM

**Only change: repository implementations. Actions unchanged.**

### Benefits

- Choose query builder based on needs
- Use ORM for complex relations
- Use raw SQL for performance
- Migrate between query builders incrementally

---

## 9. Error Handling Flexibility

Customize error handling per transport layer. Domain errors map to transport-specific formats.

### Example: Error Mapping

Domain errors (thrown by actions):

- ValidationError
- ActionError
- NotFoundError

These map to different formats per transport:

- **REST** - HTTP status codes and JSON error responses
- **GraphQL** - GraphQL error format with extensions
- **CLI** - Exit codes and console messages
- **WebSocket** - Custom error messages

**Same domain errors, different transport mappings.**

### Benefits

- Consistent error handling across transports
- Transport-specific error formats
- Easy to add new error types
- Centralized error definitions

---

## 10. Container Flexibility

Use any dependency injection pattern you prefer. The container pattern is not prescriptive.

### Example: Different DI Patterns

Supported DI approaches:

- **Custom container** - Current implementation
- **Awilix** - Popular DI library
- **InversifyJS** - TypeScript-first DI
- **TSyringe** - TypeScript decorators
- **Manual** - Simple manual wiring

**Choose the DI pattern that fits your team's preferences.**

### Benefits

- Not locked into specific DI library
- Use TypeScript decorators if desired
- Simple manual wiring for small projects
- Sophisticated containers for large projects

---

## 11. Horizontal Scaling

Scale different parts of your application independently.

### Example: Scaling Strategies

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
     │                │                 │
┌────▼──────────────────▼────────────────▼────┐
│              Shared Database                │
│         (or separate per service)           │
└─────────────────────────────────────────────┘
```

**Scale based on actual usage patterns.**

### Benefits

- Scale hot paths independently
- Cost-effective resource allocation
- Domain-specific scaling strategies
- Gradual migration to microservices

---

## 12. Middleware Flexibility

Swap middleware easily without changing handlers or actions.

### Example: Different Middleware

**Authentication middleware:**

- GoTrue (current)
- Auth0
- Firebase
- Generic JWT
- Passport.js

**Rate limiting:**

- Express rate limit
- Custom implementation
- Redis-based

**Logging:**

- Pino (current)
- Morgan
- Winston
- Custom

**Request validation:**

- Header validation
- Body validation
- Input sanitization

**CORS:**

- Simple CORS
- Configured CORS

**Compression:**

- gzip
- brotli

**Handlers and actions remain unchanged.**

### Benefits

- Middleware is transport-specific
- Mix and match as needed
- Easy to add/remove middleware
- Different middleware per environment

---

## 13. Platform Flexibility

Deploy anywhere Node.js runs. The architecture is platform-agnostic.

### Example: Different Deployment Targets

Supported deployment platforms:

- **Traditional Node.js server** - Standard server deployment
- **AWS Lambda** - Serverless functions
- **Docker container** - Containerized deployment
- **Kubernetes** - Container orchestration
- **Cloudflare Workers** - Edge computing
- **Vercel/Netlify Functions** - Serverless functions
- **Deno** - Deno runtime
- **Bun** - Bun runtime

**Same business logic, different runtimes.**

### Benefits

- Deploy to any cloud provider
- Use serverless or traditional hosting
- Mix deployment strategies per domain
- Test locally, deploy anywhere

---

## 14. Adding a New Transport in 10 Minutes

Want to add a **message queue consumer**? Here's how fast it is:

### Step 1: Create Consumer (5 minutes)

Create a consumer file that connects to your message queue, consumes messages, and calls actions from the domain container. The consumer extracts action, userId, and data from messages, then calls the appropriate action method (create, update, delete) from the domain container.

### Step 2: Start Consumer (1 minute)

Add a script to package.json to run the consumer, then start it.

### Step 3: Publish Messages (4 minutes)

Publish messages to the queue from anywhere in your app. Messages should include action type, userId, and data payload.

**Done!** Total time: ~10 minutes.

### What Changed?

- ❌ Models - No changes
- ❌ Repositories - No changes
- ❌ Actions - No changes
- ❌ Validation - No changes
- ❌ Business rules - No changes
- ✅ New transport - Added message queue consumer

**One domain, now accessible via:**

- REST API
- GraphQL API
- Message Queue

---

## Real-World Scenarios

### Scenario 1: Start Simple, Scale Later

**Phase 1: MVP (Month 1)**

- SQLite database
- Express REST API
- Monolith deployment
- Single server

**Phase 2: Growth (Month 6)**

- PostgreSQL database (change knex config)
- Add GraphQL (add Apollo Server)
- Docker deployment
- Load balancer + 3 instances

**Phase 3: Scale (Year 1)**

- Separate task processing to message queue
- Extract payment domain to microservice
- Redis caching on hot paths
- Kubernetes deployment

**Code changes: Minimal. Architecture supports all phases.**

### Scenario 2: Multi-Platform Product

**Same Business Logic For:**

- Web app (REST API)
- Mobile app (GraphQL API)
- Desktop app (WebSocket API)
- CLI tool (Direct action calls)
- Background jobs (Message queue)
- Scheduled tasks (Cron jobs)

**Benefit: Write once, deploy everywhere.**

### Scenario 3: Team Growth

**Small Team (1-3 developers)**

- Monolith
- All domains in one repo
- Simple deployment

**Medium Team (4-10 developers)**

- Domain ownership
- Independent releases per domain
- Shared database, separate services

**Large Team (10+ developers)**

- Microservices
- Separate repos per domain
- Independent databases
- Event-driven communication

**Architecture supports all team sizes.**

---

## The Magic Formula

```
Business Logic (Domain Layer)
    ↓
Domain Container (Dependency Injection)
    ↓
    ├─ REST (Express, Fastify, Koa)
    ├─ GraphQL (Apollo, express-graphql)
    ├─ gRPC (Protocol Buffers)
    ├─ WebSockets (Socket.io, WS)
    ├─ Message Queue (RabbitMQ, SQS, Kafka)
    ├─ CLI (Commander, Yargs)
    ├─ Cron Jobs (node-cron, BullMQ)
    ├─ Lambda Functions (AWS, Azure, GCP)
    └─ Any future transport you need
```

**One codebase, infinite possibilities.**

---

## Key Takeaways

1. **Transport Independence**: Business logic is completely decoupled from how clients interact with it

2. **Domain Isolation**: Each domain is self-contained and can be deployed independently

3. **Dependency Injection**: Container pattern makes it easy to swap implementations

4. **Clear Boundaries**: Models → Repositories → Actions → Handlers → Routes

5. **Test at Any Layer**: Each layer has a clear interface to mock

6. **Start Simple, Scale Smart**: Architecture supports growth without refactoring

7. **Team Flexibility**: Works for solo developers and large teams

8. **Platform Agnostic**: Deploy anywhere Node.js runs

9. **Future-Proof**: Easy to add new features, transports, and technologies

10. **Pragmatic**: Not dogmatic - use what works for your needs

---

## Summary

This architecture achieves maximum flexibility with minimum coupling. You can:

- **Swap** databases, auth providers, validation libraries, query builders
- **Add** new transport layers, caching strategies, deployment targets
- **Scale** horizontally, vertically, or by domain
- **Test** at any layer with appropriate mocks
- **Deploy** as monolith or microservices
- **Grow** from MVP to enterprise without refactoring

The secret? **Separation of concerns** and **dependency injection**. Your business logic lives in the domain layer, completely independent of infrastructure concerns.

This gives you the freedom to evolve your application as requirements change, without rewriting your core business logic.

---

_Last updated: 2025-11-18_
