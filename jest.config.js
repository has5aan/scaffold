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
process.env.PG_TEST_PORT = process.env.PG_TEST_PORT || 5432
process.env.PG_TEST_DB = process.env.PG_TEST_DB || 'scaffold'
process.env.PG_TEST_USER = process.env.PG_TEST_USER || 'postgres'
process.env.PG_TEST_PASSWORD = process.env.PG_TEST_PASSWORD || 'postgres'

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Module paths for path aliases
  moduleNameMapper: {
    '^@lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@auth/(.*)$': '<rootDir>/src/auth/$1',
    '^@example/(.*)$': '<rootDir>/src/example/$1',
    '^@transport/(.*)$': '<rootDir>/src/transport/$1',
    '^@platforms/(.*)$': '<rootDir>/src/platforms/$1'
  },

  // Test match patterns
  testMatch: ['**/*.test.js'],

  // Coverage configuration
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.js', '!src/**/*.test.js', '!src/**/index.js'],

  // File extensions to consider
  moduleFileExtensions: ['js', 'json', 'node'],

  // Setup files
  setupFilesAfterEnv: [],

  // Ignore patterns
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],

  // Performance
  slowTestThreshold: 20,

  // Global settings
  verbose: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
}
