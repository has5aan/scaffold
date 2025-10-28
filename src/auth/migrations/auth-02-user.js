const { getTableName, uuid } = require('../../lib/database/migration-helpers')

exports.up = function (knex) {
  if (process.env.NODE_ENV != 'test') {
    return Promise.resolve()
  }
  return knex.schema.createTable(
    getTableName('auth', 'users', { knex }),
    function (table) {
      uuid(table, 'id', knex).primary().notNullable()
      table.string('email', 255).notNullable().unique()
    }
  )
}

exports.down = function (knex) {
  if (process.env.NODE_ENV != 'test') {
    return Promise.resolve()
  }
  return knex.schema.dropTable(getTableName('auth', 'users', { knex }))
}
