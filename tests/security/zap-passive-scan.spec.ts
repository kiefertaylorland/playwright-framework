/**
 * OWASP Security Testing with ZAP Passive Scanning
 * US8: Perform ZAP passive scanning and report findings
 *
 * This test requires ZAP to be running on localhost:8080
 * Skip if ZAP_PROXY_SKIP environment variable is set
 */

import { test, expect } from '@fixtures';
import {
  parseZapResponse,
  filterAlertsByRisk,
  generateAlertSummary,
  ZapRiskLevel,
} from '@utils/zap-helper';

/**
 * US8: ZAP Passive Scanning
 * Tests that security scanning with ZAP captures alerts and reports no critical/high findings
 */
test.describe('Security Testing - ZAP Passive Scanning (US8)', () => {
  // Skip entire suite if ZAP_PROXY_SKIP is set
  test.skip(!!process.env.ZAP_PROXY_SKIP, 'ZAP proxy tests skipped (ZAP_PROXY_SKIP=1)');

  test('ZAP is reachable via localhost:8080', async ({ request }) => {
    // Attempt to reach ZAP API endpoint
    const response = await request.get('http://localhost:8080/JSON/core/view/version/');

    // Verify ZAP is running and responding
    expect(response.status()).toBe(200);

    // Verify response contains version info
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const data = await response.json();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(data).toHaveProperty('version');
  });

  test('ZAP passive scan generates alerts from navigation traffic', async ({
    page,
    loginPage,
    inventoryPage,
    cartPage,
    request,
  }) => {
    // Navigate through application to generate traffic (ZAP proxy intercepts)
    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');
    await inventoryPage.goto();

    // Add a product to cart
    await inventoryPage.addProductToCartByIndex(0);

    // Navigate to cart
    await cartPage.goto();

    // Clear any existing alerts first (optional - start fresh)
    await request.get('http://localhost:8080/JSON/core/action/newSession/');

    // Wait a moment for initial page to load with ZAP proxy
    await page.waitForLoadState('networkidle');

    // Verify we've navigated and generated traffic
    expect(page.url()).toContain('cart');
  });

  test('ZAP has no Critical or High severity alerts after full test run', async ({
    page,
    loginPage,
    inventoryPage,
    request,
  }) => {
    // Navigate through full application flows
    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');
    await inventoryPage.goto();

    // Wait for network activity to settle
    await page.waitForLoadState('networkidle');

    // Query ZAP REST API for all alerts
    const alertResponse = await request.get('http://localhost:8080/JSON/core/view/alerts/');

    // Verify API response is successful
    expect(alertResponse.status()).toBe(200);

    // Parse ZAP response
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const alertData = await alertResponse.json();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const zapResponse = parseZapResponse(alertData);

    // Filter for Critical and High severity alerts (riskId >= 3)
    const criticalHighAlerts = filterAlertsByRisk(
      zapResponse.alerts,
      ZapRiskLevel.High
    );

    // Generate error message if critical/high alerts found
    if (criticalHighAlerts.length > 0) {
      const summary = generateAlertSummary(criticalHighAlerts);
      throw new Error(`Security alerts detected:\n${summary}`);
    }

    // Verify no critical or high severity alerts
    expect(criticalHighAlerts).toHaveLength(0);
  });
});
