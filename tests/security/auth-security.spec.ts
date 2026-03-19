/**
 * OWASP A07: Authentication and Session Management
 * Validates account lockout and session invalidation
 */

import { test, expect } from '@fixtures';
import { LOCKED_OUT_USER } from '@utils/auth';

/**
 * US6: Enforce Session Lockout on Failed Attempts
 * Tests that locked-out users cannot login with correct credentials
 */
test.describe('Authentication - Session Lockout (A07a)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('locked-out user cannot login with correct credentials', async ({ loginPage }) => {
    // Navigate to login page
    await loginPage.goto();

    // Attempt login with locked-out user credentials
    await loginPage.login(LOCKED_OUT_USER.username, LOCKED_OUT_USER.password);

    // Verify login failed (still on login page or error visible)
    const isErrorVisible = await loginPage.isErrorVisible();
    expect(isErrorVisible).toBe(true);

    // Verify we're still on login page or error message is shown
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toBeTruthy();
  });

  test('login rejection for locked-out user does not reveal user enumeration', async ({ loginPage }) => {
    // Navigate to login page
    await loginPage.goto();

    // Attempt login with locked-out user
    await loginPage.login(LOCKED_OUT_USER.username, LOCKED_OUT_USER.password);

    // Get error message
    const errorMessage = await loginPage.getErrorMessage();

    // Verify error message mentions lockout (not "user not found" which would enumerate users)
    expect(errorMessage.toLowerCase()).toContain('locked');

    // Verify error does NOT reveal user enumeration
    expect(errorMessage).not.toContain('user not found');
    expect(errorMessage).not.toContain('does not exist');
  });
});

/**
 * US7: Invalidate Session on Logout
 * Tests that session cookies are cleared after logout and protected routes deny access
 */
test.describe('Authentication - Session Invalidation (A07b)', () => {
  test.use({ storageState: '.auth/standard-user.json' });

  test('session cookie cleared after logout', async ({ page, inventoryPage }) => {
    // Navigate to inventory (authenticated page)
    await inventoryPage.goto();

    // Get cookies before logout
    const cookiesBefore = await page.context().cookies();
    const sessionCookieBefore = cookiesBefore.find((c) => c.name === 'session-username');

    // Verify session cookie exists
    expect(sessionCookieBefore).toBeDefined();
    expect(sessionCookieBefore?.value).toBeTruthy();

    // Perform logout
    await inventoryPage.logout();

    // Get cookies after logout
    const cookiesAfter = await page.context().cookies();
    const sessionCookieAfter = cookiesAfter.find((c) => c.name === 'session-username');

    // Verify session cookie is cleared or removed
    if (sessionCookieAfter) {
      // If cookie still exists, it should have empty value
      expect(sessionCookieAfter.value).toBeFalsy();
    }
  });

  test('logged-out user cannot access protected route', async ({
    page,
    inventoryPage,
    loginPage,
  }) => {
    // Login and navigate to inventory
    await inventoryPage.goto();

    // Verify we're on inventory page
    const onInventoryBefore = await inventoryPage.isOnInventoryPage();
    expect(onInventoryBefore).toBe(true);

    // Perform logout
    await inventoryPage.logout();

    // Verify we're redirected to login page after logout
    const onLoginAfter = await loginPage.isOnLoginPage();
    expect(onLoginAfter).toBe(true);

    // Now try to access protected route directly (without using page object)
    // Navigate to cart page while logged out
    await page.goto('/cart.html');

    // Verify redirect back to login/home
    const url = page.url();
    expect(url).toMatch(/saucedemo\.com\/?$/);
  });
});
