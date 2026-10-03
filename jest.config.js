const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: "./",
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Use 'jsdom' so we can test React components (frontend)
  testEnvironment: "jest-environment-jsdom",

  // Set up specific things before tests run
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],

  // Handle path alias
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },

  testMatch: ["**/__tests__/**/*.test.[jt]s?(x)"],
  // The access-control suite needs a live Supabase stack; it has its own
  // config (jest.access.config.js, `npm run test:access`).
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/__tests__/access-control/"],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config
module.exports = createJestConfig(customJestConfig);
