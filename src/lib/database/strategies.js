const DbType = {
  postgresql: 'pg',
  mysql: 'mysql',
  mysql2: 'mysql2',
  sqlite: 'sqlite3'
}

class PostgreSQLStrategy {
  supportsSchemas() {
    return true
  }

  getUuidType() {
    return 'uuid'
  }

  getSeparator() {
    return '.'
  }

  getTableReference(domain, tableName) {
    return `${domain}.${tableName}`
  }

  requiresSchemaCreation() {
    return true
  }
}

class MySQLStrategy {
  supportsSchemas() {
    return false
  }

  getUuidType() {
    return 'char(36)'
  }

  getSeparator() {
    return '_'
  }

  getTableReference(domain, tableName) {
    return `${domain}_${tableName}`
  }

  requiresSchemaCreation() {
    return false
  }
}

class SQLiteStrategy {
  supportsSchemas() {
    return false
  }

  getUuidType() {
    return 'text'
  }

  getSeparator() {
    return '_'
  }

  getTableReference(domain, tableName) {
    return `${domain}_${tableName}`
  }

  requiresSchemaCreation() {
    return false
  }
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
