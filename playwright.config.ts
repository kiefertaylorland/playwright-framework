import 'dotenv/config';

import { defineConfig, devices } from '@playwright/test';

const recordArtifacts = process.env.PW_RECORD_ARTIFACTS === '1';

export default defineConfig({
  testDir: './tests',
  globalSetup: require.resolve('./global-setup'),
  outputDir: 'test-results',
  preserveOutput: 'always',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['allure-playwright', { outputFolder: 'reports/allure-results' }],
  ],
  use: {
    baseURL: 'https://www.saucedemo.com',
    trace: recordArtifacts ? 'on' : 'retain-on-failure',
    screenshot: recordArtifacts ? 'on' : 'only-on-failure',
    video: recordArtifacts ? 'on' : 'retain-on-failure',
    storageState: '.auth/standard-user.json',
  },
  projects: [
    {
      name: 'api',
      testMatch: '**/tests/api/**/*.spec.ts',
    },
    {
      name: 'chromium',
      testIgnore: '**/tests/api/**',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      testIgnore: '**/tests/api/**',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      testIgnore: '**/tests/api/**',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
