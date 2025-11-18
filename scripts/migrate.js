#!/usr/bin/env node

const knex = require('knex')
const knexConfig = require('../src/config/knex.config')
const path = require('path')
const fs = require('fs')

const MIGRATIONS_TABLE = 'knex_migrations'

async function ensureMigrationsTable(db) {
  const exists = await db.schema.hasTable(MIGRATIONS_TABLE)
  if (!exists) {
    await db.schema.createTable(MIGRATIONS_TABLE, table => {
      table.increments('id')
      table.string('name')
      table.integer('batch')
      table.timestamp('migration_time')
    })
  }
}

async function getAppliedMigrations(db) {
  await ensureMigrationsTable(db)
  const rows = await db(MIGRATIONS_TABLE).select('name').orderBy('id')
  return rows.map(r => r.name)
}

async function getLatestBatch(db) {
  await ensureMigrationsTable(db)
  const result = await db(MIGRATIONS_TABLE).max('batch as max_batch')
  return result[0].max_batch || 0
}

async function getMigrationFiles(domain) {
  const directory = path.join(__dirname, `../src/${domain}/migrations`)

  if (!fs.existsSync(directory)) {
    return []
  }

  const files = fs
    .readdirSync(directory)
    .filter(f => f.endsWith('.js'))
    .sort()

  return files.map(f => ({
    name: f,
    path: path.join(directory, f)
  }))
}

async function runMigrations(domains, action = 'latest') {
  const env = process.env.NODE_ENV || 'development'
  const db = knex(knexConfig[env])

  try {
    const applied = await getAppliedMigrations(db)

    for (const domain of domains) {
      console.log(
        `\n[${domain}] ${action === 'latest' ? 'Applying' : 'Checking'} migrations...`
      )

      const allFiles = await getMigrationFiles(domain)

      if (action === 'latest') {
        // Filter to pending migrations only
        const pending = allFiles.filter(f => !applied.includes(f.name))

        if (pending.length === 0) {
          console.log(`  ✓ No pending migrations`)
          continue
        }

        for (const file of pending) {
          console.log(`  • Running: ${file.name}`)

          // Use Knex API to run migration - Knex handles tracking
          await db.migrate.up({
            name: file.name
          })

          console.log(`    ✓ Applied: ${file.name}`)
        }
      } else if (action === 'rollback') {
        // Get last batch for this domain
        const latestBatch = await getLatestBatch(db)
        if (latestBatch === 0) {
          console.log(`  ✓ No migrations to rollback`)
          continue
        }

        const toRollback = await db(MIGRATIONS_TABLE)
          .where('batch', latestBatch)
          .whereIn(
            'name',
            allFiles.map(f => f.name)
          )
          .orderBy('id', 'desc')
          .select('name')

        if (toRollback.length === 0) {
          console.log(`  ✓ No migrations to rollback for this domain`)
          continue
        }

        for (const row of toRollback) {
          console.log(`  • Rolling back: ${row.name}`)

          // Use Knex API to rollback migration - Knex handles tracking
          await db.migrate.down({
            name: row.name
          })

          console.log(`    ✓ Rolled back: ${row.name}`)
        }
      } else if (action === 'status') {
        const completed = allFiles.filter(f => applied.includes(f.name))
        const pending = allFiles.filter(f => !applied.includes(f.name))

        console.log(`  Completed: ${completed.length}`)
        completed.forEach(f => console.log(`    ✓ ${f.name}`))

        if (pending.length > 0) {
          console.log(`  Pending: ${pending.length}`)
          pending.forEach(f => console.log(`    • ${f.name}`))
        }
      }
    }

    console.log('\n✓ Done\n')
  } catch (err) {
    console.error('\n✗ Migration failed:', err.message)
    console.error(err.stack)
    throw err
  } finally {
    await db.destroy()
  }
}

function createMigration(domain, name) {
  const dir = path.join(__dirname, `../src/${domain}/migrations`)

  // Ensure migrations directory exists
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  // Get next number for this domain
  const files = fs.readdirSync(dir)
  const numbers = files
    .filter(f => f.startsWith(`${domain}-`) && f.endsWith('.js'))
    .map(f => {
      const match = f.match(/^[^-]+-(\d+)-/)
      return match ? parseInt(match[1]) : 0
    })

  const nextNum = numbers.length > 0 ? Math.max(...numbers) + 1 : 1
  const filename = `${domain}-${String(nextNum).padStart(2, '0')}-${name}.js`
  const filepath = path.join(dir, filename)

  const template = `const { getTableName } = require('../../lib/database/migration-helpers')

exports.up = async function (knex) {
  await knex.schema.createTable(
    getTableName('${domain}', '${name}', { knex }),
    function (table) {
      table.increments('id').primary()
      // Add columns here
      table.timestamps(true, true)
    }
  )
}

exports.down = async function (knex) {
  await knex.schema.dropTable(getTableName('${domain}', '${name}', { knex }))
}
`

  fs.writeFileSync(filepath, template)
  console.log(`✓ Created: ${filepath}`)
}

async function runSingleMigration(filename, action) {
  const env = process.env.NODE_ENV || 'development'
  const db = knex(knexConfig[env])

  try {
    if (action === 'up') {
      console.log(`Applying: ${filename}`)
      await db.migrate.up({ name: filename })
      console.log(`✓ Applied: ${filename}`)
    } else if (action === 'down') {
      console.log(`Rolling back: ${filename}`)
      await db.migrate.down({ name: filename })
      // Knex automatically removes the migration record from knex_migrations table
      console.log(`✓ Rolled back: ${filename}`)
    }
  } catch (err) {
    console.error(`✗ Migration failed:`, err.message)
    throw err
  } finally {
    await db.destroy()
  }
}

async function rollbackDomain(domain) {
  const env = process.env.NODE_ENV || 'development'
  const db = knex(knexConfig[env])

  try {
    await ensureMigrationsTable(db)

    console.log(`\n[${domain}] Rolling back all migrations...`)

    const allFiles = await getMigrationFiles(domain)
    if (allFiles.length === 0) {
      console.log(`  ✓ No migration files found for domain`)
      return
    }

    // Get all applied migrations for this domain (across all batches)
    const appliedMigrations = await db(MIGRATIONS_TABLE)
      .whereIn(
        'name',
        allFiles.map(f => f.name)
      )
      .orderBy('id', 'desc') // Reverse order (newest first)
      .select('name', 'batch')

    if (appliedMigrations.length === 0) {
      console.log(`  ✓ No applied migrations found for this domain`)
      return
    }

    console.log(`  Found ${appliedMigrations.length} migration(s) to rollback:`)
    appliedMigrations.forEach(m =>
      console.log(`    • ${m.name} (batch ${m.batch})`)
    )

    // Rollback each migration in reverse order
    for (const migration of appliedMigrations) {
      console.log(`  • Rolling back: ${migration.name}`)

      try {
        // Use Knex API to rollback migration - Knex handles tracking and record deletion
        await db.migrate.down({ name: migration.name })
        console.log(`    ✓ Rolled back: ${migration.name}`)
      } catch (err) {
        console.error(
          `    ✗ Failed to rollback ${migration.name}:`,
          err.message
        )
        // Continue with other migrations even if one fails
      }
    }

    console.log(`\n✓ Domain rollback complete\n`)
  } catch (err) {
    console.error('\n✗ Domain rollback failed:', err.message)
    console.error(err.stack)
    throw err
  } finally {
    await db.destroy()
  }
}

function parseDomains(input) {
  if (!input || input.length === 0) {
    return []
  }
  // Handle comma-separated domains: "auth,reference,user" or ["auth", "reference", "user"]
  if (typeof input === 'string') {
    return input
      .split(',')
      .map(d => d.trim())
      .filter(d => d.length > 0)
  }
  // Handle array input
  return input.flatMap(arg => {
    if (arg.includes(',')) {
      return arg
        .split(',')
        .map(d => d.trim())
        .filter(d => d.length > 0)
    }
    return [arg]
  })
}

// Parse command line arguments
const args = process.argv.slice(2)

// Check for create command
if (args[0] === 'create') {
  const [domain, name] = args.slice(1)
  if (!domain || !name) {
    console.error('Usage: node scripts/migrate.js create <domain> <name>')
    console.error('Example: node scripts/migrate.js create auth role')
    process.exit(1)
  }
  createMigration(domain, name)
  process.exit(0)
}

// Check for up/down specific file or domain
if (args[0] === 'up' || args[0] === 'down') {
  const targets = args.slice(1)

  if (args[0] === 'up') {
    // 'up' only works with specific filenames
    if (targets.length === 0 || !targets[0].endsWith('.js')) {
      console.error('Error: "up" command only works with specific filenames')
      console.error('Usage: node scripts/migrate.js up <filename>')
      console.error('Example: node scripts/migrate.js up user-01-profiles.js')
      console.error(
        'For domain migrations, use: node scripts/migrate.js latest <domain1,domain2,...>'
      )
      process.exit(1)
    }
    runSingleMigration(targets[0], args[0])
      .then(() => process.exit(0))
      .catch(() => process.exit(1))
  } else {
    // 'down' only works with specific filenames
    if (targets.length === 0 || !targets[0].endsWith('.js')) {
      console.error('Error: "down" command only works with specific filenames')
      console.error('Usage: node scripts/migrate.js down <filename>')
      console.error('Example: node scripts/migrate.js down user-01-profiles.js')
      console.error(
        'For domain rollbacks, use: node scripts/migrate.js remove <domain1,domain2,...>'
      )
      process.exit(1)
    }
    // It's a filename - rollback single migration
    runSingleMigration(targets[0], args[0])
      .then(() => process.exit(0))
      .catch(() => process.exit(1))
  }
} else {
  // Check for action (latest, rollback, status, remove)
  const actions = ['latest', 'rollback', 'status', 'remove']

  // Require an action to be specified
  if (!args[0] || !actions.includes(args[0])) {
    console.error('Error: Action required')
    console.error(
      'Usage: node scripts/migrate.js <action> <domain1,domain2,...>'
    )
    console.error('')
    console.error('Available actions:')
    console.error('  latest    - Apply latest pending migrations')
    console.error('  status    - Show migration status')
    console.error('  rollback  - Rollback latest batch of migrations')
    console.error('  remove    - Rollback all migrations for domains')
    console.error('')
    console.error('Examples:')
    console.error('  node scripts/migrate.js latest auth,reference,user')
    console.error('  node scripts/migrate.js status reference')
    console.error('  node scripts/migrate.js rollback user')
    console.error('  node scripts/migrate.js remove auth,reference,user')
    console.error('')
    console.error('File-level commands:')
    console.error(
      '  node scripts/migrate.js up <filename>    - Run specific migration file'
    )
    console.error(
      '  node scripts/migrate.js down <filename>   - Rollback specific migration file'
    )
    console.error(
      '  node scripts/migrate.js create <domain> <name> - Create new migration'
    )
    process.exit(1)
  }

  const action = args[0]
  const domains = parseDomains(args.slice(1))

  // Require domains to be specified
  if (domains.length === 0) {
    console.error(`Error: No domains specified for action "${action}"`)
    console.error(
      `Usage: node scripts/migrate.js ${action} <domain1,domain2,...>`
    )
    console.error(`Example: node scripts/migrate.js ${action} reference`)
    console.error(
      `Example: node scripts/migrate.js ${action} auth,reference,user`
    )
    process.exit(1)
  }

  // Handle 'remove' action separately (rollback all migrations for domains)
  if (action === 'remove') {
    // Reverse order for rollback (last specified → first specified)
    const reversedDomains = [...domains].reverse()
    console.log(
      `Rolling back all migrations for domains in reverse order: ${reversedDomains.join(' → ')}`
    )
    ;(async () => {
      for (const domain of reversedDomains) {
        await rollbackDomain(domain)
      }
      process.exit(0)
    })().catch(() => process.exit(1))
  } else {
    // Handle other actions (latest, rollback, status)
    console.log(`Running migrations for: ${domains.join(', ')}`)
    runMigrations(domains, action).catch(() => process.exit(1))
  }
}
