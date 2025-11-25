# OpenAPI Documentation Guide

This guide explains how to organize and maintain OpenAPI/Swagger documentation in this project.

## Directory Structure

The OpenAPI specification is organized by domain, following the same structure as the codebase:

```
src/openapi/
├── openapi.yaml                    # Main OpenAPI specification
├── components/
│   └── schemas/
│       ├── auth/
│       │   └── auth.yaml          # Auth domain schemas (User, AuthResponse, Error)
│       └── example/
│           └── tag.yaml           # Example domain schemas (Tag, TagCreate, TagUpdate)
└── paths/
    ├── auth/
    │   └── auth.yaml               # Auth domain endpoints (GoTrue)
    └── example/
        └── tags.yaml               # Example domain endpoints (Tags CRUD)
```

## Main Specification File

**Location:** `src/openapi/openapi.yaml`

This file contains:

- OpenAPI version and API metadata
- Global server definitions
- Tag definitions (with domain prefixes: `auth/Authentication`, `example/Tags`)
- Security schemes (Bearer JWT)

```

## Schema Organization

### Domain-Based Structure

Schemas are organized by domain in `src/openapi/components/schemas/{domain}/`:

- **Auth domain:** `components/schemas/auth/auth.yaml`
  - Contains: `User`, `AuthResponse`, `Error`

- **Example domain:** `components/schemas/example/tag.yaml`
  - Contains: `Tag`, `TagCreate`, `TagUpdate`

### Adding New Schemas

**For an existing domain:**
1. Edit the domain's schema file: `src/openapi/components/schemas/{domain}/{schema}.yaml`
2. Add your schema definition at the root level

**For a new domain:**
1. Create directory: `src/openapi/components/schemas/{domain}/`
2. Create schema file: `src/openapi/components/schemas/{domain}/{resource}.yaml`
3. Update `swagger.config.js` to load the new schema file
```

## Path Organization

### Domain-Based Structure

Paths are organized by domain in `src/openapi/paths/{domain}/`:

- **Auth domain:** `paths/auth/auth.yaml`
  - Contains: `/signup`, `/token`, `/user`, `/logout`, `/verify`, `/recover`
- **Example domain:** `paths/example/tags.yaml`
  - Contains: `/api/example/tags` (GET, POST), `/api/example/tags/{id}` (GET, PUT, DELETE)

### Adding New Paths

**For an existing domain:**

1. Edit the domain's path file: `src/openapi/paths/{domain}/{resource}.yaml`
2. Add your endpoint definitions under the `paths:` key

**For a new domain:**

1. Create directory: `src/openapi/paths/{domain}/`
2. Create path file: `src/openapi/paths/{domain}/{resource}.yaml`
3. Update `swagger.config.js` to load the new path file

**Example path file structure:**

```yaml
paths:
  /api/example/tags:
    post:
      servers:
        - url: ${API_BASE_URL:-http://localhost:3000}
      tags:
        - example/Tags
      summary: Create a new tag
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TagCreate'
      responses:
        '201':
          description: Tag created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Tag'
```

## Server Configuration

### Per-Endpoint Servers

Each endpoint should specify its target server using the `servers` property:

- **Auth endpoints:** Always use GoTrue server

  ```yaml
  servers:
    - url: ${GOTRUE_URL:-http://localhost:9999}
  ```

- **API endpoints:** Always use main API server
  ```yaml
  servers:
    - url: ${API_BASE_URL:-http://localhost:3000}
  ```

This ensures endpoints always target the correct server, regardless of the global server selector in Swagger UI.

## Tag Naming Convention

Tags use domain prefixes to organize endpoints:

- Format: `{domain}/{ResourceName}`
- Examples:
  - `auth/Authentication` - Auth domain endpoints
  - `example/Tags` - Example domain tag endpoints

**Adding a new tag:**

1. Add tag definition in `openapi.yaml`:
   ```yaml
   tags:
     - name: {domain}/{ResourceName}
       description: Description of the endpoints
   ```
2. Use the tag in your path definitions:
   ```yaml
   tags:
     - {domain}/{ResourceName}
   ```

## Configuration

**Location:** `src/platforms/express/swagger.config.js`

This file:

- Loads and merges all schema files from domain folders
- Loads and merges all path files from domain folders
- Replaces environment variables (e.g., `${API_BASE_URL:-http://localhost:3000}`)
- Exports the complete OpenAPI specification

**Adding a new domain to the config:**

```javascript
// Load schema
const newDomainSchemasPath = path.join(
  __dirname,
  '../../openapi/components/schemas/newdomain/resource.yaml'
)
const newDomainSchemas = yaml.load(newDomainSchemasPath)

// Load paths
const newDomainPathsPath = path.join(
  __dirname,
  '../../openapi/paths/newdomain/resource.yaml'
)
const newDomainPaths = yaml.load(newDomainPathsPath)

// Merge into existing
const allSchemas = {
  ...authSchemas,
  ...exampleSchemas,
  ...newDomainSchemas // Add here
}

swaggerSpec.paths = {
  ...authPaths.paths,
  ...exampleTagsPaths.paths,
  ...newDomainPaths.paths // Add here
}
```

## Accessing Documentation

- **Swagger UI:** `http://localhost:3000/api-docs`
- **OpenAPI JSON:** `http://localhost:3000/api-docs.json`

## Best Practices

1. **Domain Organization:** Keep schemas and paths organized by domain
2. **File Naming:** Use lowercase, descriptive names (e.g., `tag.yaml`, `user.yaml`)
3. **Server Overrides:** Always specify `servers` for each endpoint
4. **Tag Prefixes:** Use domain prefixes in tag names for clarity
5. **Schema Reuse:** Reference schemas using `$ref: '#/components/schemas/SchemaName'`
6. **Environment Variables:** Use `${VAR:-default}` pattern for configurable URLs

## Adding a Complete New Domain

To add documentation for a new domain (e.g., `bookmarks`):

1. **Create schema file:**

   ```
   src/openapi/components/schemas/bookmarks/bookmark.yaml
   ```

2. **Create path file:**

   ```
   src/openapi/paths/bookmarks/bookmark.yaml
   ```

3. **Add tag to `openapi.yaml`:**

   ```yaml
   tags:
     - name: bookmarks/Bookmarks
       description: Bookmark management endpoints
   ```

4. **Update `swagger.config.js`:**
   - Add schema loading
   - Add path loading
   - Merge into existing schemas and paths

5. **Use domain-prefixed tag in paths:**
   ```yaml
   tags:
     - bookmarks/Bookmarks
   ```

## Reference

- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [Getting Started Guide](./getting-started.md#6-browse-api-documentation)
