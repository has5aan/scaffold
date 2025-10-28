const {
  createSchemaIfSupported,
  dropSchemaIfSupported
} = require('../../lib/database/migration-helpers')

exports.up = async function (knex) {
  if (process.env.NODE_ENV != 'test') {
    return
  }
  await createSchemaIfSupported(knex, 'auth')
}

exports.down = async function (knex) {
  if (process.env.NODE_ENV != 'test') {
    return
  }
  await dropSchemaIfSupported(knex, 'auth')
}
