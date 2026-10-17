import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:5173',
    video: 'on',
    screenshot: 'on'
  },
  webServer: [
    {
      command: 'npm run dev',
      port: 3001,
      reuseExistingServer: true
    },
    {
      command: 'npm run dev:client',
      port: 5173,
      reuseExistingServer: true
    }
  ]
});
