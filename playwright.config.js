import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config({ quiet: true });
const e2eDatabase = new URL(process.env.TEST_DATABASE_URL);
e2eDatabase.pathname = e2eDatabase.pathname.replace(/_test$/, '_e2e_test');
process.env.E2E_DATABASE_URL = e2eDatabase.toString();

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  globalSetup: './tests/e2e/global-setup.js',
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5174',
    browserName: 'chromium',
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'npm run dev -w backend',
      url: 'http://localhost:3001/api/v1/health/live',
      reuseExistingServer: false,
      env: {
        DATABASE_URL: e2eDatabase.toString(),
        PORT: '3001',
        APP_ORIGIN: 'http://localhost:5174',
        NODE_ENV: 'test',
      },
    },
    {
      command: 'npm run dev -w frontend -- --port 5174 --strictPort',
      url: 'http://localhost:5174',
      reuseExistingServer: false,
      env: { VITE_API_TARGET: 'http://localhost:3001' },
    },
  ],
});
