# Migration and Seed Scripts

## Migration Script

Unified migration management for domain-based migrations.

### Usage

The script requires an action and accepts domain names (comma-separated) or specific filenames.

#### Actions

- `latest` - Apply latest pending migrations
- `status` - Check migration status
- `rollback` - Rollback last batch of migrations
- `remove` - Rollback all migrations for domains
- `up` - Apply specific migration file
- `down` - Rollback specific migration file
- `create` - Create new migration file

#### Run Migrations

```bash
# Apply latest migrations for domains
node scripts/migrate.js latest auth
node scripts/migrate.js latest auth,example
```

#### Check Status

```bash
# Check status for domains
node scripts/migrate.js status auth
node scripts/migrate.js status auth,example
```

#### Rollback Migrations

**Rollback last batch:**

```bash
node scripts/migrate.js rollback auth
node scripts/migrate.js rollback auth,example
```

**Rollback all migrations for domains:**

```bash
node scripts/migrate.js remove auth
node scripts/migrate.js remove auth,example
```

#### Apply/Rollback Individual Files

**Apply specific migration:**

```bash
node scripts/migrate.js up auth-02-user.js
node scripts/migrate.js up example-02-tag.js
```

**Rollback specific migration:**

```bash
node scripts/migrate.js down auth-02-user.js
node scripts/migrate.js down example-02-tag.js
```

#### Create New Migration

```bash
node scripts/migrate.js create <domain> <name>

# Examples
node scripts/migrate.js create auth role
node scripts/migrate.js create example category
```

Creates a new migration file in `src/{domain}/migrations/` with auto-incremented number.

### Command Reference

| Command                                                  | Description                         |
| -------------------------------------------------------- | ----------------------------------- |
| `node scripts/migrate.js latest <domain1,domain2,...>`   | Apply latest pending migrations     |
| `node scripts/migrate.js status <domain1,domain2,...>`   | Check migration status              |
| `node scripts/migrate.js rollback <domain1,domain2,...>` | Rollback last batch of migrations   |
| `node scripts/migrate.js remove <domain1,domain2,...>`   | Rollback all migrations for domains |
| `node scripts/migrate.js up <filename>`                  | Apply specific migration file       |
| `node scripts/migrate.js down <filename>`                | Rollback specific migration file    |
| `node scripts/migrate.js create <domain> <name>`         | Create new migration                |

### Examples

**Apply migrations:**

```bash
node scripts/migrate.js latest auth
```

**Check what's applied:**

```bash
node scripts/migrate.js status auth
```

**Rollback last batch:**

```bash
node scripts/migrate.js rollback auth
```

**Rollback all migrations for a domain:**

```bash
node scripts/migrate.js remove auth
```

**Create and apply a new migration:**

```bash
node scripts/migrate.js create auth role
# Edit the generated file
node scripts/migrate.js latest auth
```

**Rollback and reapply a specific migration:**

```bash
node scripts/migrate.js down auth-02-user.js
# Fix the migration file
node scripts/migrate.js up auth-02-user.js
```

### Notes

- Domains are comma-separated: `auth,example`
- Migration files follow naming: `{domain}-{number}-{name}.js`
- Migrations located in `src/{domain}/migrations/` directories
- All migrations tracked in single `knex_migrations` table
- Can apply/rollback individual files out of order
- Knex automatically skips already-applied migrations
- `rollback` rolls back the latest batch only
- `remove` rolls back all migrations for specified domains

---

## Seed Script

Unified seed management for domain-based data seeding.

### Usage

The script accepts domain names (comma-separated or space-separated) or a `create` command.

#### Run Seeds

```bash
# Run seeds for domains
node scripts/seed.js auth
node scripts/seed.js auth,example
node scripts/seed.js auth example
```

#### Create New Seed

```bash
node scripts/seed.js create <domain> <name>

# Examples
node scripts/seed.js create auth users
node scripts/seed.js create example tags
```

Creates a new seed file in `src/{domain}/seeds/` with auto-incremented number.

### Command Reference

| Command                                        | Description                    |
| ---------------------------------------------- | ------------------------------ |
| `node scripts/seed.js <domain1,domain2,...>`   | Run seeds for domains          |
| `node scripts/seed.js <domain1> <domain2> ...` | Run seeds for domains (spaces) |
| `node scripts/seed.js create <domain> <name>`  | Create new seed file           |

### Examples

**Run seeds for a domain:**

```bash
node scripts/seed.js auth
```

**Run seeds for multiple domains:**

```bash
node scripts/seed.js auth,example
```

**Create and run a new seed:**

```bash
node scripts/seed.js create auth users
# Edit the generated file
node scripts/seed.js auth
```

### Notes

- Domains can be comma-separated or space-separated: `auth,example` or `auth example`
- Seed files follow naming: `{domain}-{number}-{name}.js`
- Seeds located in `src/{domain}/seeds/` directories
- Seeds run in alphabetical order per domain
- Each seed file must export a `seed` function
