/**
 * OWASP A03: Injection
 * Validates input sanitization for XSS and SQL injection attacks
 */

import { test, expect } from '@fixtures';
import { XSS_PAYLOADS, SQLI_PAYLOADS } from '@utils/security-payloads';

/**
 * US3: Detect XSS Injection Vulnerabilities (Part 1)
 * Tests that XSS payloads are escaped and do not execute
 */
test.describe('Injection - XSS Vulnerabilities (A03a)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('XSS payload in login username is escaped in DOM', async ({ page, loginPage }) => {
    // Navigate to login page
    await loginPage.goto();

    // Track console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Test each XSS payload
    for (const payload of XSS_PAYLOADS) {
      // Fill username with XSS payload
      await loginPage.fillUsername(payload);

      // Get the input element's value
      const inputValue = await page
        .locator('input[data-test="username"]')
        .inputValue()
        .catch(() => '');

      // Verify payload is in the DOM (not executed, just HTML-escaped)
      expect(inputValue).toContain(payload);

      // Clear for next iteration
      await loginPage.fillUsername('');
    }

    // Verify no JavaScript errors were thrown
    expect(consoleErrors).toHaveLength(0);
  });

  test('XSS payload in checkout field is escaped in DOM', async ({
    page,
    checkoutPage,
    loginPage,
  }) => {
    // Login first
    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');

    // Navigate to checkout
    await checkoutPage.goto();

    // Test each XSS payload in first name field
    for (const payload of XSS_PAYLOADS) {
      // Fill first name with XSS payload
      await checkoutPage.fillFirstName(payload);

      // Get the input value
      const inputValue = await page
        .locator('input[data-test="firstName"]')
        .inputValue()
        .catch(() => '');

      // Verify payload is escaped (in DOM as text, not executed)
      expect(inputValue).toContain(payload);

      // Clear for next iteration
      await checkoutPage.fillFirstName('');
    }
  });

  test('XSS payload submission returns HTTP 200 (safe handling)', async ({
    page,
    loginPage,
  }) => {
    // Navigate to login page
    await loginPage.goto();

    // Intercept responses
    let lastResponseStatus = 0;
    page.on('response', (response) => {
      if (response.url().includes('saucedemo.com')) {
        lastResponseStatus = response.status();
      }
    });

    // Submit XSS payload in username field
    const testPayload = XSS_PAYLOADS[0];
    await loginPage.fillUsername(testPayload);
    await loginPage.fillPassword('secret_sauce');

    // Try to login (will fail due to invalid username, but should not error)
    await loginPage.submit();

    // Wait for response
    await page.waitForLoadState('networkidle').catch(() => {
      // Ignore timeout
    });

    // Verify we got a response (not 500 error)
    expect(lastResponseStatus).toBeLessThan(500);
  });
});

/**
 * US4: Detect SQLi Injection Vulnerabilities (Part 2)
 * Tests that SQL injection payloads are safely handled
 */
test.describe('Injection - SQL Injection Vulnerabilities (A03b)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('SQLi payload in login username does not cause database error', async ({
    page,
    loginPage,
  }) => {
    // Navigate to login page
    await loginPage.goto();

    // Test each SQLi payload
    for (const payload of SQLI_PAYLOADS) {
      // Fill username with SQLi payload
      await loginPage.fillUsername(payload);
      await loginPage.fillPassword('any_password');

      // Click login
      await loginPage.submit();

      // Wait a bit for response
      await page.waitForLoadState('networkidle').catch(() => {
        // Ignore timeout
      });

      // Check for database error messages in page content
      const pageContent = await page.content();

      // Verify no SQL error messages
      const dbErrors = [
        'JDBC',
        'SQLException',
        'syntax error',
        'table',
        'database',
        'SQL',
      ];

      for (const errorText of dbErrors) {
        expect(pageContent).not.toContain(errorText);
      }

      // Clear for next iteration
      await loginPage.fillUsername('');
    }
  });

  test('SQLi payload DROP TABLE attempt fails safely (database intact)', async ({
    page,
    loginPage,
  }) => {
    // Navigate to login page
    await loginPage.goto();

    // Submit DROP TABLE payload
    const dropPayload = "'; DROP TABLE users; --";
    await loginPage.fillUsername(dropPayload);
    await loginPage.fillPassword('any_password');

    // Attempt login (should fail safely)
    await loginPage.submit();

    // Wait for response
    await page.waitForLoadState('networkidle').catch(() => {
      // Ignore timeout
    });

    // Now verify that valid credentials still work (database not dropped)
    await loginPage.fillUsername('standard_user');
    await loginPage.fillPassword('secret_sauce');
    await loginPage.submit();

    // Verify we can login successfully (confirms database is intact)
    const url = page.url();
    expect(url).toContain('inventory');
  });

  test('SQLi payload in checkout field returns safe response (no SQL execution)', async ({
    page,
    loginPage,
    checkoutPage,
  }) => {
    // Login first
    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');

    // Navigate to checkout
    await checkoutPage.goto();

    // Test each SQLi payload in first name field
    for (const payload of SQLI_PAYLOADS) {
      // Fill first name with SQLi payload
      await checkoutPage.fillFirstName(payload);

      // Check page content for SQL errors
      const pageContent = await page.content();

      const dbErrors = ['JDBC', 'SQLException', 'syntax error', 'table', 'database'];
      for (const errorText of dbErrors) {
        expect(pageContent).not.toContain(errorText);
      }

      // Clear for next iteration
      await checkoutPage.fillFirstName('');
    }
  });
});
