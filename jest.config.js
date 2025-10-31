process.env.PINO_TRANSPORT_TARGETS = 'file|console'
process.env.NODE_ENV = 'test'
process.env.PG_TEST_HOST = 'localhost'
process.env.PG_TEST_PORT = 5432
process.env.PG_TEST_DB = 'scaffold_test'
process.env.PG_TEST_USER = 'postgres'
process.env.PG_TEST_PASSWORD = 'postgres'

module.exports = {
  // Use ts-jest for TypeScript files
  preset: 'ts-jest/presets/js-with-ts',

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

  // Test match patterns (both .js and .ts)
  testMatch: ['**/*.test.js', '**/*.test.ts'],

  // Coverage configuration
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.test.{js,ts}',
    '!src/**/*.d.ts',
    '!src/**/index.{js,ts}'
  ],

  // Transform configuration
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          // Allow JavaScript files in TypeScript project
          allowJs: true,
          // Don't type check test files for faster execution
          isolatedModules: true
        }
      }
    ]
  },

  // File extensions to consider
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

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
