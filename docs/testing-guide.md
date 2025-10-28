# Testing Guide

A comprehensive guide to testing in the scaffold architecture, covering all layers from repositories to API endpoints.

## Testing Philosophy

This scaffold emphasizes:

- **Layer-specific testing**: Test each layer independently with appropriate mocking
- **Integration tests**: Verify layers work together correctly
- **Database-agnostic tests**: Tests run against both PostgreSQL and SQLite
- **Clean test data**: Use helpers to set up and tear down test data properly

## Prerequisites

The project uses:

- **Jest** - Test runner and assertion library
- **Supertest** - HTTP assertion library for API testing
- **Test helpers** - Located in `test/setup.js` for database and schema testing

## Test Structure

Tests should live alongside the code they test:

```
src/
  example/
    actions/
      tag.actions.js
      tag.actions.test.js     # Action tests
    models/
      tag.model.js
      tag.model.test.js       # Model tests (if needed)
    repositories/
      tag.repository.js
      tag.repository.test.js  # Repository tests
    handlers/
      tag.handler.js
      tag.handler.test.js     # Handler tests
    routers/
      tag.router.js
      tag.router.test.js      # Integration tests
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Testing Repositories

Repositories interact directly with the database, so tests should use a real database connection.

### Example: Testing a Repository

```javascript
// src/example/repositories/tag.repository.test.js
const { makeDb, cleanupTestDatabase, insertTestData } = require('../../../test/setup')
const tagModel = require('../models/tag.model')
const TagRepository = require('./tag.repository')

describe('TagRepository', () => {
  let db
  let tagRepository
  const userId = '123e4567-e89b-12d3-a456-426614174000'

  beforeAll(async () => {
    // Create database and run migrations
    db = await makeDb(
      {
        client: 'sqlite3',
        connection: { filename: ':memory:' },
        useNullAsDefault: true
      },
      { migrate: true }
    )

    tagRepository = new TagRepository({ db })
  })

  afterAll(async () => {
    await cleanupTestDatabase(db, {
      client: 'sqlite3',
      connection: { filename: ':memory:' }
    })
  })

  beforeEach(async () => {
    // Insert test data before each test
    await insertTestData(db, {
      auth: {
        users: [{ id: userId, email: 'test@example.com', role: 'user' }]
      },
      example: {
        tag: [
          { id: 1, user_id: userId, name: 'JavaScript' },
          { id: 2, user_id: userId, name: 'Node.js' }
        ]
      }
    })
  })

  afterEach(async () => {
    // Clean database after each test
    await db(tagModel.tableName).truncate()
  })

  describe('find', () => {
    it('should find all tags for a user', async () => {
      const result = await tagRepository.find({
        options: {
          projection: 'default',
          where: { user_id: userId }
        }
      })

      expect(result.data).toHaveLength(2)
      expect(result.data[0]).toHaveProperty('id', 1)
      expect(result.data[0]).toHaveProperty('name', 'JavaScript')
      expect(result.data[1]).toHaveProperty('id', 2)
      expect(result.data[1]).toHaveProperty('name', 'Node.js')
    })

    it('should find a specific tag by id', async () => {
      const result = await tagRepository.find({
        options: {
          projection: 'default',
          where: { id: 1, user_id: userId }
        }
      })

      expect(result.data).toHaveLength(1)
      expect(result.data[0]).toHaveProperty('name', 'JavaScript')
    })

    it('should return empty array when no tags found', async () => {
      const result = await tagRepository.find({
        options: {
          projection: 'default',
          where: { user_id: 'non-existent' }
        }
      })

      expect(result.data).toHaveLength(0)
    })
  })

  describe('create', () => {
    it('should create a new tag', async () => {
      const newTag = {
        user_id: userId,
        name: 'TypeScript'
      }

      const id = await tagRepository.create({ tag: newTag })

      expect(id).toBeDefined()

      // Verify the tag was created
      const result = await tagRepository.find({
        options: {
          projection: 'default',
          where: { id }
        }
      })

      expect(result.data).toHaveLength(1)
      expect(result.data[0]).toHaveProperty('name', 'TypeScript')
    })

    it('should throw RepositoryError on database error', async () => {
      // Try to insert with invalid data
      await expect(
        tagRepository.create({
          tag: { name: null } // missing required user_id
        })
      ).rejects.toThrow()
    })
  })

  describe('update', () => {
    it('should update an existing tag', async () => {
      const updated = await tagRepository.update({
        tag: { name: 'JavaScript ES6' },
        where: { id: 1, user_id: userId }
      })

      expect(updated).toBe(1)

      // Verify the update
      const result = await tagRepository.find({
        options: {
          projection: 'default',
          where: { id: 1 }
        }
      })

      expect(result.data[0]).toHaveProperty('name', 'JavaScript ES6')
    })

    it('should return 0 when no tag matches', async () => {
      const updated = await tagRepository.update({
        tag: { name: 'New Name' },
        where: { id: 999, user_id: userId }
      })

      expect(updated).toBe(0)
    })
  })

  describe('delete', () => {
    it('should delete a tag', async () => {
      const deleted = await tagRepository.delete({
        where: { id: 1, user_id: userId }
      })

      expect(deleted).toBe(1)

      // Verify deletion
      const result = await tagRepository.find({
        options: {
          projection: 'default',
          where: { id: 1 }
        }
      })

      expect(result.data).toHaveLength(0)
    })

    it('should return 0 when no tag matches', async () => {
      const deleted = await tagRepository.delete({
        where: { id: 999, user_id: userId }
      })

      expect(deleted).toBe(0)
    })
  })
})
```

### Key Points for Repository Tests

1. **Use real database**: Repositories need actual database interactions
2. **Run migrations**: Use `makeDb` with `migrate: true`
3. **Clean up properly**: Use `cleanupTestDatabase` in `afterAll`
4. **Insert test data**: Use `insertTestData` helper for consistent test data
5. **Truncate tables**: Clean data between tests with `truncate()`
6. **Verify knex-tools results**: Check `result.data` for query results

## Testing Actions

Actions contain business logic and should be tested with mocked repositories.

### Example: Testing Actions

```javascript
// src/example/actions/tag.actions.test.js
const TagActions = require('./tag.actions')
const { ValidationError, ActionError } = require('../../lib/errors')

describe('TagActions', () => {
  let tagActions
  let mockTagRepository
  const userId = '123e4567-e89b-12d3-a456-426614174000'

  beforeEach(() => {
    // Create a mock repository
    mockTagRepository = {
      find: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }

    tagActions = new TagActions({ tagRepository: mockTagRepository })
  })

  describe('create', () => {
    it('should create a tag successfully', async () => {
      const newTag = { name: 'JavaScript' }
      const createdId = 1

      // Mock repository responses
      mockTagRepository.create.mockResolvedValue(createdId)
      mockTagRepository.find.mockResolvedValue({
        data: [{ id: createdId, user_id: userId, name: 'JavaScript' }]
      })

      const result = await tagActions.create(
        { userId, tag: newTag },
        { projection: 'default' }
      )

      expect(result).toEqual({
        id: createdId,
        user_id: userId,
        name: 'JavaScript'
      })
      expect(mockTagRepository.create).toHaveBeenCalledWith({
        tag: { ...newTag, user_id: userId }
      })
      expect(mockTagRepository.find).toHaveBeenCalledWith({
        options: { projection: 'default', where: { id: createdId } }
      })
    })

    it('should throw ValidationError for invalid data', async () => {
      const invalidTag = { name: '' } // Empty name

      await expect(
        tagActions.create({ userId, tag: invalidTag })
      ).rejects.toThrow(ValidationError)

      expect(mockTagRepository.create).not.toHaveBeenCalled()
    })

    it('should wrap repository errors in ActionError', async () => {
      const newTag = { name: 'JavaScript' }
      mockTagRepository.create.mockRejectedValue(
        new Error('Database connection failed')
      )

      await expect(
        tagActions.create({ userId, tag: newTag })
      ).rejects.toThrow(ActionError)
    })
  })

  describe('findById', () => {
    it('should find a tag by id', async () => {
      const tagId = 1
      const expectedTag = { id: tagId, user_id: userId, name: 'JavaScript' }

      mockTagRepository.find.mockResolvedValue({
        data: [expectedTag]
      })

      const result = await tagActions.findById(
        { userId, id: tagId },
        { projection: 'default' }
      )

      expect(result).toEqual(expectedTag)
      expect(mockTagRepository.find).toHaveBeenCalledWith({
        options: {
          projection: 'default',
          where: { id: tagId, user_id: userId }
        }
      })
    })

    it('should return undefined when tag not found', async () => {
      mockTagRepository.find.mockResolvedValue({ data: [] })

      const result = await tagActions.findById(
        { userId, id: 999 },
        { projection: 'default' }
      )

      expect(result).toBeUndefined()
    })
  })

  describe('findAll', () => {
    it('should return all tags for a user', async () => {
      const expectedTags = [
        { id: 1, user_id: userId, name: 'JavaScript' },
        { id: 2, user_id: userId, name: 'Node.js' }
      ]

      mockTagRepository.find.mockResolvedValue({ data: expectedTags })

      const result = await tagActions.findAll(
        { userId },
        { projection: 'summary' }
      )

      expect(result).toEqual({ data: expectedTags })
      expect(mockTagRepository.find).toHaveBeenCalledWith({
        options: {
          projection: 'summary',
          where: { user_id: userId }
        }
      })
    })
  })

  describe('update', () => {
    it('should update a tag successfully', async () => {
      const tagId = 1
      const updates = { name: 'JavaScript ES6' }

      mockTagRepository.update.mockResolvedValue(1)
      mockTagRepository.find.mockResolvedValue({
        data: [{ id: tagId, user_id: userId, name: 'JavaScript ES6' }]
      })

      const result = await tagActions.update(
        { userId, id: tagId, tag: updates },
        { projection: 'default' }
      )

      expect(result).toEqual({
        id: tagId,
        user_id: userId,
        name: 'JavaScript ES6'
      })
      expect(mockTagRepository.update).toHaveBeenCalledWith({
        tag: updates,
        where: { id: tagId, user_id: userId }
      })
    })

    it('should throw ValidationError for invalid updates', async () => {
      const invalidUpdates = { name: '' }

      await expect(
        tagActions.update({ userId, id: 1, tag: invalidUpdates })
      ).rejects.toThrow(ValidationError)

      expect(mockTagRepository.update).not.toHaveBeenCalled()
    })
  })

  describe('delete', () => {
    it('should delete a tag successfully', async () => {
      const tagId = 1
      mockTagRepository.delete.mockResolvedValue(1)

      const result = await tagActions.delete({ userId, id: tagId })

      expect(result).toBe(1)
      expect(mockTagRepository.delete).toHaveBeenCalledWith({
        where: { id: tagId, user_id: userId }
      })
    })

    it('should return 0 when tag not found', async () => {
      mockTagRepository.delete.mockResolvedValue(0)

      const result = await tagActions.delete({ userId, id: 999 })

      expect(result).toBe(0)
    })
  })
})
```

### Key Points for Action Tests

1. **Mock repositories**: Use `jest.fn()` to mock repository methods
2. **Test validation**: Verify validation rules trigger `ValidationError`
3. **Test error wrapping**: Ensure repository errors become `ActionError`
4. **Mock knex-tools structure**: Return `{ data: [...] }` from mocked finds
5. **Verify calls**: Use `toHaveBeenCalledWith` to verify correct parameters
6. **Test edge cases**: Empty results, missing data, invalid input

## Testing Handlers

Handlers bridge actions and HTTP requests. Test with mocked actions and real request/response objects.

### Example: Testing Handlers

```javascript
// src/example/handlers/tag.handler.test.js
const TagHandler = require('./tag.handler')

describe('TagHandler', () => {
  let tagHandler
  let mockTagActions
  let mockReq
  let mockRes
  const userId = '123e4567-e89b-12d3-a456-426614174000'

  beforeEach(() => {
    // Mock actions
    mockTagActions = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }

    tagHandler = new TagHandler({ tagActions: mockTagActions })

    // Mock Express request and response
    mockReq = {
      body: {},
      params: {},
      query: {}
    }

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn()
    }
  })

  describe('create', () => {
    it('should create a tag and return 201', async () => {
      const newTag = { name: 'JavaScript' }
      const createdTag = { id: 1, user_id: userId, name: 'JavaScript' }

      mockReq.body = newTag
      mockTagActions.create.mockResolvedValue(createdTag)

      await tagHandler.create(mockReq, userId)

      expect(mockTagActions.create).toHaveBeenCalledWith(
        { userId, tag: newTag },
        { projection: 'default' }
      )
      expect(mockRes.status).toHaveBeenCalledWith(201)
      expect(mockRes.json).toHaveBeenCalledWith(createdTag)
    })

    it('should handle validation errors with 400', async () => {
      const invalidTag = { name: '' }
      mockReq.body = invalidTag

      const error = new Error('Validation failed')
      error.name = 'ValidationError'
      mockTagActions.create.mockRejectedValue(error)

      await tagHandler.create(mockReq, userId)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Validation failed'
      })
    })

    it('should handle server errors with 500', async () => {
      mockReq.body = { name: 'JavaScript' }
      mockTagActions.create.mockRejectedValue(new Error('Database error'))

      await tagHandler.create(mockReq, userId)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to create tag'
      })
    })
  })

  describe('findById', () => {
    it('should return a tag when found', async () => {
      const tag = { id: 1, user_id: userId, name: 'JavaScript' }
      mockReq.params = { id: '1' }
      mockTagActions.findById.mockResolvedValue(tag)

      await tagHandler.findById(mockReq, userId)

      expect(mockTagActions.findById).toHaveBeenCalledWith(
        { userId, id: 1 },
        { projection: 'default' }
      )
      expect(mockRes.json).toHaveBeenCalledWith(tag)
    })

    it('should return 404 when tag not found', async () => {
      mockReq.params = { id: '999' }
      mockTagActions.findById.mockResolvedValue(undefined)

      await tagHandler.findById(mockReq, userId)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Tag not found'
      })
    })
  })

  describe('findAll', () => {
    it('should return all tags', async () => {
      const tags = {
        data: [
          { id: 1, name: 'JavaScript' },
          { id: 2, name: 'Node.js' }
        ]
      }
      mockTagActions.findAll.mockResolvedValue(tags)

      await tagHandler.findAll(mockReq, userId)

      expect(mockTagActions.findAll).toHaveBeenCalledWith(
        { userId },
        { projection: 'summary' }
      )
      expect(mockRes.json).toHaveBeenCalledWith(tags)
    })
  })

  describe('update', () => {
    it('should update a tag and return updated data', async () => {
      const updates = { name: 'JavaScript ES6' }
      const updatedTag = { id: 1, user_id: userId, name: 'JavaScript ES6' }

      mockReq.params = { id: '1' }
      mockReq.body = updates
      mockTagActions.update.mockResolvedValue(updatedTag)

      await tagHandler.update(mockReq, userId)

      expect(mockTagActions.update).toHaveBeenCalledWith(
        { userId, id: 1, tag: updates },
        { projection: 'default' }
      )
      expect(mockRes.json).toHaveBeenCalledWith(updatedTag)
    })
  })

  describe('delete', () => {
    it('should delete a tag and return 204', async () => {
      mockReq.params = { id: '1' }
      mockTagActions.delete.mockResolvedValue(1)

      await tagHandler.delete(mockReq, userId)

      expect(mockTagActions.delete).toHaveBeenCalledWith({ userId, id: 1 })
      expect(mockRes.status).toHaveBeenCalledWith(204)
      expect(mockRes.send).toHaveBeenCalled()
    })

    it('should return 404 when tag not found', async () => {
      mockReq.params = { id: '999' }
      mockTagActions.delete.mockResolvedValue(0)

      await tagHandler.delete(mockReq, userId)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Tag not found'
      })
    })
  })
})
```

### Key Points for Handler Tests

1. **Mock actions**: Handlers should not call real business logic
2. **Mock Express objects**: Create `mockReq` and `mockRes` with necessary properties
3. **Test HTTP responses**: Verify status codes and response bodies
4. **Test error handling**: Ensure ValidationError → 400, ActionError → 500
5. **Verify parameter parsing**: Check that IDs are parsed from strings to numbers

## Testing Routers (Integration Tests)

Router tests verify the full HTTP layer, including middleware and route handling.

### Example: Testing Routers

```javascript
// src/example/routers/tag.router.test.js
const request = require('supertest')
const { createTestExpressApp, makeDb, cleanupTestDatabase, insertTestData } = require('../../../test/setup')
const { mockAuthenticateToken } = require('../../../test/mocks/middleware/auth.middleware.mock')
const { createContainer } = require('../../lib/container')

describe('Tag Router Integration', () => {
  let app
  let db
  let container
  const userId = '123e4567-e89b-12d3-a456-426614174000'

  beforeAll(async () => {
    // Create database and run migrations
    db = await makeDb(
      {
        client: 'sqlite3',
        connection: { filename: ':memory:' },
        useNullAsDefault: true
      },
      { migrate: true }
    )

    // Create container with real dependencies
    container = createContainer({ db })

    // Create Express app
    app = createTestExpressApp()

    // Add mock authentication middleware
    app.use(mockAuthenticateToken)

    // Mount the tag router
    const tagRouter = container.resolve('tagRouter')
    app.use('/api/tags', tagRouter)
  })

  afterAll(async () => {
    await cleanupTestDatabase(db, {
      client: 'sqlite3',
      connection: { filename: ':memory:' }
    })
  })

  beforeEach(async () => {
    // Insert test data
    await insertTestData(db, {
      auth: {
        users: [{ id: userId, email: 'test@example.com', role: 'user' }]
      },
      example: {
        tag: [
          { id: 1, user_id: userId, name: 'JavaScript' },
          { id: 2, user_id: userId, name: 'Node.js' }
        ]
      }
    })
  })

  afterEach(async () => {
    // Clean database
    const tagModel = require('../models/tag.model')
    await db(tagModel.tableName).truncate()
  })

  describe('GET /api/tags', () => {
    it('should return all tags for authenticated user', async () => {
      const response = await request(app)
        .get('/api/tags')
        .set('Authorization', `Bearer ${userId}`)
        .expect(200)

      expect(response.body.data).toHaveLength(2)
      expect(response.body.data[0]).toHaveProperty('name', 'JavaScript')
      expect(response.body.data[1]).toHaveProperty('name', 'Node.js')
    })

    it('should return 401 when not authenticated', async () => {
      await request(app)
        .get('/api/tags')
        .expect(401)
    })
  })

  describe('GET /api/tags/:id', () => {
    it('should return a specific tag', async () => {
      const response = await request(app)
        .get('/api/tags/1')
        .set('Authorization', `Bearer ${userId}`)
        .expect(200)

      expect(response.body).toHaveProperty('id', 1)
      expect(response.body).toHaveProperty('name', 'JavaScript')
    })

    it('should return 404 for non-existent tag', async () => {
      await request(app)
        .get('/api/tags/999')
        .set('Authorization', `Bearer ${userId}`)
        .expect(404)
    })
  })

  describe('POST /api/tags', () => {
    it('should create a new tag', async () => {
      const newTag = { name: 'TypeScript' }

      const response = await request(app)
        .post('/api/tags')
        .set('Authorization', `Bearer ${userId}`)
        .send(newTag)
        .expect(201)

      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('name', 'TypeScript')
      expect(response.body).toHaveProperty('user_id', userId)
    })

    it('should return 400 for invalid data', async () => {
      const invalidTag = { name: '' }

      await request(app)
        .post('/api/tags')
        .set('Authorization', `Bearer ${userId}`)
        .send(invalidTag)
        .expect(400)
    })
  })

  describe('PUT /api/tags/:id', () => {
    it('should update an existing tag', async () => {
      const updates = { name: 'JavaScript ES6' }

      const response = await request(app)
        .put('/api/tags/1')
        .set('Authorization', `Bearer ${userId}`)
        .send(updates)
        .expect(200)

      expect(response.body).toHaveProperty('name', 'JavaScript ES6')
    })

    it('should return 404 for non-existent tag', async () => {
      const updates = { name: 'New Name' }

      await request(app)
        .put('/api/tags/999')
        .set('Authorization', `Bearer ${userId}`)
        .send(updates)
        .expect(404)
    })
  })

  describe('DELETE /api/tags/:id', () => {
    it('should delete a tag', async () => {
      await request(app)
        .delete('/api/tags/1')
        .set('Authorization', `Bearer ${userId}`)
        .expect(204)

      // Verify deletion
      await request(app)
        .get('/api/tags/1')
        .set('Authorization', `Bearer ${userId}`)
        .expect(404)
    })

    it('should return 404 for non-existent tag', async () => {
      await request(app)
        .delete('/api/tags/999')
        .set('Authorization', `Bearer ${userId}`)
        .expect(404)
    })
  })
})
```

### Key Points for Router Tests

1. **Use supertest**: Makes HTTP assertions clean and readable
2. **Use real dependencies**: Container resolves actual instances
3. **Mock only external services**: Auth, rate limiting, etc.
4. **Test full HTTP flow**: Request → middleware → handler → response
5. **Verify status codes**: 200, 201, 400, 401, 404, 500
6. **Test authentication**: Both authenticated and unauthenticated requests

## Testing Schema Validation

The test setup provides helpers for testing Joi schemas systematically.

### Example: Testing Schemas

```javascript
// src/example/schemas/tag.schema.test.js
const { executeSchemaFailureTestCases, executeSchemaSuccessTestCases } = require('../../../test/setup')
const schema = require('./tag.schema')

describe('Tag Schema', () => {
  describe('create validation', () => {
    describe('Success cases', () => {
      executeSchemaSuccessTestCases(schema.create, {
        name: [
          {
            name: 'name is provided',
            data: { name: 'JavaScript' }
          },
          {
            name: 'name has spaces',
            data: { name: 'JavaScript ES6' }
          },
          {
            name: 'name is exactly 3 characters',
            data: { name: 'CSS' }
          },
          {
            name: 'name is 50 characters',
            data: { name: 'A'.repeat(50) }
          }
        ]
      })
    })

    describe('Failure cases', () => {
      executeSchemaFailureTestCases(schema.create, {
        name: [
          {
            name: 'name is missing',
            data: {},
            expected: '"name" is required'
          },
          {
            name: 'name is empty string',
            data: { name: '' },
            expected: '"name" is not allowed to be empty'
          },
          {
            name: 'name is too short',
            data: { name: 'AB' },
            expected: '"name" length must be at least 3 characters long'
          },
          {
            name: 'name is too long',
            data: { name: 'A'.repeat(51) },
            expected: '"name" length must be less than or equal to 50 characters long'
          },
          {
            name: 'name is not a string',
            data: { name: 123 },
            expected: '"name" must be a string'
          }
        ]
      })
    })
  })

  describe('update validation', () => {
    describe('Success cases', () => {
      executeSchemaSuccessTestCases(schema.update, {
        name: [
          {
            name: 'name is provided',
            data: { name: 'TypeScript' }
          },
          {
            name: 'name is not provided (optional)',
            data: {}
          }
        ]
      })
    })

    describe('Failure cases', () => {
      executeSchemaFailureTestCases(schema.update, {
        name: [
          {
            name: 'name is empty string',
            data: { name: '' },
            expected: '"name" is not allowed to be empty'
          },
          {
            name: 'name is too short',
            data: { name: 'AB' },
            expected: '"name" length must be at least 3 characters long'
          }
        ]
      })
    })
  })
})
```

### Key Points for Schema Tests

1. **Use helper functions**: `executeSchemaSuccessTestCases` and `executeSchemaFailureTestCases`
2. **Organize by property**: Group test cases by the field being validated
3. **Test boundaries**: Minimum length, maximum length, edge cases
4. **Test types**: String, number, boolean, array, object
5. **Test required vs optional**: Verify required fields fail when missing

## Testing with the Container

The DI container makes testing easy by allowing dependency injection.

### Example: Resolving Dependencies in Tests

```javascript
const { createContainer } = require('../../lib/container')
const { makeDb, cleanupTestDatabase } = require('../../../test/setup')

describe('Container Integration', () => {
  let db
  let container

  beforeAll(async () => {
    db = await makeDb(
      {
        client: 'sqlite3',
        connection: { filename: ':memory:' },
        useNullAsDefault: true
      },
      { migrate: true }
    )

    // Create container with real database
    container = createContainer({ db })
  })

  afterAll(async () => {
    await cleanupTestDatabase(db, {
      client: 'sqlite3',
      connection: { filename: ':memory:' }
    })
  })

  it('should resolve tagRepository', () => {
    const tagRepository = container.resolve('tagRepository')
    expect(tagRepository).toBeDefined()
    expect(tagRepository.find).toBeDefined()
  })

  it('should resolve tagActions', () => {
    const tagActions = container.resolve('tagActions')
    expect(tagActions).toBeDefined()
    expect(tagActions.create).toBeDefined()
  })

  it('should resolve tagHandler', () => {
    const tagHandler = container.resolve('tagHandler')
    expect(tagHandler).toBeDefined()
    expect(tagHandler.create).toBeDefined()
  })

  it('should resolve tagRouter', () => {
    const tagRouter = container.resolve('tagRouter')
    expect(tagRouter).toBeDefined()
  })

  it('should resolve dependencies correctly', () => {
    const tagActions = container.resolve('tagActions')
    const tagRepository = container.resolve('tagRepository')

    // Verify that actions received the repository
    expect(tagActions.tagRepository).toBe(tagRepository)
  })
})
```

## Testing Strategies

### Unit Tests

**What to test:**
- Repositories: Database interactions, query building
- Actions: Business logic, validation, error handling
- Handlers: Request/response handling, error mapping

**What to mock:**
- External dependencies (repositories in actions, actions in handlers)
- Database connections (only in unit tests, not repository tests)

### Integration Tests

**What to test:**
- Routers: Full HTTP flow with real dependencies
- End-to-end flows: Create → Read → Update → Delete

**What to mock:**
- External services (email, storage, payment APIs)
- Authentication (use mock middleware)

### Test Data Management

**Best practices:**
- Use `insertTestData` for consistent setup
- Clean data between tests with `truncate()`
- Use realistic UUIDs for user IDs
- Set up relationships properly (users before tags/bookmarks)

## Common Testing Patterns

### Testing Async Errors

```javascript
it('should handle async errors', async () => {
  mockRepository.find.mockRejectedValue(new Error('Connection failed'))

  await expect(
    actions.findAll({ userId })
  ).rejects.toThrow(ActionError)
})
```

### Testing Pagination

```javascript
it('should return paginated results', async () => {
  const result = await tagActions.findAll(
    { userId },
    {
      projection: 'summary',
      limit: 10,
      offset: 0
    }
  )

  expect(result.data).toHaveLength(10)
  expect(result.metadata).toHaveProperty('total')
  expect(result.metadata).toHaveProperty('limit', 10)
})
```

### Testing Relations

```javascript
it('should load bookmark with tags', async () => {
  const result = await bookmarkActions.findById(
    { userId, id: 1 },
    {
      projection: 'default',
      relations: ['tags']
    }
  )

  expect(result.tags).toBeDefined()
  expect(result.tags.data).toHaveLength(2)
})
```

## Running Tests Against PostgreSQL

By default, tests use SQLite for speed. To test against PostgreSQL:

```javascript
const db = await makeDb(
  {
    client: 'pg',
    connection: {
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'postgres',
      database: 'scaffold_test'
    }
  },
  { migrate: true }
)
```

The test helpers automatically:
- Create unique test databases per worker
- Run migrations
- Clean up after tests
- Handle PostgreSQL-specific features (schemas, sequences)

## Debugging Tests

### Run specific test file

```bash
npm test -- src/example/actions/tag.actions.test.js
```

### Run specific test suite

```bash
npm test -- -t "TagActions create"
```

### Show console.log output

```bash
npm test -- --verbose
```

### Run with debugger

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Best Practices

1. **Test behavior, not implementation**: Focus on what the code does, not how
2. **Keep tests isolated**: Each test should be independent
3. **Use descriptive names**: Test names should explain what's being tested
4. **Follow AAA pattern**: Arrange, Act, Assert
5. **Mock external dependencies**: Only test your code, not third-party libraries
6. **Clean up properly**: Use `afterEach` and `afterAll` hooks
7. **Test edge cases**: Empty arrays, null values, invalid input
8. **Maintain test quality**: Treat test code with same care as production code

## Summary

This guide covered:

- Testing repositories with real databases
- Testing actions with mocked repositories
- Testing handlers with mocked actions
- Integration testing routers with supertest
- Testing schema validation systematically
- Using the container for dependency injection in tests
- Common testing patterns and best practices

With these patterns, you can build a comprehensive test suite that ensures your application works correctly at every layer.
