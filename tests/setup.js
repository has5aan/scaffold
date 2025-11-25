const knex = require('knex')
const express = require('express')
const { getTableName } = require('../src/lib/database/migration-helpers')

async function createInMemoryEmptyDatabase() {
  return knex({
    client: 'sqlite3',
    connection: { filename: ':memory:' },
    useNullAsDefault: true
  })
}

function createTestExpressApp() {
  const app = express()

  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  return app
}

async function ensurePostgresDatabase(config) {
  const { database, ...connectionWithoutDb } = config.connection

  const systemDbConfig = {
    ...config,
    connection: {
      ...connectionWithoutDb,
      database: 'postgres' // Connect to system database
    }
  }

  const systemDb = knex(systemDbConfig)

  try {
    // Check if database exists
    const result = await systemDb.raw(
      'SELECT 1 FROM pg_database WHERE datname = ?',
      [database]
    )

    // Drop database if it exists (for clean testing)
    if (result.rows.length > 0) {
      // Terminate active connections to the database
      await systemDb.raw(
        'SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = ? AND pid <> pg_backend_pid()',
        [database]
      )
      await systemDb.raw(`DROP DATABASE "${database}"`)
    }

    // Create fresh database
    await systemDb.raw(`CREATE DATABASE "${database}"`)
  } finally {
    await systemDb.destroy()
  }
}

async function makeDb(config, { migrate = false } = {}) {
  if (config.client === 'pg' || config.client === 'postgresql') {
    // Create unique database name for each test process to avoid conflicts
    const workerId = process.env.JEST_WORKER_ID || '1'
    const uniqueConfig = {
      ...config,
      connection: {
        ...config.connection,
        database: `${config.connection.database}_worker_${workerId}`
      }
    }

    await ensurePostgresDatabase(uniqueConfig)

    // Configure pg driver to return DATE columns as strings to prevent timezone conversion
    const pg = require('pg')
    pg.types.setTypeParser(pg.types.builtins.DATE, val => val)

    // Use the unique config for the actual connection
    config = uniqueConfig
  }

  const db = knex(config)

  if (migrate) {
    await db.migrate.latest()
  }

  return db
}

async function setDatabaseSequences(knexInstance, tableNames) {
  if (
    knexInstance.client.config.client === 'pg' ||
    knexInstance.client.config.client === 'postgresql'
  ) {
    let tablesToReset = []

    if (!Array.isArray(tableNames)) {
      // If no tables specified, auto-detect all tables from database
      if (!tablesToReset) {
        const result = await knexInstance.raw(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE' 
          AND table_name NOT LIKE 'knex_%'
      `)
        tablesToReset = result.rows.map(row => row.table_name)
      } else {
        tablesToReset = tableNames
      }
    }

    for (const tableName of tablesToReset) {
      try {
        // Get the current max ID for the table
        const result = await knexInstance(tableName).max('id as max_id').first()
        const maxId = result?.max_id || 0

        // Set the sequence to the max_id so the next nextval() will be max_id + 1
        await knexInstance.raw(`SELECT setval('${tableName}_id_seq', ${maxId})`)
      } catch (error) {
        // Ignore errors for tables that don't exist or don't have sequences
        console.warn(
          `Could not reset sequence for ${tableName}:`,
          error.message
        )
      }
    }
  }
}

async function resetDatabase(knexInstance) {
  try {
    const tableNames = await knexInstance.raw(`
      SELECT '"' || table_name || '"' as table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name NOT LIKE 'knex_%'
    `)

    const tables = tableNames.rows.map(row => row.table_name)

    if (tables.length === 0) {
      return
    }

    // Truncate all tables and reset sequences
    const tableList = tables.join(', ')
    await knexInstance.raw(
      `TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`
    )
  } catch (error) {
    console.warn('Could not reset database:', error.message)
  }
}

async function cleanupTestDatabase(knexInstance, config) {
  if (!knexInstance) {
    return
  }

  if (config.client === 'pg' || config.client === 'postgresql') {
    const databaseName = config.connection.database

    await knexInstance.destroy()

    const { database: _, ...connectionWithoutDb } = config.connection
    const systemDbConfig = {
      ...config,
      connection: {
        ...connectionWithoutDb,
        database: 'postgres' // Connect to system database
      }
    }

    const systemDb = knex(systemDbConfig)

    try {
      // Terminate all connections to the database
      await systemDb.raw(
        'SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = ? AND pid <> pg_backend_pid()',
        [databaseName]
      )

      await systemDb.raw(`DROP DATABASE IF EXISTS "${databaseName}"`)
    } catch {
      // Don't throw - cleanup should be best effort
    } finally {
      await systemDb.destroy()
    }
  } else {
    // For SQLite, just close the connection
    await knexInstance.destroy()
  }
}

async function insertTestData(knexInstance, setupData) {
  const insertedTables = []

  // Handle nested domain structure: { domain: { tableName: data } }
  for (const [domain, tables] of Object.entries(setupData)) {
    for (const [tableName, data] of Object.entries(tables)) {
      if (Array.isArray(data) && data.length > 0) {
        const fullTableName = getTableName(domain, tableName, {
          knex: knexInstance
        })
        await knexInstance(fullTableName).insert(data)
        insertedTables.push(fullTableName)
      }
    }
  }

  await setDatabaseSequences(knexInstance, insertedTables)

  return insertedTables
}

function executeSchemaFailureTestCases(schema, testCases) {
  Object.entries(testCases).forEach(([property, cases]) => {
    describe(`${property}`, () => {
      cases.forEach(({ name, data, expected }) => {
        it(`should fail when ${name}`, () => {
          const { error } = schema.validate(data)
          expect(error.message).toBe(expected)
        })
      })
    })
  })
}

function executeSchemaSuccessTestCases(schema, testCases) {
  Object.entries(testCases).forEach(([property, cases]) => {
    describe(`${property}`, () => {
      cases.forEach(({ name, data, validatedData = undefined }) => {
        it(`should pass when ${name}`, () => {
          const { error, value } = schema.validate(data)
          expect(error).toBeUndefined()
          if (validatedData) {
            expect(value).toEqual(validatedData)
          }
        })
      })
    })
  })
}

module.exports = {
  createInMemoryEmptyDatabase,
  createTestExpressApp,
  makeDb,
  setDatabaseSequences,
  resetDatabase,
  cleanupTestDatabase,
  insertTestData,
  executeSchemaFailureTestCases,
  executeSchemaSuccessTestCases
}
