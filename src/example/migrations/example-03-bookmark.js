const { getTableName, uuid } = require('../../lib/database/migration-helpers')

exports.up = function (knex) {
  return knex.schema.createTable(
    getTableName('example', 'bookmark', { knex }),
    function (table) {
      table.increments('id').primary()
      uuid(table, 'user_id', knex)
        .notNullable()
        .references('id')
        .inTable(getTableName('auth', 'users', { knex }))
        .onDelete('CASCADE')
      table.string('url', 255).notNullable()
      table.string('title', 255).notNullable()
      table.text('description')
      table.timestamps(true, true)

      table.unique(['user_id', 'title'])
      table.unique(['user_id', 'url'])
    }
  )
}

exports.down = function (knex) {
  return knex.schema.dropTable(getTableName('example', 'bookmark', { knex }))
}
