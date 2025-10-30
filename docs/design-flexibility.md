# Design Flexibility

This document explains the architectural flexibility of the scaffold template and demonstrates how you can adapt, extend, or replace components without rewriting your business logic.

## Core Principle

The architecture achieves flexibility through **transport independence** - your business logic (models, repositories, actions) is completely decoupled from how clients interact with it (REST, GraphQL, WebSockets, etc.).

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

```javascript
// Same tasksContainer, different transports:

// REST (Express)
app.use('/api/tasks', taskRouter({ tasksContainer }))

// GraphQL (Apollo)
app.use('/graphql', graphqlMiddleware({ tasksContainer }))

// Fastify
fastify.register(taskRoutes, { tasksContainer })

// WebSockets
io.on('connection', socket => {
  socket.on('task:create', async data => {
    const taskActions = tasksContainer.buildTaskActions()
    const task = await taskActions.create({ userId, task: data })
    socket.emit('task:created', task)
  })
})

// gRPC
async function CreateTask(call, callback) {
  const taskActions = tasksContainer.buildTaskActions()
  const task = await taskActions.create({ userId, task: call.request })
  callback(null, task)
}

// CLI
const taskActions = tasksContainer.buildTaskActions()
const tasks = await taskActions.list({ userId: process.env.USER_ID })
console.table(tasks.data)

// Message Queue Consumer
channel.consume('task-queue', async msg => {
  const { userId, task } = JSON.parse(msg.content.toString())
  const taskActions = tasksContainer.buildTaskActions()
  await taskActions.create({ userId, task })
  channel.ack(msg)
})
```

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

```javascript
// PostgreSQL (schemas: auth.users, example.tag)
const db = knex({
  client: 'pg',
  connection: {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'password',
    database: 'myapp'
  }
})

// SQLite (flat: auth_users, example_tag)
const db = knex({
  client: 'sqlite3',
  connection: {
    filename: './database.sqlite'
  },
  useNullAsDefault: true
})

// MySQL
const db = knex({
  client: 'mysql2',
  connection: {
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'myapp'
  }
})
```

### How Models Handle This

```javascript
const { getTableName } = require('../../lib/database/migration-helpers')

const taskModel = {
  // PostgreSQL: 'tasks.task'
  // SQLite: 'tasks_task'
  tableName: getTableName('tasks', 'task', {
    dbType: process.env.DB_TYPE || 'pg'
  })
  // ... rest of model
}
```

**Same models, repositories, and actions work with all databases.**

### Benefits

- Start with SQLite for development, PostgreSQL for production
- Switch databases without code changes
- Test against multiple databases
- Use database-specific features when needed

---

## 3. Domain Isolation

Domains are completely independent, each with its own container. This enables microservices architecture without refactoring.

### Example: Multiple Domains

```javascript
// Each domain has its own container
const tasksContainer = new TasksContainer({ knexInstance, commonContainer })
const usersContainer = new UsersContainer({ knexInstance, commonContainer })
const ordersContainer = new OrdersContainer({ knexInstance, commonContainer })
const paymentsContainer = new PaymentsContainer({
  knexInstance,
  commonContainer
})

// Monolith: All containers in one app
module.exports = {
  tasksContainer,
  usersContainer,
  ordersContainer,
  paymentsContainer
}

// Microservices: Deploy separately
// tasks-service.js → Only imports tasksContainer
// users-service.js → Only imports usersContainer
// orders-service.js → Only imports ordersContainer
// payments-service.js → Only imports paymentsContainer
```

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

```javascript
// GoTrue (Supabase Auth - current)
const { authenticateToken } = require('../auth/services/auth.service')
const user = await authenticateToken(bearerToken)

// Auth0
const { auth } = require('express-oauth2-jwt-bearer')
app.use(
  auth({
    /* config */
  })
)
// req.auth.sub contains userId

// Firebase Auth
const admin = require('firebase-admin')
const decodedToken = await admin.auth().verifyIdToken(bearerToken)
const user = { id: decodedToken.uid }

// JWT
const jwt = require('jsonwebtoken')
const decoded = jwt.verify(bearerToken, process.env.JWT_SECRET)
const user = { id: decoded.userId }

// Custom
const user = await customAuthService.verify(bearerToken)

// Passport.js
app.use(passport.authenticate('jwt', { session: false }))
// req.user contains authenticated user
```

### Handler Pattern

```javascript
// Handlers always receive userId as a string
TaskHandler.prototype.create = async function (req, userId) {
  // userId comes from authentication middleware
  // Handler doesn't know or care which auth provider was used
  const task = await this.taskActions.create({
    userId,
    task: req.body
  })
  res.status(201).json(task)
}
```

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

```javascript
// Current: Joi
const Joi = require('joi')

const schema = {
  create: Joi.object({
    title: Joi.string().min(3).max(200).required(),
    description: Joi.string().max(1000).optional(),
    status: Joi.string().valid('pending', 'in_progress', 'completed').optional()
  })
}

const { error } = schema.create.validate(data)
if (error) throw new ValidationError(error.message)

// Zod
const { z } = require('zod')

const schema = {
  create: z.object({
    title: z.string().min(3).max(200),
    description: z.string().max(1000).optional(),
    status: z.enum(['pending', 'in_progress', 'completed']).optional()
  })
}

const result = schema.create.safeParse(data)
if (!result.success) throw new ValidationError(result.error.message)

// Yup
const yup = require('yup')

const schema = {
  create: yup.object({
    title: yup.string().min(3).max(200).required(),
    description: yup.string().max(1000),
    status: yup.string().oneOf(['pending', 'in_progress', 'completed'])
  })
}

await schema.create.validate(data)

// AJV (JSON Schema)
const Ajv = require('ajv')
const ajv = new Ajv()

const schema = {
  create: {
    type: 'object',
    properties: {
      title: { type: 'string', minLength: 3, maxLength: 200 },
      description: { type: 'string', maxLength: 1000 },
      status: { type: 'string', enum: ['pending', 'in_progress', 'completed'] }
    },
    required: ['title']
  }
}

const valid = ajv.validate(schema.create, data)
if (!valid) throw new ValidationError(ajv.errorsText())
```

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

```javascript
// No cache (baseline)
TaskRepository.prototype.find = async function ({ options }) {
  try {
    return await buildQuery(this.knexInstance, taskModel, options)
  } catch (error) {
    throw new RepositoryError(error.message)
  }
}

// Redis cache
TaskRepository.prototype.find = async function ({ options }) {
  try {
    const cacheKey = CacheHelpers.generateKey('task', 'find', options)
    const cached = await this.cacheClient.get(cacheKey)

    if (cached) {
      return JSON.parse(cached)
    }

    const result = await buildQuery(this.knexInstance, taskModel, options)
    await this.cacheClient.set(cacheKey, JSON.stringify(result), 'EX', 300)

    return result
  } catch (error) {
    throw new RepositoryError(error.message)
  }
}

// Memcached
const Memcached = require('memcached')
const memcached = new Memcached('localhost:11211')

TaskRepository.prototype.find = async function ({ options }) {
  const cacheKey = generateKey(options)
  const cached = await new Promise(resolve => {
    memcached.get(cacheKey, (err, data) => resolve(data))
  })

  if (cached) return JSON.parse(cached)

  const result = await buildQuery(this.knexInstance, taskModel, options)
  memcached.set(cacheKey, JSON.stringify(result), 300)

  return result
}

// In-memory cache (node-cache)
const NodeCache = require('node-cache')
const cache = new NodeCache({ stdTTL: 300 })

TaskRepository.prototype.find = async function ({ options }) {
  const cacheKey = generateKey(options)
  const cached = cache.get(cacheKey)

  if (cached) return cached

  const result = await buildQuery(this.knexInstance, taskModel, options)
  cache.set(cacheKey, result)

  return result
}
```

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

```javascript
// Unit test: Actions with mock repository
describe('TaskActions', () => {
  it('should create a task', async () => {
    const mockRepo = {
      create: jest.fn().mockResolvedValue(1),
      find: jest.fn().mockResolvedValue({
        data: [{ id: 1, title: 'Test', user_id: 'user-123' }]
      })
    }

    const actions = new TaskActions({ taskRepository: mockRepo })
    const task = await actions.create({
      userId: 'user-123',
      task: { title: 'Test' }
    })

    expect(task).toHaveProperty('id', 1)
    expect(mockRepo.create).toHaveBeenCalled()
  })
})

// Unit test: Handlers with mock actions
describe('TaskHandler', () => {
  it('should handle create request', async () => {
    const mockActions = {
      create: jest.fn().mockResolvedValue({
        id: 1,
        title: 'Test'
      })
    }

    const handler = new TaskHandler({ taskActions: mockActions })
    await handler.create(req, 'user-123')

    expect(mockActions.create).toHaveBeenCalledWith({
      userId: 'user-123',
      task: { title: 'Test' }
    })
  })
})

// Integration test: Repository with real database
describe('TaskRepository Integration', () => {
  let db
  let repository

  beforeAll(async () => {
    db = await makeDb(config, { migrate: true })
    repository = new TaskRepository({ knexInstance: db })
  })

  it('should create and find a task', async () => {
    const id = await repository.create({
      task: { user_id: 'user-123', title: 'Test' }
    })

    const result = await repository.find({
      options: { where: { id } }
    })

    expect(result.data[0]).toHaveProperty('title', 'Test')
  })
})

// E2E test: Full HTTP stack
describe('Task API E2E', () => {
  it('should create a task via REST', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test Task' })
      .expect(201)

    expect(response.body).toHaveProperty('id')
    expect(response.body).toHaveProperty('title', 'Test Task')
  })
})
```

### Benefits

- Test business logic without HTTP layer
- Test HTTP layer without database
- Fast unit tests, comprehensive integration tests
- Mock external dependencies easily

---

## 8. Query Builder Flexibility

Not locked into knex-tools. Replace the query builder without changing actions.

### Example: Different Query Builders

```javascript
// Current: knex-tools
const { buildQuery } = require('knex-tools')

TaskRepository.prototype.find = async function ({ options }) {
  return await buildQuery(this.knexInstance, taskModel, options)
}

// Raw Knex
TaskRepository.prototype.find = async function ({ options }) {
  const query = this.knexInstance(taskModel.tableName)

  if (options.where) query.where(options.where)
  if (options.projection) query.select(options.projection)
  if (options.paging) {
    query.limit(options.paging.limit)
    query.offset(options.paging.offset)
  }

  const data = await query
  return { data }
}

// TypeORM
TaskRepository.prototype.find = async function ({ options }) {
  const data = await this.ormRepository.find({
    where: options.where,
    take: options.paging?.limit,
    skip: options.paging?.offset
  })
  return { data }
}

// Prisma
TaskRepository.prototype.find = async function ({ options }) {
  const data = await this.prisma.task.findMany({
    where: options.where,
    take: options.paging?.limit,
    skip: options.paging?.offset
  })
  return { data }
}

// Mongoose
TaskRepository.prototype.find = async function ({ options }) {
  const query = this.Task.find(options.where)

  if (options.paging) {
    query.limit(options.paging.limit)
    query.skip(options.paging.offset)
  }

  const data = await query.exec()
  return { data }
}
```

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

```javascript
// Domain errors (thrown by actions)
throw new ValidationError('Title is required')
throw new ActionError('Failed to create task')
throw new NotFoundError('Task not found')

// REST mapping (Express middleware)
app.use((err, req, res, next) => {
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message })
  }
  if (err.name === 'NotFoundError') {
    return res.status(404).json({ error: err.message })
  }
  if (err.name === 'ActionError') {
    return res.status(500).json({ error: err.message })
  }
  res.status(500).json({ error: 'Internal server error' })
})

// GraphQL mapping (Apollo error formatter)
const server = new ApolloServer({
  formatError: error => {
    if (error.originalError?.name === 'ValidationError') {
      return {
        message: error.message,
        extensions: { code: 'BAD_USER_INPUT' }
      }
    }
    if (error.originalError?.name === 'NotFoundError') {
      return {
        message: error.message,
        extensions: { code: 'NOT_FOUND' }
      }
    }
    return {
      message: 'Internal server error',
      extensions: { code: 'INTERNAL_SERVER_ERROR' }
    }
  }
})

// CLI mapping (exit codes)
try {
  const task = await taskActions.create({ userId, task })
  console.log('Task created:', task)
  process.exit(0)
} catch (error) {
  console.error('Error:', error.message)
  if (error.name === 'ValidationError') process.exit(1)
  if (error.name === 'NotFoundError') process.exit(2)
  process.exit(3)
}

// WebSocket mapping (custom messages)
socket.on('task:create', async data => {
  try {
    const task = await taskActions.create({ userId, task: data })
    socket.emit('task:created', { success: true, data: task })
  } catch (error) {
    socket.emit('task:error', {
      success: false,
      error: error.message,
      code: error.name
    })
  }
})
```

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

```javascript
// Current: Custom container
function TasksContainer({ knexInstance }) {
  this.knexInstance = knexInstance
  this.repositories = new Map()
  this.actions = new Map()
}

TasksContainer.prototype.buildTaskActions = function () {
  if (!this.actions.has('task')) {
    this.actions.set('task', new TaskActions({
      taskRepository: this.buildTaskRepository()
    }))
  }
  return this.actions.get('task')
}

// Awilix (popular DI library)
const awilix = require('awilix')

const container = awilix.createContainer()
container.register({
  knexInstance: awilix.asValue(db),
  taskRepository: awilix.asClass(TaskRepository).singleton(),
  taskActions: awilix.asClass(TaskActions).singleton()
})

const taskActions = container.resolve('taskActions')

// InversifyJS (TypeScript-first)
import { Container } from 'inversify'
import { TYPES } from './types'

const container = new Container()
container.bind(TYPES.KnexInstance).toConstantValue(db)
container.bind(TYPES.TaskRepository).to(TaskRepository).inSingletonScope()
container.bind(TYPES.TaskActions).to(TaskActions).inSingletonScope()

const taskActions = container.get<TaskActions>(TYPES.TaskActions)

// TSyringe (TypeScript decorators)
import { container, injectable, inject } from 'tsyringe'

@injectable()
class TaskActions {
  constructor(@inject('TaskRepository') private taskRepository: TaskRepository) {}
}

container.register('TaskRepository', { useClass: TaskRepository })
const taskActions = container.resolve(TaskActions)

// Manual (no DI container)
const taskRepository = new TaskRepository({ knexInstance: db })
const taskActions = new TaskActions({ taskRepository })
```

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

### Configuration

```javascript
// docker-compose.yml
version: '3'
services:
  tasks-service:
    build: .
    command: node src/platforms/express/tasks-app.js
    environment:
      - DOMAIN=tasks
    replicas: 3

  users-service:
    build: .
    command: node src/platforms/express/users-app.js
    environment:
      - DOMAIN=users
    replicas: 2

  orders-service:
    build: .
    command: node src/platforms/express/orders-app.js
    environment:
      - DOMAIN=orders
    replicas: 5
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

```javascript
// Authentication middleware
app.use(authenticateToken) // Current (GoTrue)
app.use(auth0Middleware) // Auth0
app.use(firebaseAuthMiddleware) // Firebase
app.use(jwtMiddleware) // Generic JWT
app.use(passport.authenticate('jwt')) // Passport

// Rate limiting
app.use(
  expressRateLimit({
    // Express rate limit
    windowMs: 15 * 60 * 1000,
    max: 100
  })
)
app.use(customRateLimiter) // Custom implementation
app.use(redisRateLimiter) // Redis-based

// Logging
app.use(pinoLogger) // Current (Pino)
app.use(morgan('combined')) // Morgan
app.use(winstonMiddleware) // Winston
app.use(customLogger) // Custom

// Request validation
app.use(validateHeaders) // Header validation
app.use(validateBody) // Body validation
app.use(sanitizeInput) // Input sanitization

// CORS
app.use(cors()) // Simple CORS
app.use(
  cors({
    // Configured CORS
    origin: ['https://example.com'],
    credentials: true
  })
)

// Compression
app.use(compression()) // gzip
app.use(brotliCompression()) // brotli
```

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

```javascript
// Traditional Node.js server
// node src/platforms/express/app.js
const app = require('./platforms/express/app')
const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))

// AWS Lambda (Serverless)
// exports.handler
const { tasksContainer } = require('./lib/dependencies')

exports.handler = async (event) => {
  const taskActions = tasksContainer.buildTaskActions()

  if (event.httpMethod === 'GET') {
    const tasks = await taskActions.list({
      userId: event.requestContext.authorizer.userId
    })
    return {
      statusCode: 200,
      body: JSON.stringify(tasks)
    }
  }

  if (event.httpMethod === 'POST') {
    const task = await taskActions.create({
      userId: event.requestContext.authorizer.userId,
      task: JSON.parse(event.body)
    })
    return {
      statusCode: 201,
      body: JSON.stringify(task)
    }
  }
}

// Docker container
// Dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "src/platforms/express/app.js"]

// Kubernetes deployment
// k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tasks-api
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: tasks-api
        image: your-registry/tasks-api:latest
        ports:
        - containerPort: 3000

// Cloudflare Workers
// worker.js
import { tasksContainer } from './lib/dependencies'

export default {
  async fetch(request) {
    const url = new URL(request.url)
    const taskActions = tasksContainer.buildTaskActions()

    if (url.pathname === '/api/tasks' && request.method === 'GET') {
      const tasks = await taskActions.list({ userId: 'user-123' })
      return new Response(JSON.stringify(tasks), {
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
}

// Vercel/Netlify Functions
// api/tasks.js
const { tasksContainer } = require('../lib/dependencies')

module.exports = async (req, res) => {
  const taskActions = tasksContainer.buildTaskActions()

  if (req.method === 'GET') {
    const tasks = await taskActions.list({ userId: req.user.id })
    res.status(200).json(tasks)
  }
}

// Deno
// deno run --allow-net --allow-env app.ts
import { serve } from "https://deno.land/std/http/server.ts"
import { tasksContainer } from './lib/dependencies.ts'

serve(async (req) => {
  const taskActions = tasksContainer.buildTaskActions()
  // ... handle request
})

// Bun
// bun run src/platforms/express/app.js
import { serve } from "bun"
import { tasksContainer } from './lib/dependencies'

serve({
  port: 3000,
  async fetch(req) {
    const taskActions = tasksContainer.buildTaskActions()
    // ... handle request
  }
})
```

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

```javascript
// src/platforms/rabbitmq/consumer.js
const amqp = require('amqplib')
const { tasksContainer } = require('../../lib/dependencies')

async function consumeTaskMessages() {
  const connection = await amqp.connect(process.env.RABBITMQ_URL)
  const channel = await connection.createChannel()

  await channel.assertQueue('task-queue')

  console.log('Waiting for messages in task-queue...')

  channel.consume('task-queue', async msg => {
    try {
      const { action, userId, data } = JSON.parse(msg.content.toString())
      const taskActions = tasksContainer.buildTaskActions()

      switch (action) {
        case 'create':
          await taskActions.create({ userId, task: data })
          console.log('Task created from queue')
          break

        case 'update':
          await taskActions.update({ userId, id: data.id, task: data })
          console.log('Task updated from queue')
          break

        case 'delete':
          await taskActions.delete({ userId, id: data.id })
          console.log('Task deleted from queue')
          break
      }

      channel.ack(msg)
    } catch (error) {
      console.error('Error processing message:', error)
      channel.nack(msg, false, false)
    }
  })
}

consumeTaskMessages().catch(console.error)
```

### Step 2: Start Consumer (1 minute)

```bash
# package.json
{
  "scripts": {
    "consumer": "node src/platforms/rabbitmq/consumer.js"
  }
}

# Run it
npm run consumer
```

### Step 3: Publish Messages (4 minutes)

```javascript
// Anywhere in your app
const channel = await connection.createChannel()

await channel.sendToQueue(
  'task-queue',
  Buffer.from(
    JSON.stringify({
      action: 'create',
      userId: 'user-123',
      data: {
        title: 'Process this task asynchronously',
        description: 'This task is being created via message queue'
      }
    })
  )
)
```

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
