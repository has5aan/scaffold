const path = require('path')

// Load environment variables from project root
require('dotenv').config({ path: path.join(__dirname, '../../.env') })

module.exports = {
  development: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    pool: {
      min: 1,
      max: 5
    },
    migrations: {
      directory: [
        path.join(__dirname, '../auth/migrations'),
        path.join(__dirname, '../example/migrations')
      ]
    },
    seeds: {
      directory: [
        path.join(__dirname, '../auth/seeds'),
        path.join(__dirname, '../example/seeds')
      ]
    }
  },
  test: {
    client: 'pg',
    connection: {
      host: process.env.PG_TEST_HOST,
      port: process.env.PG_TEST_PORT,
      database: process.env.PG_TEST_DB,
      user: process.env.PG_TEST_USER,
      password: process.env.PG_TEST_PASSWORD
    },
    pool: {
      min: 1,
      max: 5
    },
    migrations: {
      directory: [
        path.join(__dirname, '../auth/migrations'),
        path.join(__dirname, '../example/migrations')
      ]
    },
    seeds: {
      directory: [
        path.join(__dirname, '../auth/seeds'),
        path.join(__dirname, '../example/seeds')
      ]
    }
  },
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: [
        path.join(__dirname, '../auth/migrations'),
        path.join(__dirname, '../example/migrations')
      ]
    },
    seeds: {
      directory: [
        path.join(__dirname, '../auth/seeds'),
        path.join(__dirname, '../example/seeds')
      ]
    }
  },
  logger: {
    client: 'sqlite3',
    connection: {
      filename: path.join(__dirname, '../../logs/app.sqlite3')
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.join(__dirname, '../lib/logger/migrations')
    }
  }
}
