# Migration Script

Unified migration management for domain-based migrations.

## Usage

### Run All Domains (Default Order)

```bash
npm run migrate
# Equivalent to: node scripts/migrate.js
# Runs: auth → example
```

### Run Specific Domain(s)

```bash
# Single domain
npm run migrate:auth
npm run migrate:example

# Multiple domains in custom order
node scripts/migrate.js example auth
node scripts/migrate.js auth example
```

### Check Migration Status

```bash
# All domains
npm run migrate:status

# Specific domain
npm run migrate:status example
node scripts/migrate.js status auth
```

### Rollback Migrations

**Rollback last batch (all domains):**

```bash
npm run migrate:rollback
```

**Rollback last batch (specific domain):**

```bash
npm run migrate:rollback example
node scripts/migrate.js rollback auth
```

### Apply/Rollback Individual Migration Files

**Apply specific migration:**

```bash
node scripts/migrate.js up example-05-category.js
node scripts/migrate.js up auth-03-role.js
```

**Rollback specific migration:**

```bash
node scripts/migrate.js down example-05-category.js
node scripts/migrate.js down auth-03-role.js
```

This allows you to apply or rollback individual migrations out of order.

### Create New Migration

```bash
npm run migrate:create <domain> <name>

# Examples
npm run migrate:create auth role
npm run migrate:create example category
```

Creates a new migration file in `src/{domain}/migrations/` with auto-incremented number.

## Command Reference

| Command                                          | Description                                      |
| ------------------------------------------------ | ------------------------------------------------ |
| `node scripts/migrate.js`                        | Run all domains in default order (auth, example) |
| `node scripts/migrate.js <domain>`               | Run migrations for specific domain               |
| `node scripts/migrate.js <domain1> <domain2>`    | Run multiple domains in specified order          |
| `node scripts/migrate.js status [domain]`        | Check migration status                           |
| `node scripts/migrate.js rollback [domain]`      | Rollback last batch                              |
| `node scripts/migrate.js up <filename>`          | Apply specific migration file                    |
| `node scripts/migrate.js down <filename>`        | Rollback specific migration file                 |
| `node scripts/migrate.js create <domain> <name>` | Create new migration                             |

## Examples

**Scenario 1: Setup fresh database**

```bash
npm run migrate
```

**Scenario 2: Add new auth migration**

```bash
npm run migrate:create auth role
# Edit the generated file
npm run migrate:auth
```

**Scenario 3: Rollback and reapply a migration**

```bash
node scripts/migrate.js down example-05-category.js
# Fix the migration file
node scripts/migrate.js up example-05-category.js
```

**Scenario 4: Check what's applied**

```bash
npm run migrate:status
```

**Scenario 5: Run domains in different order**

```bash
node scripts/migrate.js example auth
```

## Notes

- Migration files must follow naming: `{domain}-{number}-{name}.js`
- Migrations stay in `src/{domain}/migrations/` directories
- All migrations tracked in single `knex_migrations` table
- Can apply/rollback individual files out of order
- Knex automatically skips already-applied migrations
