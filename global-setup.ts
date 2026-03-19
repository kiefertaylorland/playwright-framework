import 'dotenv/config';

import fs from 'node:fs/promises';
import path from 'node:path';

import { chromium } from '@playwright/test';

import { LoginPage } from './pages/login.page';
import { getSauceCredentials } from './utils/auth';
import { ROUTES } from './utils/routes';

async function globalSetup(): Promise<void> {
  const credentials = getSauceCredentials();

  // Skip authenticated setup when credentials aren't available (e.g., PRs from forks)
  if (!credentials?.username || !credentials?.password) {
    console.warn(
      'Skipping global setup: missing SAUCE_USERNAME/SAUCE_PASSWORD. Tests requiring auth will be skipped.'
    );
    return;
  }

  const authDirectory = path.resolve(process.cwd(), '.auth');
  const storageStatePath = path.join(authDirectory, 'standard-user.json');

  await fs.mkdir(authDirectory, { recursive: true });

  const browser = await chromium.launch();

  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login(credentials.username, credentials.password);
    await page.waitForURL(ROUTES.INVENTORY, { timeout: 15_000 });

    await context.storageState({ path: storageStatePath });
    await context.close();
  } finally {
    await browser.close();
  }
}

export default globalSetup;
