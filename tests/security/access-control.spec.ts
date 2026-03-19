/**
 * OWASP A01: Broken Access Control
 * Validates that unauthenticated users cannot access protected routes
 */

import { test, expect } from '@fixtures';

/**
 * US1: Detect Broken Access Control
 * Tests that protected routes redirect unauthenticated users to login
 */
test.describe('Access Control - Broken Access (A01)', () => {
  // Create a fresh, unauthenticated context for these tests
  test.use({ storageState: { cookies: [], origins: [] } });

  test('unauthenticated user redirected from /inventory.html to home (access denied)', async ({
    page,
  }) => {
    // Navigate to protected inventory route without authentication
    await page.goto('/inventory.html');

    // Verify redirect to home page (SauceDemo redirects to / instead of login for unauthenticated access)
    expect(page.url()).toMatch(/saucedemo\.com\/?$/);
  });

  test('unauthenticated user redirected from /cart.html to home (access denied)', async ({ page }) => {
    // Navigate to protected cart route without authentication
    await page.goto('/cart.html');

    // Verify redirect to home page
    expect(page.url()).toMatch(/saucedemo\.com\/?$/);
  });

  test('unauthenticated user redirected from /checkout-step-one.html to home (access denied)', async ({
    page,
  }) => {
    // Navigate to protected checkout route without authentication
    await page.goto('/checkout-step-one.html');

    // Verify redirect to home page
    expect(page.url()).toMatch(/saucedemo\.com\/?$/);
  });
});
