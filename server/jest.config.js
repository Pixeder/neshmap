// jest.config.js
import dotenv from 'dotenv';

// Load variables from server .env file
dotenv.config();

export default {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(t|j)sx?$': [
      '@swc/jest',
      {
        jsc: {
          parser: {
            syntax: 'typescript',
            tsx: false,
            decorators: true,
          },
          target: 'es2022',
        },
      },
    ],
  },
  moduleNameMapper: {
    '^(\\..*)\\.js$': '$1',
  },
  extensionsToTreatAsEsm: ['.ts'],
  testTimeout: 120000, // 2 minutes for LLM operations
};