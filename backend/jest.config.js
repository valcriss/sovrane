module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageProvider: 'v8',
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!jest.config.js',
    '!**/__tests__/**',
    '!**/*.test.ts',
    '!**/*.spec.ts',
    '!**/tests/**',
    '!adapters/controllers/websocket/**/*.ts',
    '!infrastructure/server.ts',
    '!scripts/**/*.js'
  ],
  coverageThreshold: {
    global: {
      statements: 97,
      branches: 90,
      functions: 100,
      lines: 97,
    }
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  }
};
