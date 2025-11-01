# Container Architecture Patterns

## Overview

This document details the hybrid container architecture used in the project, which combines **Dependency Injection** for business logic with **Service Locator** patterns for cross-cutting concerns like logging, monitoring, and caching.

## The Hybrid Approach

### Why Hybrid?

The project uses two complementary patterns because they serve different purposes:

- **Dependency Injection**: For business logic dependencies (repositories, services)
- **Service Locator**: For infrastructure access (logging, caching, monitoring)

This hybrid approach balances **architectural purity** with **developer productivity**.

## Pattern 1: Dependency Injection for Business Logic

### Implementation

```javascript
// Business logic with explicit dependencies
class TagActions {
  constructor({ tagRepository }) {
    this.tagRepository = tagRepository
  }
}

// Container manages the wiring (in src/pancake/pancake.container.js)
class DI {
  buildTagActions() {
    return new TagActions({
      tagRepository: this.buildTagRepository()
    })
  }
}

// Handlers are created in domain integration files (src/platforms/express/pancake/pancake.app.js)
module.exports = ({ expressInstance, commonContainer, container }) => {
  // Handler created here, not in routers
  const tagHandler = new TagHandler({ tagActions: container.buildTagActions() })

  // Router receives handler as parameter
  const router = tagRouter({ tagHandler })

  expressInstance.use('/api/pancake/tags', router)
}
```

### Benefits

- ✅ **Explicit dependencies** - clear what each component needs
- ✅ **Testable** - easy to mock dependencies
- ✅ **Loose coupling** - business logic independent of infrastructure
- ✅ **Refactorable** - easy to change dependencies

### Testing

```javascript
// Easy to mock business dependencies
const mockRepository = {
  create: jest.fn().mockResolvedValue({ id: 1, name: 'test' })
}
const tagActions = new TagActions({ tagRepository: mockRepository })

// Test business logic in isolation
const result = await tagActions.create({ userId: 1, tag: { name: 'test' } })
expect(mockRepository.create).toHaveBeenCalledWith({...})
```

## Pattern 2: Service Locator for Cross-Cutting Concerns

### Implementation

```javascript
// In actions/repositories for cross-cutting concerns
const { logger, cacheClient } = require('../platforms/containers')

class TagActions {
  async create({ userId, tag }) {
    // Developer experience: Easy logging
    logger.info('Tag creation started', { userId, tagName: tag.name })

    // Business logic with clean DI
    const result = await this.tagRepository.create({...})

    // Performance monitoring
    await cacheClient.set(`user:${userId}:recent-activity`, 'tag-created')

    return result
  }
}
```

### Benefits

- ✅ **Developer productivity** - easy to add logging/monitoring anywhere
- ✅ **Consistent infrastructure** - same logger/cache across all layers
- ✅ **Minimal boilerplate** - no need to thread infrastructure through every layer
- ✅ **Module caching** - shared instances naturally via Node.js module system

### Testing

```javascript
// Mock the containers module
jest.mock('../platforms/containers', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn()
  },
  cacheClient: {
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null)
  }
}))

// Test that logging and caching work
const { logger, cacheClient } = require('../platforms/containers')
await tagActions.create({ userId: 1, tag: { name: 'test' } })
expect(logger.info).toHaveBeenCalledWith(
  'Tag creation started',
  expect.any(Object)
)
expect(cacheClient.set).toHaveBeenCalledWith(
  'user:1:recent-activity',
  'tag-created'
)
```

## Module Caching: The Secret Sauce

### How It Works

```javascript
// src/platforms/containers.js - Infrastructure instances created once
const cacheClient = createClient({...})  // Redis instance
const knexInstance = knex(knexConfig)     // Database instance
const logger = createLogger('app')        // Logger instance

// Create containers
const commonContainer = new CommonContainer({ knexInstance, cacheClient })
const pancakeContainer = new PancakeContainer({ knexInstance, commonContainer })

// Exported and shared across all layers via module caching
module.exports = { cacheClient, knexInstance, logger, commonContainer, pancakeContainer }
```

**Node.js module caching ensures:**

- ✅ **Same instances** - module caching ensures singleton behavior
- ✅ **Cross-layer access** - lower layers access same infrastructure as app
- ✅ **Consistent state** - shared connections and configuration
- ✅ **No wiring needed** - direct access to infrastructure

### No Circular Dependencies

**Why it's safe to import `containers.js` from handlers/actions/repositories:**

```
Dependency Chain:
  platforms/containers.js (loads first)
    ↓ creates instances (knex, redis, logger)
    ↓ creates commonContainer
    ↓ creates pancakeContainer = new PancakeContainer({ knexInstance, commonContainer })
    ↓ exports everything

  pancake/pancake.container.js (class definition)
    ↓ defines buildTagActions() method
    ↓ does NOT import containers.js

  pancake/actions/tag.actions.js
    ↓ CAN import containers.js for logger/cache
    const { logger } = require('../platforms/containers')
```

**Why no circular dependency?**

1. **`containers.js` is evaluated first** - All instances created before anything else runs
2. **Domain containers are just class definitions** - They don't import `containers.js`
3. **Actions import at runtime** - When methods are called, `containers.js` is already fully loaded
4. **Module caching ensures singleton** - Multiple imports get the same instance

### Safe Import Guidelines

✅ **Safe to import `containers.js` from:**

- Handlers (`src/transport/handlers/`)
- Actions (`src/*/actions/`)
- Repositories (`src/*/repositories/`)
- Validators (`src/*/validators/`)
- Services (`src/*/services/`)

❌ **Do NOT import `containers.js` from:**

- Container class definitions (`src/*/container.js`)
- The `containers.js` file itself

**Example - Safe Usage:**

```javascript
// ✅ SAFE - In src/pancake/actions/tag.actions.js
const { logger, cacheClient } = require('../platforms/containers')

class TagActions {
  async create({ userId, tag }) {
    logger.info('Creating tag', { userId })  // Safe!
    const result = await this.tagRepository.create({...})
    await cacheClient.set(`user:${userId}:tags`, data)
    return result
  }
}
```

**Example - Avoid:**

```javascript
// ❌ AVOID - In src/pancake/pancake.container.js
const { logger } = require('../platforms/containers') // Don't do this!

class DI {
  constructor({ knexInstance, commonContainer }) {
    this.knexInstance = knexInstance
    // Container definition should not import containers.js
  }
}
```

### Real-World Example

```javascript
// In src/pancake/actions/tag.actions.js
const { logger, cacheClient } = require('../platforms/containers')

// In src/pancake/repositories/tag.repository.js
const { logger } = require('../platforms/containers')

// In src/platforms/express/middleware/auth.middleware.js
const { logger } = require('../containers')

// All get the SAME logger instance due to module caching!
```

## Architecture Trade-offs

### Service Locator vs Dependency Injection

| Aspect                    | Service Locator      | Dependency Injection |
| ------------------------- | -------------------- | -------------------- |
| **Testability**           | ✅ Mockable          | ✅ Mockable          |
| **Explicit Dependencies** | ❌ Hidden            | ✅ Explicit          |
| **Boilerplate**           | ✅ Minimal           | ❌ Verbose           |
| **Coupling**              | ❌ Container-coupled | ✅ Loosely coupled   |
| **Refactoring**           | ❌ Harder            | ✅ Easier            |
| **Developer Experience**  | ✅ Excellent         | ❌ More verbose      |

### When to Use Each Pattern

**Use Dependency Injection for:**

- Business logic dependencies (repositories, services)
- Core domain logic
- Components that need explicit contracts
- Anything that affects business logic

**Use Service Locator for:**

- Cross-cutting concerns (logging, monitoring, caching)
- Infrastructure access
- Developer experience improvements
- Performance optimizations
- Observability and debugging

## Real-World Benefits

### 1. Clean Business Logic

```javascript
// Business logic remains pure and testable
class TagActions {
  constructor({ tagRepository }) {
    this.tagRepository = tagRepository
  }

  async create({ userId, tag }) {
    // Pure business logic - no infrastructure concerns
    return await this.tagRepository.create({ userId, ...tag })
  }
}
```

### 2. Enhanced Developer Experience

```javascript
// Easy to add logging anywhere (from actions/repositories)
const { logger } = require('../platforms/containers')
logger.info('User action', { userId, action: 'create-tag' })

// Easy to add caching
const { cacheClient } = require('../platforms/containers')
await cacheClient.set(`user:${userId}:tags`, JSON.stringify(tags))
```

### 3. Consistent Observability

```javascript
// Same logger instance across all layers
// In actions
logger.info('Business event', { event: 'tag-created' })

// In repositories
logger.info('Database operation', { operation: 'insert' })

// In middleware
logger.info('Request processed', { userId, endpoint: '/api/tags' })
```

## Implementation Guidelines

### Best Practices

1. **Use DI for business dependencies** - repositories, services, domain logic
2. **Use service locator for infrastructure** - logging, caching, monitoring
3. **Document dependencies** - make it clear which layers access containers
4. **Keep it minimal** - only access what you truly need
5. **Test thoroughly** - ensure mocking works for both patterns

### Anti-Patterns to Avoid

❌ **Don't use service locator for business logic:**

```javascript
// BAD - business logic should use DI
const { tagRepository } = require('../platforms/containers')
class TagActions {
  constructor() {
    this.tagRepository = tagRepository // Hidden dependency
  }
}
```

❌ **Don't thread infrastructure through DI:**

```javascript
// BAD - too much boilerplate for cross-cutting concerns
class TagActions {
  constructor({ tagRepository, logger, cacheClient, metricsClient }) {
    // Too many parameters for infrastructure
  }
}
```

✅ **Do use the hybrid approach:**

```javascript
// GOOD - business logic with DI, infrastructure with service locator
class TagActions {
  constructor({ tagRepository }) {
    this.tagRepository = tagRepository
  }

  async create({ userId, tag }) {
    const { logger, cacheClient } = require('../platforms/containers')

    logger.info('Creating tag', { userId })
    const result = await this.tagRepository.create({...})
    await cacheClient.set(`user:${userId}:tags`, data)
    return result
  }
}
```

## Common Use Cases

### Logging Business Events

```javascript
// In actions/repositories
const { logger } = require('../platforms/containers')

// Log business events with context
logger.info('User created tag', {
  userId,
  tagName: tag.name,
  timestamp: new Date().toISOString()
})
```

### Performance Monitoring

```javascript
// In actions/repositories
const { logger } = require('../platforms/containers')

const startTime = Date.now()
const result = await this.tagRepository.create({...})
const duration = Date.now() - startTime

logger.info('Tag creation performance', {
  duration,
  operation: 'create-tag',
  userId
})
```

### Caching for Performance

```javascript
// In actions/repositories
const { cacheClient } = require('../platforms/containers')

// Cache user's tag count
await cacheClient.set(`user:${userId}:tag-count`, count)

// Cache recent activity
await cacheClient.set(`user:${userId}:recent-activity`, 'tag-created')
```

### Metrics Collection

```javascript
// In actions/repositories
const { cacheClient } = require('../platforms/containers')

// Increment counters
await cacheClient.incr('metrics:tags:created')
await cacheClient.incr('metrics:users:active')
```

## Testing Strategy

### Mocking Service Locator

```javascript
// Mock the entire containers module
jest.mock('../platforms/containers', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  },
  cacheClient: {
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null),
    incr: jest.fn().mockResolvedValue(1)
  },
  knexInstance: mockKnex
}))
```

### Mocking Dependency Injection

```javascript
// Mock business dependencies
const mockRepository = {
  create: jest.fn().mockResolvedValue({ id: 1, name: 'test' }),
  find: jest.fn().mockResolvedValue([])
}

const tagActions = new TagActions({ tagRepository: mockRepository })
```

### Integration Testing

```javascript
// Test both patterns together
describe('TagActions Integration', () => {
  beforeEach(() => {
    // Mock containers
    jest.mock('../platforms/containers', () => ({
      logger: mockLogger,
      cacheClient: mockCache
    }))
  })

  it('should create tag and log event', async () => {
    const result = await tagActions.create({ userId: 1, tag: { name: 'test' } })

    expect(mockRepository.create).toHaveBeenCalled()
    expect(mockLogger.info).toHaveBeenCalledWith('Creating tag', { userId: 1 })
    expect(mockCache.set).toHaveBeenCalled()
  })
})
```

## Conclusion

The hybrid container architecture provides:

1. **Clean Business Logic** - DI keeps business logic pure and testable
2. **Enhanced Developer Experience** - Service locator makes logging/monitoring trivial
3. **Consistent Observability** - Same infrastructure across all layers
4. **Practical Maintainability** - Balance between purity and productivity
5. **Scalable Architecture** - Easy to add new cross-cutting concerns

This approach balances **architectural purity** with **developer productivity**, making it both maintainable and practical for real-world development.

---

_Last updated: 2025-10-27_
