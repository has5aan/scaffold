# Getting Started

A practical guide to using the scaffold template for your first project.

## Prerequisites

Before starting, ensure you have:

- **Node.js 22** installed
- **Docker and Docker Compose** installed

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
- **MinIO** (port 9000 API - 9001 Console) Object storage

### 4. Run Database Migrations

Apply all migrations (auth and example domains):

```bash
npm run migrate latest auth,example
```

**Note:** For detailed migration commands (status, rollback, create, etc.), see [Migration Script documentation](../scripts/README.md).

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
- `PUT /api/example/tags/:id` - Update a tag
- `DELETE /api/example/tags/:id` - Delete a tag

**Learn from the example:**

1. Review `src/example/actions/tag.actions.js` - See how business logic is structured
2. Check `src/example/repositories/tag.repository.js` - Understand data access patterns
3. Explore `src/platforms/express/example/routers/tag.router.js` - See how routes are defined
4. Study `src/transport/handlers/example/tag.handler.js` - Learn transport layer patterns

## Creating Your First Domain

To create a new domain, follow the structure and patterns from the `example` domain. Here are all the components you need to implement:

**Reference the `example` domain for each layer:**

| Component               | Purpose                                | Example File                                                       |
| ----------------------- | -------------------------------------- | ------------------------------------------------------------------ |
| **Model**               | Data structure, projections, relations | `src/example/models/tag.model.js`                                  |
| **Repository**          | Data access layer                      | `src/example/repositories/tag.repository.js`                       |
| **Actions**             | Business logic orchestration           | `src/example/actions/tag.actions.js`                               |
| **Validators (Schema)** | Input validation with Joi              | `src/example/validators/schema/tag.schema.js`                      |
| **Validators (Rules)**  | Business rule validation               | `src/example/validators/rules/tag.rules.js`                        |
| **Container**           | Dependency injection                   | `src/example/example.container.js`                                 |
| **Handler**             | HTTP request handling                  | `src/transport/handlers/example/tag.handler.js`                    |
| **Router**              | Route definitions                      | `src/platforms/express/example/routers/tag.router.js`              |
| **App Integration**     | Express setup and mounting             | `src/platforms/express/example/example.app.js`                     |
| **Migrations**          | Database schema                        | `src/example/migrations/example-01-schema.js`, `example-02-tag.js` |

**Steps to create your domain:**

1. Create domain directory structure: `src/yourdomainname/{actions,models,repositories,validators/schema,validators/rules,migrations}`
2. Copy and adapt files from the example domain for each component
3. Update `src/platforms/containers.js` to register your domain container
4. Update `src/platforms/express/app.js` to mount your domain routes
5. Run migrations: `npm run migrate latest yourdomainname`

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

For all migration commands and usage examples, see the [Migration Script documentation](../scripts/README.md).

**Quick reference:**

```bash
npm run migrate latest auth,example    # Apply latest migrations
npm run migrate status auth,example    # Check migration status
npm run migrate rollback auth,example  # Rollback last batch
npm run migrate create <domain> <table>  # Create new migration
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

-- List tables in example schema
\dt example.*

-- View example data
SELECT * FROM example.tag;
```

## Next Steps

Now that you have the basics working:

1. **Read the architecture docs** - Understand [architectural-structure.md](./architectural-structure.md) and [container-architecture.md](./container-architecture.md)

2. **Explore customizations** - Check out [recipes.md](./recipes.md) for adding OAuth, GraphQL, WebSockets, etc.

3. **Write tests** - Run `npm test` to verify your implementations

4. **Build your domains** - Follow the example domain to create your own business domains

5. **Customize GoTrue** - Update `.env` to configure email, OAuth providers, password requirements, etc.

6. **Add more complexity** - Implement relations, aggregations, caching strategies

## Common Issues

### Docker containers won't start

**Check if ports are already in use:**

```bash
lsof -i :5431  # PostgreSQL
lsof -i :9998  # GoTrue
lsof -i :6379  # Redis
lsof -i :9000  # MinIO API
lsof -i :9001  # MinIO Console
```

**Fix:** Stop conflicting services or change ports in `docker-compose.yml` and `.env`

### Migrations fail with "schema does not exist"

**Cause:** Running domain migrations before `auth` migrations

**Fix:** Always run `auth` migrations first:

```bash
npm run migrate latest auth,example
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
- [Migration and Seed Scripts](../scripts/README.md) - Complete migration and seed command reference
- [Recipes](./recipes.md) - Common customizations and extensions
