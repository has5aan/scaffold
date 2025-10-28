const { getTableName } = require('../../lib/database/migration-helpers')

exports.up = function (knex) {
  return knex.schema.createTable(
    getTableName('example', 'bookmark_tag', { knex }),
    function (table) {
      table.increments('id').primary()
      table
        .integer('bookmark_id')
        .notNullable()
        .references('id')
        .inTable(getTableName('example', 'bookmark', { knex }))
        .onDelete('CASCADE')
      table
        .integer('tag_id')
        .notNullable()
        .references('id')
        .inTable(getTableName('example', 'tag', { knex }))
        .onDelete('CASCADE')
      table.timestamps(true, true)

      table.unique(['bookmark_id', 'tag_id'])
    }
  )
}

exports.down = function (knex) {
  return knex.schema.dropTable(
    getTableName('example', 'bookmark_tag', { knex })
  )
}
