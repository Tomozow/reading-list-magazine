module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\.tsx?$': ['ts-jest', { isolatedModules: true }]
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(dexie|fake-indexeddb)/)'
  ],
  moduleNameMapper: {
    '^.+\.css$': '<rootDir>/src/tests/mocks/styleMock.js'
  },
  setupFiles: ['<rootDir>/src/tests/setup.js'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testRegex: '(/__tests__/.*|(\.|/)(test|spec))\.(jsx?|tsx?)$',
};
