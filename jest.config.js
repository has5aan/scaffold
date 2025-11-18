/**
 * Jest Configuration
 *
 * Environment setup for all tests:
 * - Test database configuration (PostgreSQL)
 * - GoTrue authentication service URL
 * - Test server configuration
 * - Coverage settings
 */

// ============================================================================
// Test Environment Variables (Source of Truth)
// ============================================================================

process.env.PINO_TRANSPORT_TARGETS = 'file|console'
process.env.NODE_ENV = 'test'

// PostgreSQL Test Database
process.env.PG_TEST_HOST = process.env.PG_TEST_HOST || 'localhost'
process.env.PG_TEST_PORT = process.env.PG_TEST_PORT || 5431
process.env.PG_TEST_DB = process.env.PG_TEST_DB || 'drift'
process.env.PG_TEST_USER = process.env.PG_TEST_USER || 'postgres'
process.env.PG_TEST_PASSWORD = process.env.PG_TEST_PASSWORD || 'postgres'

// GoTrue Authentication Service (used by TestAuthManager)
process.env.GOTRUE_URL = process.env.GOTRUE_URL || 'http://localhost:9998'

// Test Server (used by testClient in tests/setup.js)
process.env.TEST_SERVER_URL =
  process.env.TEST_SERVER_URL || 'http://localhost:3000'

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/*.test.js'],
  slowTestThreshold: 20,
  testTimeout: 30000,
  maxWorkers: 1,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/migrations/**',
    '!src/**/seeds/**',
    '!**/node_modules/**'
  ],
  coveragePathIgnorePatterns: ['/node_modules/', '/migrations/', '/seeds/']
}
