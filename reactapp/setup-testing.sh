# 🧪 NODE.JS TEST RUNNER SETUP
# Run these commands in your terminal to set up Node.js testing

# 1. Install testing dependencies
npm install --save-dev jest @types/jest ts-jest

# 2. Create jest.config.js in your reactapp directory
echo 'module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  moduleNameMapping: {
    "^@/(.*)$": "<rootDir>/src/$1"
  },
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"]
};' > jest.config.js

# 3. Create setupTests.ts for localStorage mock
echo 'const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(), 
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(), 
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;' > src/setupTests.ts

# 4. Add test script to package.json
echo "Add this to your package.json scripts section:"
echo '"test": "jest",'
echo '"test:watch": "jest --watch",'
echo '"test:coverage": "jest --coverage"'

# 5. Run the test files we created
echo "Now you can run:"
echo "npm test -- adaptiveFeedback.test.cases.js"
echo "npm test -- progressiveGoals.test.cases.js"