const build = require('pino-abstract-transport')
const knex = require('knex')

// Create SQLite transport
module.exports = async function (options) {
  const db = knex(options.knexConfig)

  // Run migrations to ensure table exists
  await db.migrate.latest()

  return build(
    async function (source) {
      for await (const obj of source) {
        const timestamp = new Date(obj.time).toISOString()
        const level = obj.levelLabel || String(obj.level)
        const name = obj.name || null
        const message = obj.msg || ''

        // Store additional data as JSON (excluding standard fields)
        const {
          time: _time,
          level: _lvl,
          levelLabel: _levelLabel,
          name: _n,
          msg: _msg,
          ...additionalData
        } = obj
        const data =
          Object.keys(additionalData).length > 0
            ? JSON.stringify(additionalData)
            : null

        // Insert log entry using Knex
        try {
          await db('logs').insert({
            timestamp,
            level,
            name,
            message,
            data
          })
        } catch (err) {
          console.error('Failed to write log to SQLite: ', err)
        }
      }
    },
    {
      async close(err, cb) {
        try {
          if (err) {
            console.error('Transport error: ', err)
          }
          await db.destroy()
          cb(err)
        } catch (closeErr) {
          cb(err || closeErr)
        }
      }
    }
  )
}
