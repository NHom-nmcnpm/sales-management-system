import { defineConfig } from 'vitest/config';
import './src/config/env.js';

export default defineConfig({
  test: {
    fileParallelism: false,
    setupFiles: ['tests/setup.js'],
    testTimeout: 15000,
    hookTimeout: 20000,
  },
});
