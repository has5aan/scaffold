exports.up = function (knex) {
  return knex.schema.createTable('log', function (table) {
    table.increments('id').primary()
    table.text('timestamp').notNullable()
    table.text('level').notNullable()
    table.text('name')
    table.text('message')
    table.text('data')
    table.timestamps(true, true)
  })
}

exports.down = function (knex) {
  return knex.schema.dropTable('log')
}
