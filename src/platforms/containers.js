const { createClient } = require('redis')
const knex = require('knex')
const knexConfig = require('../config/knex.config')
const { DI: CommonContainer } = require('../container')
const { DI: ExampleContainer } = require('../example/example.container')
const { createLogger } = require('../lib/logger/create-logger')

const logger = createLogger('app', knexConfig.logger)

const cacheClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_HOST_PORT || 6379
  },
  password: process.env.REDIS_PASSWORD || undefined
})
const knexInstance = knex(knexConfig[process.env.NODE_ENV || 'development'])

const commonContainer = new CommonContainer({ knexInstance, cacheClient })
const exampleContainer = new ExampleContainer({ knexInstance, commonContainer })

module.exports = {
  knexInstance,
  cacheClient,
  logger,
  commonContainer,
  exampleContainer
}
