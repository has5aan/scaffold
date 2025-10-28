process.env.PINO_TRANSPORT_TARGETS = 'file|console'
process.env.NODE_ENV = 'test'
process.env.PG_TEST_HOST = 'localhost'
process.env.PG_TEST_PORT = 5432
process.env.PG_TEST_DB = 'scaffold_test'
process.env.PG_TEST_USER = 'postgres'
process.env.PG_TEST_PASSWORD = 'postgres'

module.exports = {
  slowTestThreshold: 20
}
