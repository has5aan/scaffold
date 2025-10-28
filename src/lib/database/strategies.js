const DbType = {
  postgresql: 'pg',
  mysql: 'mysql',
  mysql2: 'mysql2',
  sqlite: 'sqlite3'
}

function PostgreSQLStrategy() {}

PostgreSQLStrategy.prototype.supportsSchemas = function () {
  return true
}

PostgreSQLStrategy.prototype.getUuidType = function () {
  return 'uuid'
}

PostgreSQLStrategy.prototype.getSeparator = function () {
  return '.'
}

PostgreSQLStrategy.prototype.getTableReference = function (domain, tableName) {
  return `${domain}.${tableName}`
}

PostgreSQLStrategy.prototype.requiresSchemaCreation = function () {
  return true
}

function MySQLStrategy() {}

MySQLStrategy.prototype.supportsSchemas = function () {
  return false
}

MySQLStrategy.prototype.getUuidType = function () {
  return 'char(36)'
}

MySQLStrategy.prototype.getSeparator = function () {
  return '_'
}

MySQLStrategy.prototype.getTableReference = function (domain, tableName) {
  return `${domain}_${tableName}`
}

MySQLStrategy.prototype.requiresSchemaCreation = function () {
  return false
}

function SQLiteStrategy() {}

SQLiteStrategy.prototype.supportsSchemas = function () {
  return false
}

SQLiteStrategy.prototype.getUuidType = function () {
  return 'text'
}

SQLiteStrategy.prototype.getSeparator = function () {
  return '_'
}

SQLiteStrategy.prototype.getTableReference = function (domain, tableName) {
  return `${domain}_${tableName}`
}

SQLiteStrategy.prototype.requiresSchemaCreation = function () {
  return false
}

function createDatabaseStrategy(dbType) {
  switch (dbType) {
    case DbType.postgresql:
      return new PostgreSQLStrategy()
    case DbType.mysql:
    case DbType.mysql2:
      return new MySQLStrategy()
    case DbType.sqlite:
      return new SQLiteStrategy()
    default:
      throw new Error(`Unsupported database type: ${dbType}`)
  }
}

module.exports = {
  DbType,
  PostgreSQLStrategy,
  MySQLStrategy,
  SQLiteStrategy,
  createDatabaseStrategy
}
