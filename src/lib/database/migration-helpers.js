const { DbType, createDatabaseStrategy } = require('./strategies')

function getDbType(knex) {
  return knex.client.config.client
}

function getTableName(domain, tableName, options) {
  const { knex, dbType } = options
  const actualDbType = dbType || getDbType(knex)
  return createDatabaseStrategy(actualDbType).getTableReference(
    domain,
    tableName
  )
}

async function createSchemaIfSupported(knex, schemaName) {
  const dbType = getDbType(knex)
  if (createDatabaseStrategy(dbType).requiresSchemaCreation()) {
    await knex.raw(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`)
  }
}

async function dropSchemaIfSupported(knex, schemaName) {
  const dbType = getDbType(knex)
  if (createDatabaseStrategy(dbType).requiresSchemaCreation()) {
    await knex.raw(`DROP SCHEMA IF EXISTS ${schemaName} CASCADE`)
  }
}

function uuid(table, columnName, knex) {
  const dbType = getDbType(knex)

  if (dbType === DbType.postgresql) {
    return table.uuid(columnName)
  } else {
    const uuidType = createDatabaseStrategy(dbType).getUuidType()
    return table.specificType(columnName, uuidType)
  }
}

module.exports = {
  DbType,
  createDatabaseStrategy,
  getDbType,
  getTableName,
  createSchemaIfSupported,
  dropSchemaIfSupported,
  uuid
}
