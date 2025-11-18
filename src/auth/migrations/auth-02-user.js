const { getTableName, uuid } = require('../../lib/database/migration-helpers')

exports.up = async function (knex) {
  if (process.env.NODE_ENV != 'test') {
    return Promise.resolve()
  }
  await knex.schema.createTable(
    getTableName('auth', 'users', { knex }),
    function (table) {
      uuid(table, 'id', knex).notNullable()
      table.string('email', 255).notNullable().unique()
      table.primary(['id'], { constraintName: 'auth_users_pkey' })
    }
  )
}

exports.down = async function (knex) {
  if (process.env.NODE_ENV != 'test') {
    return
  }
  await knex.schema.dropTable(getTableName('auth', 'users', { knex }))
}
