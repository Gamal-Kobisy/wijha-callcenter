module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/tests/**/*.test.ts', '<rootDir>/src/tests/**/*.test.cts'],
  setupFiles: ['dotenv/config'],
  setupFilesAfterEnv: ['<rootDir>/src/tests/jest.setup.cjs'],
  transform: {
    '^.+\\.(ts|cts)$': ['ts-jest', { tsconfig: {"module": "commonjs", "target": "esnext"}, useESM: false }],
  },
  moduleNameMapper: {
    '^\\.\\./app$': '<rootDir>/src/tests/__mocks__/app.cjs',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  clearMocks: true,
};