import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config({ quiet: true });

export default defineConfig({
  testDir: './tests/e2e', fullyParallel: false, workers: 1, timeout: 30000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://localhost:5173', browserName: 'chromium', viewport: { width: 1440, height: 1000 }, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: [
    { command: 'npm run dev -w backend', url: 'http://localhost:3000/api/v1/health/live', reuseExistingServer: !process.env.CI },
    { command: 'npm run dev -w frontend', url: 'http://localhost:5173', reuseExistingServer: !process.env.CI }
  ]
});
