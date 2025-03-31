module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      isolatedModules: true
    }]
  },
  moduleNameMapper: {
    '^.+\\.css$': '<rootDir>/src/tests/mocks/styleMock.js'
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(dexie|@mozilla)/)'
  ],
  setupFiles: ['<rootDir>/src/tests/setup.js'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx']
};
