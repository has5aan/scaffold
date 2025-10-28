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

exports.up = function (knex) {
  return knex.schema.createTable(
    getTableName('${domain}', '${name}', { knex }),
    function (table) {
      table.increments('id').primary()
      // Add columns here
      table.timestamps(true, true)
    }
  )
}

exports.down = function (knex) {
  return knex.schema.dropTable(getTableName('${domain}', '${name}', { knex }))
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
      console.log(`✓ Rolled back: ${filename}`)
    }
  } catch (err) {
    console.error(`✗ Migration failed:`, err.message)
    throw err
  } finally {
    await db.destroy()
  }
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

// Check for up/down specific file
if (args[0] === 'up' || args[0] === 'down') {
  const filename = args[1]
  if (!filename) {
    console.error(`Usage: node scripts/migrate.js ${args[0]} <filename>`)
    console.error(
      `Example: node scripts/migrate.js ${args[0]} example-05-test.js`
    )
    process.exit(1)
  }
  runSingleMigration(filename, args[0])
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
} else {
  // Check for action (latest, rollback, status)
  const actions = ['latest', 'rollback', 'status']
  let action = 'latest'
  let domains = []

  if (actions.includes(args[0])) {
    action = args[0]
    domains = args.slice(1)
  } else {
    domains = args
  }

  // Default to all domains in order if none specified
  if (domains.length === 0) {
    domains = ['auth', 'example']
  }

  console.log(`Running migrations for: ${domains.join(', ')}`)

  runMigrations(domains, action).catch(() => process.exit(1))
}
