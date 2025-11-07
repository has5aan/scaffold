const { getTableName, uuid } = require('../../lib/database/migration-helpers')

exports.up = async function (knex) {
  await knex.schema.createTable(
    getTableName('example', 'tag', { knex }),
    function (table) {
      table.increments('id').primary()
      uuid(table, 'user_id', knex)
        .notNullable()
        .references('id')
        .inTable(getTableName('auth', 'users', { knex }))
        .onDelete('CASCADE')
      table.string('name', 16).notNullable()
      table.timestamps(true, true)

      table.unique(['user_id', 'name'])
    }
  )
}

exports.down = async function (knex) {
  await knex.schema.dropTable(getTableName('example', 'tag', { knex }))
}
