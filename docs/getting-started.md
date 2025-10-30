# Getting Started

A practical guide to using the scaffold template for your first project.

## Prerequisites

Before starting, ensure you have:

- **Node.js 22** installed
- **Docker and Docker Compose** installed
- Basic understanding of Node.js and PostgreSQL

## Initial Setup

Follow these steps to get the template running on your machine.

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the sample environment file:

```bash
cp env.sample .env
```

**Generate a JWT secret** for GoTrue authentication:

```bash
# On macOS/Linux
openssl rand -base64 32
```

Update `.env` with your generated JWT secret:

```env
JWT_SECRET=your_generated_secret_here
```

**Optional configuration:**

- `SMTP_*` - Email configuration (required if GoTrue email confirmation is enabled)
- `PINO_TRANSPORT_TARGETS` - Logging targets (`console`, `file`, or `sqlite`)
- `PORT` - API server port (default: 3000)

### 3. Start Docker Services

Start PostgreSQL, GoTrue, and Redis:

```bash
docker-compose up -d
```

**What's running:**

- **PostgreSQL** (port 5431) - Main database
- **GoTrue** (port 9998) - Supabase authentication service
- **Redis** (port 6379) - Caching layer

### 4. Run Database Migrations

Apply all migrations (auth and example domains):

```bash
npm run migrate
```

### 5. Start Development Server

```bash
npm run dev
```

Server runs on `http://localhost:3000` (or your configured PORT).

### 6. Test the API

**Create a test user:**

```bash
curl -X POST http://localhost:9998/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Get an access token:**

```bash
curl -X POST http://localhost:9998/token?grant_type=password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Save the `access_token` from the response.

**Create a tag (authenticated request):**

```bash
curl -X POST http://localhost:3000/api/example/tags \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "X-Platform: web" \
  -H "X-Install-ID: test-install-123" \
  -d '{
    "name": "JavaScript",
    "description": "JavaScript resources"
  }'
```

## Understanding the Example Domain

The template includes an `example` domain demonstrating the architecture patterns. It implements a bookmark manager with tags.

**What's included:**

```
src/example/
├── actions/          # Business logic (tag.actions.js)
├── models/           # Data models with projections/relations
├── repositories/     # Data access layer
├── validators/       # Input schemas and business rules
├── migrations/       # Database schema migrations
└── example.container.js  # Dependency injection container
```

**Routes:**

- `POST /api/example/tags` - Create a tag
- `GET /api/example/tags` - List user's tags
- `GET /api/example/tags/:id` - Get tag by ID
- `PATCH /api/example/tags/:id` - Update a tag
- `DELETE /api/example/tags/:id` - Delete a tag

**Learn from the example:**

1. Review `src/example/actions/tag.actions.js` - See how business logic is structured
2. Check `src/example/repositories/tag.repository.js` - Understand data access patterns
3. Explore `src/platforms/express/example/routers/tag.router.js` - See how routes are defined
4. Study `src/transport/handlers/example/tag.handler.js` - Learn transport layer patterns

## Customizing for Your Project

### Option 1: Keep the Example Domain

**When to keep it:**

- You want a working reference implementation
- You're learning the architecture
- You plan to build something similar to bookmarks/tags

**Steps:**

1. Update project name in `package.json`
2. Start creating your own domains alongside `example`
3. Use the example domain as a reference

### Option 2: Remove the Example Domain

**When to remove it:**

- You understand the patterns
- You want a clean slate
- You don't need the reference anymore

**Steps:**

1. **Delete the example domain directory:**

   ```bash
   rm -rf src/example
   ```

2. **Remove example routes from Express app** (`src/platforms/express/app.js`):

   ```javascript
   // Remove this import
   const exampleApp = require('./example/example.app')

   // Remove this call
   exampleApp({
     expressInstance: app,
     commonContainer,
     container: exampleContainer
   })
   ```

3. **Remove example container** (`src/platforms/containers.js`):

   ```javascript
   // Remove this import
   const ExampleContainer = require('../example/example.container')

   // Remove this line
   const exampleContainer = new ExampleContainer({
     knexInstance,
     commonContainer
   })

   // Remove from exports
   module.exports = {
     knexInstance,
     cacheClient,
     logger,
     commonContainer
     // exampleContainer - remove this
   }
   ```

4. **Remove example transport handlers:**

   ```bash
   rm -rf src/transport/handlers/example
   ```

5. **Remove example Express routes:**

   ```bash
   rm -rf src/platforms/express/example
   ```

6. **Rollback example migrations:**

   ```bash
   npm run migrate:rollback example
   ```

   Or rollback individual migrations in reverse order:

   ```bash
   node scripts/migrate.js down example-04-bookmark-tag.js
   node scripts/migrate.js down example-03-bookmark.js
   node scripts/migrate.js down example-02-tag.js
   node scripts/migrate.js down example-01-schema.js
   ```

## Creating Your First Domain

Let's create a "tasks" domain as an example. This will be a simple task manager.

### 1. Create Domain Directory Structure

```bash
mkdir -p src/tasks/{actions,models,repositories,validators/schema,validators/rules,migrations}
```

Your structure should look like:

```
src/tasks/
├── actions/
├── models/
├── repositories/
├── validators/
│   ├── schema/
│   └── rules/
└── migrations/
```

### 2. Create the Database Schema Migration

Create `src/tasks/migrations/tasks-01-schema.js`:

```javascript
const {
  createSchemaIfSupported,
  dropSchemaIfSupported
} = require('../../lib/database/migration-helpers')

exports.up = async function (knex) {
  await createSchemaIfSupported(knex, 'tasks')
}

exports.down = async function (knex) {
  await dropSchemaIfSupported(knex, 'tasks')
}
```

### 3. Create the Task Table Migration

Create `src/tasks/migrations/tasks-02-task.js`:

```javascript
const { getTableName, uuid } = require('../../lib/database/migration-helpers')

exports.up = function (knex) {
  return knex.schema.createTable(
    getTableName('tasks', 'task', { knex }),
    function (table) {
      table.increments('id').primary()
      uuid(table, 'user_id', knex)
        .notNullable()
        .references('id')
        .inTable(getTableName('auth', 'users', { knex }))
        .onDelete('CASCADE')
      table.string('title', 200).notNullable()
      table.text('description')
      table
        .enu('status', ['pending', 'in_progress', 'completed'])
        .defaultTo('pending')
      table.timestamp('due_date')
      table.timestamps(true, true)

      table.index('user_id')
      table.index('status')
    }
  )
}

exports.down = function (knex) {
  return knex.schema.dropTable(getTableName('tasks', 'task', { knex }))
}
```

### 4. Create the Data Model

Create `src/tasks/models/task.model.js`:

```javascript
const { getTableName } = require('../../lib/database/migration-helpers')

const taskModel = {
  tableName: getTableName('tasks', 'task', {
    dbType: process.env.DB_TYPE || 'pg'
  }),
  primaryKey: 'id',

  projections: {
    default: (_, alias) => [
      `${alias}.id`,
      `${alias}.user_id`,
      `${alias}.title`,
      `${alias}.description`,
      `${alias}.status`,
      `${alias}.due_date`,
      `${alias}.created_at`,
      `${alias}.updated_at`
    ],
    summary: (_, alias) => [
      `${alias}.id`,
      `${alias}.title`,
      `${alias}.status`,
      `${alias}.due_date`
    ]
  },

  relations: {
    user: {
      type: 'belongsTo',
      table: getTableName('auth', 'users', {
        dbType: process.env.DB_TYPE || 'pg'
      }),
      foreignKey: 'user_id',
      primaryKey: 'id',
      modelDefinition: () => require('../../auth/models/user.model')
    }
  },

  modifiers: {
    forUser: (query, alias, { userId }) => {
      query.where(`${alias}.user_id`, userId)
    },
    byStatus: (query, alias, { status }) => {
      query.where(`${alias}.status`, status)
    }
  }
}

module.exports = taskModel
```

### 5. Create the Repository

Create `src/tasks/repositories/task.repository.js`:

```javascript
const { buildQuery, exists, counts } = require('knex-tools')
const taskModel = require('../models/task.model')
const { RepositoryError } = require('../../lib/errors')

class TaskRepository {
  constructor({ knexInstance }) {
    this.knexInstance = knexInstance
  }

  async create({ task }) {
    try {
      const result = await this.knexInstance(taskModel.tableName)
        .insert(task)
        .returning(taskModel.primaryKey)
      return result[0]
    } catch (error) {
      throw new RepositoryError(error.message)
    }
  }

  async find({ options }) {
    try {
      return await buildQuery(this.knexInstance, taskModel, options)
    } catch (error) {
      throw new RepositoryError(error.message)
    }
  }

  async update({ id, task }) {
    try {
      const result = await this.knexInstance(taskModel.tableName)
        .where(taskModel.primaryKey, id)
        .update(task)
        .returning(taskModel.primaryKey)
      return result[0]
    } catch (error) {
      throw new RepositoryError(error.message)
    }
  }

  async delete({ id }) {
    try {
      return await this.knexInstance(taskModel.tableName)
        .where(taskModel.primaryKey, id)
        .delete()
    } catch (error) {
      throw new RepositoryError(error.message)
    }
  }

  async exists({ options }) {
    try {
      return await exists(this.knexInstance, taskModel, options)
    } catch (error) {
      throw new RepositoryError(error.message)
    }
  }

  async count({ options }) {
    try {
      return await counts(this.knexInstance, taskModel, options)
    } catch (error) {
      throw new RepositoryError(error.message)
    }
  }
}

module.exports = TaskRepository
```

### 6. Create Input Validation Schema

Create `src/tasks/validators/schema/task.schema.js`:

```javascript
const Joi = require('joi')

const schema = {
  create: Joi.object({
    user_id: Joi.number().integer().required(),
    title: Joi.string().max(200).required(),
    description: Joi.string().allow('', null).optional(),
    status: Joi.string()
      .valid('pending', 'in_progress', 'completed')
      .optional(),
    due_date: Joi.date().iso().allow(null).optional()
  }),

  update: Joi.object({
    title: Joi.string().max(200).optional(),
    description: Joi.string().allow('', null).optional(),
    status: Joi.string()
      .valid('pending', 'in_progress', 'completed')
      .optional(),
    due_date: Joi.date().iso().allow(null).optional()
  }).min(1) // At least one field must be provided
}

module.exports = schema
```

### 7. Create Business Rules Validation

Create `src/tasks/validators/rules/task.rules.js`:

```javascript
const { ValidationError } = require('../../../lib/errors')

const taskRules = {
  taskMustExist: async ({ taskRepository }, { id }) => {
    const exists = await taskRepository.exists({
      options: {
        where: { id }
      }
    })
    if (!exists) {
      throw new ValidationError('Task not found')
    }
  },

  userMustOwnTheTask: async ({ taskRepository }, { id, userId }) => {
    const exists = await taskRepository.exists({
      options: {
        where: { id, user_id: userId }
      }
    })
    if (!exists) {
      throw new ValidationError('User does not own this task')
    }
  }
}

module.exports = taskRules
```

### 8. Create Actions (Business Logic)

Create `src/tasks/actions/task.actions.js`:

```javascript
const { ValidationError, ActionError, makeError } = require('../../lib/errors')
const schema = require('../validators/schema/task.schema')
const taskRules = require('../validators/rules/task.rules')

class TaskActions {
  constructor({ taskRepository }) {
    this.taskRepository = taskRepository
  }

  async create({ userId, task }, { projection = 'default' } = {}) {
    try {
      // Input validation
      const { error } = schema.create.validate({ ...task, user_id: userId })
      if (error) {
        throw new ValidationError(error.message)
      }

      // Create task
      const id = await this.taskRepository.create({
        task: { ...task, user_id: userId }
      })

      // Return created task
      const result = await this.taskRepository.find({
        options: {
          projection,
          where: { id }
        }
      })
      return result.data[0]
    } catch (error) {
      throw makeError(error, ActionError)
    }
  }

  async list({ userId, filters = {} }, { projection = 'default' } = {}) {
    try {
      const options = {
        projection,
        where: { user_id: userId },
        paging: {
          limit: filters.limit || 50,
          offset: filters.offset || 0
        }
      }

      // Apply status filter if provided
      if (filters.status) {
        options.where.status = filters.status
      }

      return await this.taskRepository.find({ options })
    } catch (error) {
      throw makeError(error, ActionError)
    }
  }

  async findById({ id, userId }, { projection = 'default' } = {}) {
    try {
      const {
        data: [task]
      } = await this.taskRepository.find({
        options: {
          projection,
          where: { id, user_id: userId }
        }
      })
      return task
    } catch (error) {
      throw makeError(error, ActionError)
    }
  }

  async update({ id, userId, task }, { projection = 'default' } = {}) {
    try {
      // Input validation
      const { error } = schema.update.validate(task)
      if (error) {
        throw new ValidationError(error.message)
      }

      // Verify ownership
      await taskRules.userMustOwnTheTask(
        { taskRepository: this.taskRepository },
        { id, userId }
      )

      // Update task
      await this.taskRepository.update({ id, task })

      // Return updated task
      const result = await this.taskRepository.find({
        options: {
          projection,
          where: { id }
        }
      })
      return result.data[0]
    } catch (error) {
      throw makeError(error, ActionError)
    }
  }

  async delete({ id, userId }) {
    try {
      // Verify ownership
      await taskRules.userMustOwnTheTask(
        { taskRepository: this.taskRepository },
        { id, userId }
      )

      // Delete task
      await this.taskRepository.delete({ id })
    } catch (error) {
      throw makeError(error, ActionError)
    }
  }
}

module.exports = TaskActions
```

### 9. Create Domain Container

Create `src/tasks/tasks.container.js`:

```javascript
const TaskRepository = require('./repositories/task.repository')
const TaskActions = require('./actions/task.actions')

class TasksContainer {
  constructor({ knexInstance, commonContainer }) {
    this.knexInstance = knexInstance
    this.commonContainer = commonContainer
    this.repositories = new Map()
    this.actions = new Map()
  }

  buildTaskRepository() {
    if (!this.repositories.has('task')) {
      this.repositories.set(
        'task',
        new TaskRepository({ knexInstance: this.knexInstance })
      )
    }
    return this.repositories.get('task')
  }

  buildTaskActions() {
    if (!this.actions.has('task')) {
      this.actions.set(
        'task',
        new TaskActions({ taskRepository: this.buildTaskRepository() })
      )
    }
    return this.actions.get('task')
  }
}

module.exports = TasksContainer
```

### 10. Create Transport Handler

Create `src/transport/handlers/tasks/task.handler.js`:

```javascript
const { getCurrentIsoDateTimeAsString } = require('../../../lib/date-tools')
const {
  parseIntParam,
  extractPagingOptions,
  extractSortingOptions
} = require('../../../lib/param-tools')
const {
  CreatedResponse,
  OkResponse,
  NoContentResponse,
  NotFoundResponse
} = require('../../../lib/http-responses')

class TaskHandler {
  constructor({ taskActions }) {
    this.taskActions = taskActions
  }

  /**
   * @param {import('express').Request} req
   * @param {string} userId
   */
  async create(req, userId) {
    const task = await this.taskActions.create({
      userId,
      task: {
        title: req.body.title,
        description: req.body.description,
        status: req.body.status,
        due_date: req.body.due_date,
        created_at: getCurrentIsoDateTimeAsString(),
        updated_at: getCurrentIsoDateTimeAsString()
      }
    })
    return new CreatedResponse({ data: task })
  }

  /**
   * @param {import('express').Request} req
   * @param {string} userId
   */
  async list(req, userId) {
    const tasks = await this.taskActions.list(
      {
        userId,
        filters: {
          status: req.query.status,
          limit: parseInt(req.query.limit) || 50,
          offset: parseInt(req.query.offset) || 0
        }
      },
      {
        pagingOptions: extractPagingOptions(req),
        sortingOptions: extractSortingOptions(req)
      }
    )
    return new OkResponse({ data: tasks })
  }

  /**
   * @param {import('express').Request} req
   * @param {string} userId
   */
  async findById(req, userId) {
    const task = await this.taskActions.findById({
      userId,
      id: parseIntParam(req.params.id, 'id')
    })

    if (!task) {
      return new NotFoundResponse()
    }
    return new OkResponse({ data: task })
  }

  /**
   * @param {import('express').Request} req
   * @param {string} userId
   */
  async update(req, userId) {
    const task = await this.taskActions.update({
      userId,
      id: parseIntParam(req.params.id, 'id'),
      task: {
        title: req.body.title,
        description: req.body.description,
        status: req.body.status,
        due_date: req.body.due_date,
        updated_at: getCurrentIsoDateTimeAsString()
      }
    })
    return new OkResponse({ data: task })
  }

  /**
   * @param {import('express').Request} req
   * @param {string} userId
   */
  async delete(req, userId) {
    await this.taskActions.delete({
      userId,
      id: parseIntParam(req.params.id, 'id')
    })
    return new NoContentResponse()
  }
}

module.exports = TaskHandler
```

### 11. Create Express Router

Create `src/platforms/express/tasks/routers/task.router.js`:

```javascript
const express = require('express')
const { adaptExpressJsonResponse } = require('../../adapters/response.adapter')

function taskRouter({ taskHandler }) {
  const router = express.Router()

  router.post('/', async (req, res) => {
    const response = await taskHandler.create(req, req.user.id)
    adaptExpressJsonResponse(response, res)
  })

  router.get('/', async (req, res) => {
    const response = await taskHandler.list(req, req.user.id)
    adaptExpressJsonResponse(response, res)
  })

  router.get('/:id', async (req, res) => {
    const response = await taskHandler.findById(req, req.user.id)
    adaptExpressJsonResponse(response, res)
  })

  router.patch('/:id', async (req, res) => {
    const response = await taskHandler.update(req, req.user.id)
    adaptExpressJsonResponse(response, res)
  })

  router.delete('/:id', async (req, res) => {
    const response = await taskHandler.delete(req, req.user.id)
    adaptExpressJsonResponse(response, res)
  })

  return router
}

module.exports = taskRouter
```

### 12. Create Tasks Express App

Create `src/platforms/express/tasks/tasks.app.js`:

```javascript
const TaskHandler = require('../../../transport/handlers/tasks/task.handler')
const taskRouter = require('./routers/task.router')
const { Middlewares } = require('../../../container')

module.exports = ({ expressInstance, commonContainer, container }) => {
  // Build handlers
  const taskHandler = new TaskHandler({
    taskActions: container.buildTaskActions()
  })

  // Build routers
  const router = taskRouter({ taskHandler })

  // Apply auth middleware and mount routes
  expressInstance.use(
    '/api/tasks',
    commonContainer.getMiddleware(Middlewares.auth)
  )
  expressInstance.use('/api/tasks', router)
}
```

### 13. Register Domain in Infrastructure Container

Update `src/platforms/containers.js`:

```javascript
// Add import
const TasksContainer = require('../tasks/tasks.container')

// Create container instance
const tasksContainer = new TasksContainer({ knexInstance, commonContainer })

// Add to exports
module.exports = {
  knexInstance,
  cacheClient,
  logger,
  commonContainer,
  tasksContainer // Add this
}
```

### 14. Mount Routes in Express App

Update `src/platforms/express/app.js`:

```javascript
// Add import
const tasksApp = require('./tasks/tasks.app')

// Mount routes (after existing app setup)
tasksApp({ expressInstance: app, commonContainer, container: tasksContainer })
```

### 15. Run Migrations

Apply your new domain's migrations:

```bash
npm run migrate:tasks
```

Or run all migrations:

```bash
npm run migrate
```

### 16. Test Your New Domain

**Create a task:**

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "X-Platform: web" \
  -H "X-Install-ID: test-install-123" \
  -d '{
    "title": "Complete project documentation",
    "description": "Write comprehensive docs for the scaffold template",
    "status": "in_progress",
    "due_date": "2025-11-15T00:00:00Z"
  }'
```

**List tasks:**

```bash
curl -X GET http://localhost:3000/api/tasks \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "X-Platform: web" \
  -H "X-Install-ID: test-install-123"
```

**Filter by status:**

```bash
curl -X GET "http://localhost:3000/api/tasks?status=in_progress" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "X-Platform: web" \
  -H "X-Install-ID: test-install-123"
```

## Development Workflow

### Running Tests

```bash
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run with coverage report
```

### Code Quality

```bash
npm run format        # Format code with Prettier
npm run lint          # Lint code with ESLint
npm run lint:fix      # Fix linting issues automatically
```

**Pre-commit hooks:**

Husky runs `format` and `lint` automatically before each commit.

### Working with Migrations

**Check migration status:**

```bash
npm run migrate:status        # All domains
npm run migrate:status tasks  # Specific domain
```

**Rollback migrations:**

```bash
npm run migrate:rollback tasks  # Rollback last batch for tasks domain
```

**Create new migration:**

```bash
npm run migrate:create tasks add_priority_field
```

### Database Access

**Connect to PostgreSQL:**

```bash
docker exec -it scaffold-postgres psql -U scaffold -d scaffold
```

**Useful queries:**

```sql
-- List all schemas
\dn

-- List tables in tasks schema
\dt tasks.*

-- View task data
SELECT * FROM tasks.task;
```

## Next Steps

Now that you have the basics working:

1. **Read the architecture docs** - Understand [architectural-structure.md](./architectural-structure.md) and [container-architecture.md](./container-architecture.md)

2. **Explore customizations** - Check out [recipes.md](./recipes.md) for adding OAuth, GraphQL, WebSockets, etc.

3. **Write tests** - Review [testing-guide.md](./testing-guide.md) for testing patterns

4. **Build your domains** - Follow the tasks example to create your own business domains

5. **Customize GoTrue** - Update `.env` to configure email, OAuth providers, password requirements, etc.

6. **Add more complexity** - Implement relations, aggregations, caching strategies

## Common Issues

### Docker containers won't start

**Check if ports are already in use:**

```bash
lsof -i :5431  # PostgreSQL
lsof -i :9998  # GoTrue
lsof -i :6379  # Redis
```

**Fix:** Stop conflicting services or change ports in `docker-compose.yml` and `.env`

### Migrations fail with "schema does not exist"

**Cause:** Running domain migrations before `auth` migrations

**Fix:** Always run `auth` migrations first:

```bash
npm run migrate:auth
npm run migrate:tasks
```

Or run all migrations in order:

```bash
npm run migrate
```

### Authentication returns 401 Unauthorized

**Check:**

1. JWT_SECRET in `.env` matches GoTrue configuration
2. GoTrue container is running: `docker ps | grep gotrue`
3. Access token is valid (tokens expire, get a new one)

### Can't connect to database

**Check:**

1. PostgreSQL container is running: `docker ps | grep postgres`
2. Database credentials in `.env` match `docker-compose.yml`
3. Port 5431 is accessible: `nc -zv localhost 5431`

## Resources

- [Architectural Structure](./architectural-structure.md) - Detailed architecture documentation
- [Container Architecture](./container-architecture.md) - Dependency injection patterns
- [Migration Script](../scripts/README.md) - Migration commands and usage
- [Recipes](./recipes.md) - Common customizations and extensions
- [Testing Guide](./testing-guide.md) - Testing patterns and best practices

---

_Last updated: 2025-10-28_
