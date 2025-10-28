const {
  createSchemaIfSupported,
  dropSchemaIfSupported
} = require('../../lib/database/migration-helpers')

exports.up = async function (knex) {
  await createSchemaIfSupported(knex, 'example')
}

exports.down = async function (knex) {
  await dropSchemaIfSupported(knex, 'example')
}
