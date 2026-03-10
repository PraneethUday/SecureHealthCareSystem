const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Use 'jsdom' so we can test React components (frontend)
  testEnvironment: 'jest-environment-jsdom',

  // Set up specific things before tests run
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Handle path alias
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  
  // Ignore certain test files that require specific environments
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config
module.exports = createJestConfig(customJestConfig)