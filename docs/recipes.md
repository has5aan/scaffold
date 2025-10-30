# Recipes

Common customizations and extensions for the scaffold template.

## Table of Contents

- [Adding OAuth Providers](#adding-oauth-providers)
- [Adding GraphQL Support](#adding-graphql-support)
- [Swapping Express for Fastify](#swapping-express-for-fastify)
- [Adding WebSocket Support](#adding-websocket-support)
- [Implementing Advanced Caching](#implementing-advanced-caching)
- [Adding File Upload Support](#adding-file-upload-support)
- [Adding Background Jobs](#adding-background-jobs)
- [Implementing Full-Text Search](#implementing-full-text-search)

---

## Adding OAuth Providers

GoTrue supports multiple OAuth providers (Google, GitHub, Facebook, etc.). Here's how to add them.

### 1. Configure GoTrue for OAuth

Update `docker-compose.yml` to include OAuth settings:

```yaml
gotrue:
  image: supabase/gotrue:v2.158.1
  environment:
    # ... existing config ...

    # Google OAuth
    GOTRUE_EXTERNAL_GOOGLE_ENABLED: 'true'
    GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID: '${GOOGLE_CLIENT_ID}'
    GOTRUE_EXTERNAL_GOOGLE_SECRET: '${GOOGLE_CLIENT_SECRET}'
    GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI: 'http://localhost:9998/callback'

    # GitHub OAuth
    GOTRUE_EXTERNAL_GITHUB_ENABLED: 'true'
    GOTRUE_EXTERNAL_GITHUB_CLIENT_ID: '${GITHUB_CLIENT_ID}'
    GOTRUE_EXTERNAL_GITHUB_SECRET: '${GITHUB_CLIENT_SECRET}'
    GOTRUE_EXTERNAL_GITHUB_REDIRECT_URI: 'http://localhost:9998/callback'
```

### 2. Add OAuth Credentials to .env

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

### 3. Create OAuth Routes (Optional)

If you want to handle OAuth in your API, create an OAuth handler:

**Create `src/transport/handlers/auth/oauth.handler.js`:**

```javascript
const { OkResponse } = require('../../../lib/http-responses')

function OAuthHandler({ authService }) {
  this.authService = authService
}

/**
 * @param {import('express').Request} req
 */
OAuthHandler.prototype.initiateOAuth = async function (req) {
  const { provider } = req.params

  // Get OAuth URL from GoTrue
  const oauthUrl = `${process.env.GOTRUE_URL}/authorize?provider=${provider}`

  return new OkResponse({
    data: { url: oauthUrl }
  })
}

/**
 * @param {import('express').Request} req
 */
OAuthHandler.prototype.handleCallback = async function (req) {
  // GoTrue handles the callback and returns tokens
  // This is just to exchange the code for tokens if needed
  const { code } = req.query

  // Implementation depends on your frontend flow
  // Usually GoTrue redirects to your frontend with tokens

  return new OkResponse({ data: { code } })
}

module.exports = OAuthHandler
```

**Add OAuth routes to Express:**

```javascript
// In src/platforms/express/auth/routers/oauth.router.js
const express = require('express')
const { adaptExpressJsonResponse } = require('../../adapters/response.adapter')

function oauthRouter({ oauthHandler }) {
  const router = express.Router()

  router.get('/:provider', async (req, res) => {
    const response = await oauthHandler.initiateOAuth(req)
    adaptExpressJsonResponse(response, res)
  })

  router.get('/callback', async (req, res) => {
    const response = await oauthHandler.handleCallback(req)
    adaptExpressJsonResponse(response, res)
  })

  return router
}

module.exports = oauthRouter
```

### 4. Client Integration Example

**JavaScript/TypeScript client:**

```javascript
// Initiate OAuth flow
async function loginWithGoogle() {
  const response = await fetch('http://localhost:3000/api/auth/oauth/google')
  const { url } = await response.json()

  // Redirect user to OAuth provider
  window.location.href = url
}

// After OAuth callback, GoTrue returns tokens
// Your frontend receives access_token and refresh_token
// Store them and use in subsequent requests
```

---

## Adding GraphQL Support

Add GraphQL alongside your REST API using Apollo Server.

### 1. Install Dependencies

```bash
npm install @apollo/server graphql
```

### 2. Create GraphQL Type Definitions

**Create `src/platforms/graphql/schema/task.schema.js`:**

```javascript
const { gql } = require('graphql-tag')

const taskTypeDefs = gql`
  type Task {
    id: ID!
    userId: ID!
    title: String!
    description: String
    status: TaskStatus!
    dueDate: String
    createdAt: String!
    updatedAt: String!
  }

  enum TaskStatus {
    pending
    in_progress
    completed
  }

  input CreateTaskInput {
    title: String!
    description: String
    status: TaskStatus
    dueDate: String
  }

  input UpdateTaskInput {
    title: String
    description: String
    status: TaskStatus
    dueDate: String
  }

  type Query {
    tasks(status: TaskStatus, limit: Int, offset: Int): [Task!]!
    task(id: ID!): Task
  }

  type Mutation {
    createTask(input: CreateTaskInput!): Task!
    updateTask(id: ID!, input: UpdateTaskInput!): Task!
    deleteTask(id: ID!): Boolean!
  }
`

module.exports = taskTypeDefs
```

### 3. Create GraphQL Resolvers

**Create `src/platforms/graphql/resolvers/task.resolvers.js`:**

```javascript
const taskResolvers = {
  Query: {
    tasks: async (_, { status, limit, offset }, { user, tasksContainer }) => {
      const taskActions = tasksContainer.buildTaskActions()
      const result = await taskActions.list({
        userId: user.id,
        filters: { status, limit, offset }
      })
      // Return data array for GraphQL
      return result.data
    },

    task: async (_, { id }, { user, tasksContainer }) => {
      const taskActions = tasksContainer.buildTaskActions()
      return await taskActions.findById({
        id: parseInt(id),
        userId: user.id
      })
    }
  },

  Mutation: {
    createTask: async (_, { input }, { user, tasksContainer }) => {
      const taskActions = tasksContainer.buildTaskActions()
      return await taskActions.create({
        userId: user.id,
        task: input
      })
    },

    updateTask: async (_, { id, input }, { user, tasksContainer }) => {
      const taskActions = tasksContainer.buildTaskActions()
      return await taskActions.update({
        id: parseInt(id),
        userId: user.id,
        task: input
      })
    },

    deleteTask: async (_, { id }, { user, tasksContainer }) => {
      const taskActions = tasksContainer.buildTaskActions()
      await taskActions.delete({
        id: parseInt(id),
        userId: user.id
      })
      return true
    }
  }
}

module.exports = taskResolvers
```

### 4. Setup Apollo Server

**Create `src/platforms/graphql/server.js`:**

```javascript
const { ApolloServer } = require('@apollo/server')
const { expressMiddleware } = require('@apollo/server/express4')
const taskTypeDefs = require('./schema/task.schema')
const taskResolvers = require('./resolvers/task.resolvers')
const { authenticateToken } = require('../../auth/services/auth.service')

async function createGraphQLServer({ tasksContainer }) {
  const server = new ApolloServer({
    typeDefs: [taskTypeDefs],
    resolvers: [taskResolvers]
  })

  await server.start()

  // Create middleware with auth context
  const middleware = expressMiddleware(server, {
    context: async ({ req }) => {
      // Extract bearer token
      const bearerToken = req.headers.authorization?.replace('Bearer ', '')

      // Authenticate user
      const user = await authenticateToken(bearerToken)

      return {
        user,
        tasksContainer
      }
    }
  })

  return middleware
}

module.exports = { createGraphQLServer }
```

### 5. Mount GraphQL in Express

**Update `src/platforms/express/app.js`:**

```javascript
const { createGraphQLServer } = require('../graphql/server')
const { json } = require('express')

// ... existing setup ...

// Mount GraphQL endpoint
;(async () => {
  const graphqlMiddleware = await createGraphQLServer({ tasksContainer })
  app.use('/graphql', json(), graphqlMiddleware)
})()
```

### 6. Test GraphQL Endpoint

**Query tasks:**

```graphql
query GetTasks {
  tasks(status: in_progress, limit: 10) {
    id
    title
    status
    dueDate
  }
}
```

**Create task:**

```graphql
mutation CreateTask {
  createTask(
    input: {
      title: "Implement GraphQL"
      description: "Add GraphQL support to the API"
      status: completed
    }
  ) {
    id
    title
    status
  }
}
```

### Alternative: Pure GraphQL Library (Minimal)

For a lighter weight approach, use just the `graphql` package without Apollo Server.

**Install:**

```bash
npm install graphql
```

**Create schema using SDL:**

**Create `src/transport/graphql/task.schema.js`:**

```javascript
const { buildSchema } = require('graphql')

const taskSchema = buildSchema(`
  type Task {
    id: Int!
    user_id: String!
    title: String!
    description: String
    status: TaskStatus!
    due_date: String
    created_at: String!
    updated_at: String!
  }

  enum TaskStatus {
    pending
    in_progress
    completed
  }

  input CreateTaskInput {
    title: String!
    description: String
    status: TaskStatus
    due_date: String
  }

  input UpdateTaskInput {
    title: String
    description: String
    status: TaskStatus
    due_date: String
  }

  type Query {
    tasks(status: TaskStatus, limit: Int, offset: Int): [Task!]!
    task(id: Int!): Task
  }

  type Mutation {
    createTask(input: CreateTaskInput!): Task!
    updateTask(id: Int!, input: UpdateTaskInput!): Task!
    deleteTask(id: Int!): Boolean!
  }
`)

module.exports = taskSchema
```

**Create resolvers (call your actions):**

**Create `src/transport/graphql/task.resolvers.js`:**

```javascript
const taskResolvers = {
  // Queries
  tasks: async ({ status, limit, offset }, context) => {
    const { user, tasksContainer } = context
    const taskActions = tasksContainer.buildTaskActions()
    const result = await taskActions.list({
      userId: user.id,
      filters: { status, limit, offset }
    })
    // Return data array for GraphQL
    return result.data
  },

  task: async ({ id }, context) => {
    const { user, tasksContainer } = context
    const taskActions = tasksContainer.buildTaskActions()
    return await taskActions.findById({ id, userId: user.id })
  },

  // Mutations
  createTask: async ({ input }, context) => {
    const { user, tasksContainer } = context
    const taskActions = tasksContainer.buildTaskActions()
    return await taskActions.create({
      userId: user.id,
      task: input
    })
  },

  updateTask: async ({ id, input }, context) => {
    const { user, tasksContainer } = context
    const taskActions = tasksContainer.buildTaskActions()
    return await taskActions.update({
      id,
      userId: user.id,
      task: input
    })
  },

  deleteTask: async ({ id }, context) => {
    const { user, tasksContainer } = context
    const taskActions = tasksContainer.buildTaskActions()
    await taskActions.delete({ id, userId: user.id })
    return true
  }
}

module.exports = taskResolvers
```

**Create Express route (manually execute queries):**

**Create `src/platforms/express/routes/graphql.route.js`:**

```javascript
const express = require('express')
const { graphql } = require('graphql')
const taskSchema = require('../../../transport/graphql/task.schema')
const taskResolvers = require('../../../transport/graphql/task.resolvers')
const { authenticateToken } = require('../../../auth/services/auth.service')

function graphqlRouter({ tasksContainer }) {
  const router = express.Router()

  router.post('/', async (req, res) => {
    try {
      // Authenticate user
      const bearerToken = req.headers.authorization?.replace('Bearer ', '')
      const user = await authenticateToken(bearerToken)

      // Client sends query as a string
      const { query, variables } = req.body

      // Execute GraphQL query manually
      const result = await graphql({
        schema: taskSchema,
        source: query, // Query string from client
        rootValue: taskResolvers, // Your resolvers
        contextValue: {
          // Context passed to resolvers
          user,
          tasksContainer
        },
        variableValues: variables // Variables from client
      })

      res.json(result)
    } catch (error) {
      res.status(500).json({ errors: [{ message: error.message }] })
    }
  })

  return router
}

module.exports = graphqlRouter
```

**Mount in Express:**

```javascript
const graphqlRouter = require('./routes/graphql.route')

app.use('/graphql', graphqlRouter({ tasksContainer }))
```

**Test with curl (client sends query as string):**

```bash
# Query tasks
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "query": "{ tasks(limit: 10) { id title status } }"
  }'

# Create task with variables
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "query": "mutation ($input: CreateTaskInput!) { createTask(input: $input) { id title } }",
    "variables": {
      "input": {
        "title": "Test task",
        "status": "pending"
      }
    }
  }'
```

**Benefits:**

- ✅ Minimal dependencies (just `graphql`)
- ✅ Full control over execution
- ✅ Same business logic (actions/repositories unchanged)
- ✅ ~50 lines of code vs Apollo's setup

---

## Swapping Express for Fastify

Replace Express with Fastify for better performance.

### 1. Install Fastify

```bash
npm install fastify
npm uninstall express
```

### 2. Create Fastify Response Adapter

**Create `src/platforms/fastify/adapters/response.adapter.js`:**

```javascript
function adaptFastifyJsonResponse(response, reply) {
  if (response.data !== null) {
    return reply.status(response.statusCode).send(response.data)
  }
  return reply.status(response.statusCode).send()
}

module.exports = { adaptFastifyJsonResponse }
```

### 3. Create Fastify Middleware

**Create `src/platforms/fastify/middleware/auth.middleware.js`:**

```javascript
const { authenticateToken } = require('../../../auth/services/auth.service')
const { AuthenticationError } = require('../../../lib/errors')

async function buildAuthHook() {
  return async (request, _reply) => {
    const bearerToken = request.headers.authorization?.replace('Bearer ', '')

    if (!bearerToken) {
      throw new AuthenticationError('No authentication token provided')
    }

    const user = await authenticateToken(bearerToken)
    request.user = user
  }
}

module.exports = { buildAuthHook }
```

### 4. Create Fastify Routes

**Create `src/platforms/fastify/tasks/routers/task.router.js`:**

```javascript
const { adaptFastifyJsonResponse } = require('../../adapters/response.adapter')
const TaskHandler = require('../../../../transport/handlers/tasks/task.handler')

async function taskRoutes(fastify, { tasksContainer, authHook }) {
  const taskHandler = new TaskHandler({
    taskActions: tasksContainer.buildTaskActions()
  })

  // Add auth hook to all routes
  fastify.addHook('preHandler', authHook)

  // POST /tasks
  fastify.post('/', async (request, reply) => {
    const response = await taskHandler.create(
      { body: request.body },
      request.user.id
    )
    adaptFastifyJsonResponse(response, reply)
  })

  // GET /tasks
  fastify.get('/', async (request, reply) => {
    const response = await taskHandler.list(
      { query: request.query },
      request.user.id
    )
    adaptFastifyJsonResponse(response, reply)
  })

  // GET /tasks/:id
  fastify.get('/:id', async (request, reply) => {
    const response = await taskHandler.findById(
      { params: request.params },
      request.user.id
    )
    adaptFastifyJsonResponse(response, reply)
  })

  // PATCH /tasks/:id
  fastify.patch('/:id', async (request, reply) => {
    const response = await taskHandler.update(
      { params: request.params, body: request.body },
      request.user.id
    )
    adaptFastifyJsonResponse(response, reply)
  })

  // DELETE /tasks/:id
  fastify.delete('/:id', async (request, reply) => {
    const response = await taskHandler.delete(
      { params: request.params },
      request.user.id
    )
    adaptFastifyJsonResponse(response, reply)
  })
}

module.exports = taskRoutes
```

### 5. Create Fastify App

**Create `src/platforms/fastify/app.js`:**

```javascript
const fastify = require('fastify')
const cors = require('@fastify/cors')
const { tasksContainer, logger } = require('../containers')
const { buildAuthHook } = require('./middleware/auth.middleware')
const taskRoutes = require('./tasks/routers/task.router')

async function buildApp() {
  const app = fastify({ logger: false })

  // Register CORS
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN || '*'
  })

  // Build auth hook
  const authHook = await buildAuthHook()

  // Register routes
  await app.register(taskRoutes, {
    prefix: '/api/tasks',
    tasksContainer,
    authHook
  })

  // Error handler
  app.setErrorHandler((error, request, reply) => {
    logger.error({ err: error, url: request.url, method: request.method })

    const { mapErrorToHttp } = require('../../transport/error-mapping')
    const { statusCode, message } = mapErrorToHttp(error)

    reply.status(statusCode).send({ error: message })
  })

  return app
}

// Start server
;(async () => {
  const app = await buildApp()

  const port = process.env.PORT || 3000
  await app.listen({ port, host: '0.0.0.0' })

  logger.info(`Server listening on http://localhost:${port}`)
})()
```

### 6. Update package.json

```json
{
  "scripts": {
    "dev": "npx nodemon src/platforms/fastify/app.js"
  }
}
```

**Note:** Your business logic (actions, repositories, handlers) remains unchanged. Only the platform layer changes.

---

## Adding WebSocket Support

Add real-time updates using Socket.io.

### 1. Install Dependencies

```bash
npm install socket.io
```

### 2. Create WebSocket Handler

**Create `src/transport/handlers/tasks/task.websocket.handler.js`:**

```javascript
function TaskWebSocketHandler({ taskActions, io }) {
  this.taskActions = taskActions
  this.io = io
}

TaskWebSocketHandler.prototype.broadcastTaskCreated = function (task) {
  this.io.to(`user:${task.user_id}`).emit('task:created', task)
}

TaskWebSocketHandler.prototype.broadcastTaskUpdated = function (task) {
  this.io.to(`user:${task.user_id}`).emit('task:updated', task)
}

TaskWebSocketHandler.prototype.broadcastTaskDeleted = function (
  taskId,
  userId
) {
  this.io.to(`user:${userId}`).emit('task:deleted', { id: taskId })
}

module.exports = TaskWebSocketHandler
```

### 3. Setup Socket.io Server

**Create `src/platforms/express/websocket/socket.server.js`:**

```javascript
const { Server } = require('socket.io')
const { authenticateToken } = require('../../../auth/services/auth.service')

function setupWebSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST']
    }
  })

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token
      const user = await authenticateToken(token)
      socket.user = user
      next()
    } catch (error) {
      next(new Error('Authentication failed'))
    }
  })

  // Connection handler
  io.on('connection', socket => {
    console.log(`User ${socket.user.id} connected`)

    // Join user-specific room
    socket.join(`user:${socket.user.id}`)

    socket.on('disconnect', () => {
      console.log(`User ${socket.user.id} disconnected`)
    })
  })

  return io
}

module.exports = { setupWebSocket }
```

### 4. Integrate with Express

**Update `src/platforms/express/app.js`:**

```javascript
const http = require('http')
const { setupWebSocket } = require('./websocket/socket.server')

// Create HTTP server
const httpServer = http.createServer(app)

// Setup WebSocket
const io = setupWebSocket(httpServer)

// Make io available to handlers via container
// You can store it in commonContainer or pass to domain containers

// Start server
const port = process.env.PORT || 3000
httpServer.listen(port, () => {
  logger.info(`Server listening on http://localhost:${port}`)
})
```

### 5. Emit Events from Actions

**Update `src/tasks/actions/task.actions.js`:**

```javascript
function TaskActions({ taskRepository, websocketHandler }) {
  this.taskRepository = taskRepository
  this.websocketHandler = websocketHandler
}

TaskActions.prototype.create = async function ({ userId, task }) {
  // ... existing create logic ...

  // Broadcast event
  if (this.websocketHandler) {
    this.websocketHandler.broadcastTaskCreated(createdTask)
  }

  return createdTask
}

TaskActions.prototype.update = async function ({ id, userId, task }) {
  // ... existing update logic ...

  // Broadcast event
  if (this.websocketHandler) {
    this.websocketHandler.broadcastTaskUpdated(updatedTask)
  }

  return updatedTask
}

TaskActions.prototype.delete = async function ({ id, userId }) {
  // ... existing delete logic ...

  // Broadcast event
  if (this.websocketHandler) {
    this.websocketHandler.broadcastTaskDeleted(id, userId)
  }
}
```

### 6. Client Integration

**JavaScript client example:**

```javascript
import { io } from 'socket.io-client'

const socket = io('http://localhost:3000', {
  auth: {
    token: 'YOUR_ACCESS_TOKEN'
  }
})

// Listen for task events
socket.on('task:created', task => {
  console.log('New task created:', task)
  // Update UI
})

socket.on('task:updated', task => {
  console.log('Task updated:', task)
  // Update UI
})

socket.on('task:deleted', ({ id }) => {
  console.log('Task deleted:', id)
  // Update UI
})
```

---

## Implementing Advanced Caching

Use Redis for caching frequently accessed data.

### 1. Create Cache Helpers

**Create `src/lib/cache/cache.helpers.js`:**

```javascript
const CacheHelpers = {
  async get({ cacheClient, key }) {
    const value = await cacheClient.get(key)
    return value ? JSON.parse(value) : null
  },

  async set({ cacheClient, key, value, ttl = 300 }) {
    await cacheClient.setEx(key, ttl, JSON.stringify(value))
  },

  async delete({ cacheClient, key }) {
    await cacheClient.del(key)
  },

  async deletePattern({ cacheClient, pattern }) {
    const keys = await cacheClient.keys(pattern)
    if (keys.length > 0) {
      await cacheClient.del(keys)
    }
  },

  // Generate cache keys
  keys: {
    task: id => `task:${id}`,
    userTasks: (userId, status) => `user:${userId}:tasks:${status || 'all'}`,
    tasksByStatus: status => `tasks:status:${status}`
  }
}

module.exports = CacheHelpers
```

### 2. Add Caching to Repository

**Update `src/tasks/repositories/task.repository.js`:**

```javascript
const { buildQuery } = require('knex-tools')
const taskModel = require('../models/task.model')
const { RepositoryError } = require('../../lib/errors')
const CacheHelpers = require('../../lib/cache/cache.helpers')

function TaskRepository({ knexInstance, cacheClient }) {
  this.knexInstance = knexInstance
  this.cacheClient = cacheClient
}

TaskRepository.prototype.find = async function ({ options, useCache = true }) {
  try {
    // If single task by ID, try cache first
    if (useCache && options.where?.id && !options.where.user_id) {
      const cacheKey = CacheHelpers.keys.task(options.where.id)
      const cached = await CacheHelpers.get({
        cacheClient: this.cacheClient,
        key: cacheKey
      })

      if (cached) {
        return cached
      }
    }

    // Query database
    const result = await buildQuery(this.knexInstance, taskModel, options)

    // Cache single task results (check result.data array)
    if (
      useCache &&
      options.where?.id &&
      result.data &&
      result.data.length === 1
    ) {
      const cacheKey = CacheHelpers.keys.task(options.where.id)
      await CacheHelpers.set({
        cacheClient: this.cacheClient,
        key: cacheKey,
        value: result,
        ttl: 300 // 5 minutes
      })
    }

    return result
  } catch (error) {
    throw new RepositoryError(error.message)
  }
}

TaskRepository.prototype.create = async function ({ task }) {
  try {
    const result = await this.knexInstance(taskModel.tableName)
      .insert(task)
      .returning(taskModel.primaryKey)
    const id = result[0]

    // Invalidate user's task list cache
    await CacheHelpers.deletePattern({
      cacheClient: this.cacheClient,
      pattern: `user:${task.user_id}:tasks:*`
    })

    return id
  } catch (error) {
    throw new RepositoryError(error.message)
  }
}

TaskRepository.prototype.update = async function ({ id, task }) {
  try {
    const result = await this.knexInstance(taskModel.tableName)
      .where(taskModel.primaryKey, id)
      .update(task)
      .returning(taskModel.primaryKey)

    // Invalidate cache for this task
    await CacheHelpers.delete({
      cacheClient: this.cacheClient,
      key: CacheHelpers.keys.task(id)
    })

    // Invalidate user's task list cache
    if (task.user_id) {
      await CacheHelpers.deletePattern({
        cacheClient: this.cacheClient,
        pattern: `user:${task.user_id}:tasks:*`
      })
    }

    return result[0]
  } catch (error) {
    throw new RepositoryError(error.message)
  }
}
```

### 3. Update Container to Inject Cache Client

**Update `src/tasks/tasks.container.js`:**

```javascript
function TasksContainer({ knexInstance, cacheClient, commonContainer }) {
  this.knexInstance = knexInstance
  this.cacheClient = cacheClient
  this.commonContainer = commonContainer
  // ...
}

TasksContainer.prototype.buildTaskRepository = function () {
  if (!this.repositories.has('task')) {
    this.repositories.set(
      'task',
      new TaskRepository({
        knexInstance: this.knexInstance,
        cacheClient: this.cacheClient
      })
    )
  }
  return this.repositories.get('task')
}
```

**Update `src/platforms/containers.js`:**

```javascript
const tasksContainer = new TasksContainer({
  knexInstance,
  cacheClient, // Pass cache client
  commonContainer
})
```

---

## Adding File Upload Support

Handle file uploads using multer.

### 1. Install Dependencies

```bash
npm install multer
```

### 2. Create Upload Middleware

**Create `src/platforms/express/middleware/upload.middleware.js`:**

```javascript
const multer = require('multer')
const path = require('path')

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/') // Make sure this directory exists
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(
      null,
      file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)
    )
  }
})

// File filter
const fileFilter = (req, file, cb) => {
  // Allow only specific file types
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  )
  const mimetype = allowedTypes.test(file.mimetype)

  if (extname && mimetype) {
    return cb(null, true)
  } else {
    cb(
      new Error(
        'Invalid file type. Only JPEG, PNG, PDF, DOC, DOCX are allowed.'
      )
    )
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
})

module.exports = { upload }
```

### 3. Create File Model and Repository

**Migration `src/tasks/migrations/tasks-03-attachment.js`:**

```javascript
const { getTableName } = require('../../lib/database/migration-helpers')

exports.up = function (knex) {
  return knex.schema.createTable(
    getTableName('tasks', 'attachment', { knex }),
    function (table) {
      table.increments('id').primary()
      table.integer('task_id').unsigned().notNullable()
      table.string('filename', 255).notNullable()
      table.string('original_name', 255).notNullable()
      table.string('mime_type', 100).notNullable()
      table.integer('file_size').unsigned().notNullable()
      table.string('file_path', 500).notNullable()
      table.timestamp('created_at').defaultTo(knex.fn.now())

      table
        .foreign('task_id')
        .references('id')
        .inTable(getTableName('tasks', 'task', { knex }))
        .onDelete('CASCADE')
    }
  )
}

exports.down = function (knex) {
  return knex.schema.dropTable(getTableName('tasks', 'attachment', { knex }))
}
```

### 4. Add Upload Handler

**Create `src/transport/handlers/tasks/attachment.handler.js`:**

```javascript
const { parseIntParam } = require('../../../lib/param-tools')
const { CreatedResponse, OkResponse } = require('../../../lib/http-responses')

function AttachmentHandler({ attachmentActions }) {
  this.attachmentActions = attachmentActions
}

/**
 * @param {import('express').Request} req
 * @param {string} userId
 */
AttachmentHandler.prototype.upload = async function (req, userId) {
  const { taskId } = req.params
  const file = req.file

  const attachment = await this.attachmentActions.create({
    userId,
    taskId: parseIntParam(taskId, 'taskId'),
    file: {
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      filePath: file.path
    }
  })

  return new CreatedResponse({ data: attachment })
}

/**
 * @param {import('express').Request} req
 * @param {string} userId
 */
AttachmentHandler.prototype.list = async function (req, userId) {
  const { taskId } = req.params

  const attachments = await this.attachmentActions.list({
    userId,
    taskId: parseIntParam(taskId, 'taskId')
  })

  return new OkResponse({ data: attachments })
}

module.exports = AttachmentHandler
```

### 5. Add Upload Route

**Create `src/platforms/express/tasks/routers/attachment.router.js`:**

```javascript
const express = require('express')
const { upload } = require('../../middleware/upload.middleware')
const { adaptExpressJsonResponse } = require('../../adapters/response.adapter')

function attachmentRouter({ attachmentHandler }) {
  const router = express.Router()

  // Upload attachment to task
  router.post(
    '/:taskId/attachments',
    upload.single('file'),
    async (req, res) => {
      const response = await attachmentHandler.upload(req, req.user.id)
      adaptExpressJsonResponse(response, res)
    }
  )

  // List task attachments
  router.get('/:taskId/attachments', async (req, res) => {
    const response = await attachmentHandler.list(req, req.user.id)
    adaptExpressJsonResponse(response, res)
  })

  return router
}

module.exports = attachmentRouter
```

### 6. Test File Upload

```bash
curl -X POST http://localhost:3000/api/tasks/1/attachments \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "X-Platform: web" \
  -H "X-Install-ID: test-install-123" \
  -F "file=@/path/to/your/file.pdf"
```

---

## Adding Background Jobs

Use BullMQ for background job processing.

### 1. Install Dependencies

```bash
npm install bullmq
```

### 2. Create Job Queue

**Create `src/lib/jobs/queue.js`:**

```javascript
const { Queue, Worker } = require('bullmq')
const { cacheClient, logger } = require('../../platforms/containers')

// Create queue
const taskQueue = new Queue('tasks', {
  connection: cacheClient
})

// Job handlers
const jobHandlers = {
  'send-task-reminder': async job => {
    const { taskId, userId } = job.data
    logger.info(`Sending reminder for task ${taskId} to user ${userId}`)

    // Send email, push notification, etc.
    // Implementation depends on your notification system
  },

  'cleanup-completed-tasks': async job => {
    const { olderThanDays } = job.data
    logger.info(`Cleaning up completed tasks older than ${olderThanDays} days`)

    // Delete old completed tasks
    // Implementation in your repository
  }
}

// Create worker
const worker = new Worker(
  'tasks',
  async job => {
    const handler = jobHandlers[job.name]
    if (handler) {
      await handler(job)
    } else {
      logger.warn(`No handler found for job: ${job.name}`)
    }
  },
  { connection: cacheClient }
)

worker.on('completed', job => {
  logger.info(`Job ${job.id} completed`)
})

worker.on('failed', (job, err) => {
  logger.error(`Job ${job.id} failed:`, err)
})

module.exports = { taskQueue }
```

### 3. Queue Jobs from Actions

**Update `src/tasks/actions/task.actions.js`:**

```javascript
const { taskQueue } = require('../../lib/jobs/queue')

TaskActions.prototype.create = async function ({ userId, task }) {
  // ... existing create logic ...

  // Schedule reminder if due date is set
  if (task.due_date) {
    await taskQueue.add(
      'send-task-reminder',
      { taskId: id, userId },
      {
        delay: new Date(task.due_date).getTime() - Date.now() - 3600000 // 1 hour before
      }
    )
  }

  return createdTask
}
```

### 4. Schedule Recurring Jobs

**Create `src/lib/jobs/scheduler.js`:**

```javascript
const { taskQueue } = require('./queue')

async function setupScheduledJobs() {
  // Clean up old completed tasks daily at 2 AM
  await taskQueue.add(
    'cleanup-completed-tasks',
    { olderThanDays: 30 },
    {
      repeat: {
        pattern: '0 2 * * *' // Cron expression
      }
    }
  )
}

module.exports = { setupScheduledJobs }
```

**Call in app startup (`src/platforms/express/app.js`):**

```javascript
const { setupScheduledJobs } = require('../../lib/jobs/scheduler')

// Setup scheduled jobs
setupScheduledJobs()
```

---

## Implementing Full-Text Search

Add PostgreSQL full-text search capabilities.

### 1. Add Full-Text Search Column

**Create migration `src/tasks/migrations/tasks-04-search.js`:**

```javascript
const {
  getTableName,
  getDbType,
  DbType
} = require('../../lib/database/migration-helpers')

exports.up = async function (knex) {
  const dbType = getDbType(knex)

  // Only PostgreSQL supports full-text search with tsvector
  if (dbType !== DbType.postgresql) {
    return
  }

  const tableName = getTableName('tasks', 'task', { knex })

  await knex.schema.table(tableName, table => {
    // Add tsvector column for full-text search
    table.specificType('search_vector', 'tsvector')
  })

  // Create GIN index for better search performance
  await knex.raw(`
    CREATE INDEX task_search_vector_idx
    ON ${tableName}
    USING GIN (search_vector)
  `)

  // Create trigger to auto-update search_vector
  await knex.raw(`
    CREATE FUNCTION tasks.task_search_vector_update() RETURNS trigger AS $$
    BEGIN
      NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
      RETURN NEW;
    END
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER task_search_vector_update
    BEFORE INSERT OR UPDATE ON ${tableName}
    FOR EACH ROW
    EXECUTE FUNCTION tasks.task_search_vector_update();
  `)

  // Update existing rows
  await knex.raw(`
    UPDATE ${tableName}
    SET search_vector =
      setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
      setweight(to_tsvector('english', COALESCE(description, '')), 'B')
  `)
}

exports.down = async function (knex) {
  const dbType = getDbType(knex)

  if (dbType !== DbType.postgresql) {
    return
  }

  const tableName = getTableName('tasks', 'task', { knex })

  await knex.raw(
    `DROP TRIGGER IF EXISTS task_search_vector_update ON ${tableName}`
  )
  await knex.raw('DROP FUNCTION IF EXISTS tasks.task_search_vector_update')
  await knex.raw('DROP INDEX IF EXISTS tasks.task_search_vector_idx')
  await knex.schema.table(tableName, table => {
    table.dropColumn('search_vector')
  })
}
```

### 2. Add Search Method to Repository

**Update `src/tasks/repositories/task.repository.js`:**

```javascript
TaskRepository.prototype.search = async function ({
  userId,
  query,
  limit = 50,
  offset = 0
}) {
  const results = await this.knexInstance('tasks.task')
    .select('*')
    .where('user_id', userId)
    .whereRaw(`search_vector @@ plainto_tsquery('english', ?)`, [query])
    .orderByRaw(`ts_rank(search_vector, plainto_tsquery('english', ?)) DESC`, [
      query
    ])
    .limit(limit)
    .offset(offset)

  return results
}
```

### 3. Add Search Action

**Update `src/tasks/actions/task.actions.js`:**

```javascript
TaskActions.prototype.search = async function ({
  userId,
  query,
  filters = {}
}) {
  if (!query || query.trim().length === 0) {
    throw new ValidationError('Search query is required')
  }

  return await this.taskRepository.search({
    userId,
    query: query.trim(),
    limit: filters.limit || 50,
    offset: filters.offset || 0
  })
}
```

### 4. Add Search Handler and Route

**Update `src/transport/handlers/tasks/task.handler.js`:**

```javascript
/**
 * @param {import('express').Request} req
 * @param {string} userId
 */
TaskHandler.prototype.search = async function (req, userId) {
  const { q, limit, offset } = req.query

  const tasks = await this.taskActions.search({
    userId,
    query: q,
    filters: {
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0
    }
  })

  return new OkResponse({ data: tasks })
}
```

**Add route in `src/platforms/express/tasks/routers/task.router.js`:**

```javascript
router.get('/search', async (req, res) => {
  const response = await taskHandler.search(req, req.user.id)
  adaptExpressJsonResponse(response, res)
})
```

### 5. Test Full-Text Search

```bash
curl -X GET "http://localhost:3000/api/tasks/search?q=documentation&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "X-Platform: web" \
  -H "X-Install-ID: test-install-123"
```

---

## Additional Resources

- [PostgreSQL Full-Text Search Documentation](https://www.postgresql.org/docs/current/textsearch.html)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [Socket.io Documentation](https://socket.io/docs/)
- [Apollo Server Documentation](https://www.apollographql.com/docs/apollo-server/)
- [Fastify Documentation](https://www.fastify.io/)

---

_Last updated: 2025-10-28_
