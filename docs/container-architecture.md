# Container Architecture

## Overview

This project uses **Dependency Injection (DI)** containers to manage dependencies across the application. All dependencies are explicitly injected through constructors, making the architecture testable, maintainable, and loosely coupled.

## Container Hierarchy

The architecture uses a three-tier container system:

1. **Infrastructure Container** (`src/platforms/containers.js`) - Creates and manages shared infrastructure instances
2. **Common Container** (`src/container.js`) - Manages cross-cutting concerns and middleware
3. **Domain Containers** (`src/{domain}/{domain}.container.js`) - Manage domain-specific dependencies

## Infrastructure Container

The infrastructure container (`src/platforms/containers.js`) creates shared infrastructure instances, like logger, database, cache, file storage, etc.

These instances are created once and shared across the application.

## Common Container

The common container (`src/container.js`) manages:

- Shared infrastructure (knex, cache, logger)
- Middleware registration and retrieval
- Cross-cutting services (e.g., file storage service)

Domain containers receive the common container and can access shared infrastructure through it.

## Domain Containers

Each domain has its own container (e.g., `src/example/example.container.js`) that:

- Receives `commonContainer` through constructor (accesses shared infrastructure like `knexInstance` through it)
- Manages domain-specific repositories and actions
- Injects dependencies into business logic classes

See `src/example/example.container.js` for a complete example of a domain container implementation.

## Dependency Injection Flow

```
Infrastructure Container
  ↓ creates instances (knex, cache, logger)
  ↓ creates CommonContainer
  ↓ creates DomainContainers (with commonContainer)
  ↓ DomainContainers inject dependencies into Actions/Repositories
```

### Example: Injecting Dependencies

**Container** (`src/example/example.container.js`):

- Container receives `commonContainer` in constructor (accesses `knexInstance` via `commonContainer.knexInstance`)
- Container builds repositories and actions, injecting dependencies
- Uses Map caching to ensure singleton instances

**Action** (`src/example/actions/tag.actions.js`):

- Receives `tagRepository` through constructor
- All dependencies are explicit and visible

**Repository** (`src/example/repositories/tag.repository.js`):

- Receives `knexInstance` through constructor
- No hidden dependencies

## Benefits

- ✅ **Explicit dependencies** - All dependencies visible in constructor signatures
- ✅ **Testable** - Easy to mock dependencies for unit testing
- ✅ **Loosely coupled** - Business logic independent of infrastructure
- ✅ **Refactorable** - Easy to change dependencies without breaking code

## Testing

Mock dependencies by creating test containers with mock objects. Since all dependencies are injected through constructors, you can easily create instances with mock dependencies for isolated testing.

See `src/example/actions/tag.actions.js` and `src/example/repositories/tag.repository.js` for examples of classes that receive dependencies through constructors.

## Best Practices

1. **Inject all dependencies** - Pass dependencies through constructors, not module imports
2. **Use containers for wiring** - Containers manage dependency creation and injection
3. **Keep dependencies optional** - Infrastructure like logger can be optional parameters
4. **Singleton pattern** - Containers cache instances using Maps to ensure single instances
5. **Explicit contracts** - Constructor parameters define clear contracts

## Container Responsibilities

**Infrastructure Container** (`src/platforms/containers.js`):

- Create shared infrastructure instances
- Instantiate common and domain containers

**Common Container** (`src/container.js`):

- Manage middleware registration
- Provide shared services
- Hold shared infrastructure references

**Domain Containers** (`src/{domain}/{domain}.container.js`):

- Manage domain-specific repositories and actions
- Inject dependencies into business logic classes
- Cache instances for singleton behavior
