import { test, expect } from '@fixtures';
import {
  createDefaultSecurityTargets,
  createSecurityCheck,
  getSauceDemoSecurityCredentials,
  OWASP,
  SECURITY_PAYLOADS,
} from '@utils/security-targets';
import {
  annotateFindings,
  appendSecurityReport,
  createFinding,
  type SecurityFinding,
} from '@utils/security-report';
import { ROUTES } from '@utils/routes';

test.use({ storageState: undefined });

test.describe('SauceDemo Security Discovery', () => {
  test('records auth and session behavior observations', async ({
    loginPage,
    inventoryPage,
    page,
  }, testInfo) => {
    const credentials = getSauceDemoSecurityCredentials();
    const check = createSecurityCheck({
      id: 'saucedemo-auth-session',
      targetId: 'saucedemo',
      category: 'authentication-session',
      owaspCategory: OWASP.AUTH_FAILURES,
    });

    await loginPage.goto();
    await loginPage.login(credentials.username, credentials.password);
    await expect(page).toHaveURL(ROUTES.INVENTORY);

    const reachedInventory = await inventoryPage.isOnInventoryPage();
    const findings: SecurityFinding[] = [
      createFinding({
        id: 'saucedemo-auth-session-observed',
        severity: reachedInventory ? 'INFO' : 'MEDIUM',
        targetId: 'saucedemo',
        checkId: check.id,
        title: 'SauceDemo authentication/session behavior observed',
        status: 'observed',
        owaspCategory: OWASP.AUTH_FAILURES,
        evidence: `credentialSource=${credentials.credentialSource}; reachedInventory=${String(reachedInventory)}; currentUrl=${loginPage.getCurrentUrl()}`,
        nextAction: reachedInventory
          ? 'Use this as baseline authentication behavior for later enforcement checks'
          : 'Review unexpected login/session behavior',
      }),
    ];

    annotateFindings(testInfo, findings);
    await appendSecurityReport({
      targets: createDefaultSecurityTargets(),
      checks: [check],
      findings,
    });

    expect(findings.length).toBeGreaterThan(0);
  });

  test('records login payload handling observations', async ({ loginPage }, testInfo) => {
    const check = createSecurityCheck({
      id: 'saucedemo-login-payloads',
      targetId: 'saucedemo',
      category: 'input-sanitization',
      owaspCategory: OWASP.INJECTION,
    });
    const findings: SecurityFinding[] = [];

    for (const payload of SECURITY_PAYLOADS) {
      await loginPage.goto();
      await loginPage.login(payload.value, payload.value);

      const html = await loginPage.getRenderedHtml();
      const reflected = html.includes(payload.value);
      const url = loginPage.getCurrentUrl();
      const reachedInventory = url.includes('/inventory.html');
      const errorVisible = await loginPage.isErrorVisible();

      findings.push(
        createFinding({
          id: `saucedemo-login-${payload.id}`,
          severity: reflected || reachedInventory ? 'MEDIUM' : 'INFO',
          targetId: 'saucedemo',
          checkId: check.id,
          title: `SauceDemo login handled ${payload.label}`,
          status: reflected || reachedInventory ? 'review-needed' : 'observed',
          owaspCategory: payload.owaspCategory,
          evidence: `payload=${payload.id}; reflected=${String(reflected)}; reachedInventory=${String(reachedInventory)}; errorVisible=${String(errorVisible)}; currentUrl=${url}`,
          nextAction: reflected || reachedInventory
            ? 'Review login input handling and response encoding'
            : 'Keep as Discovery Mode baseline observation',
        }),
      );
    }

    annotateFindings(testInfo, findings);
    await appendSecurityReport({
      targets: createDefaultSecurityTargets(),
      checks: [check],
      findings,
    });

    expect(findings).toHaveLength(SECURITY_PAYLOADS.length);
  });

  test('records checkout payload handling without finishing checkout', async ({
    loginPage,
    inventoryPage,
    cartPage,
    checkoutPage,
  }, testInfo) => {
    const credentials = getSauceDemoSecurityCredentials();
    const payload = SECURITY_PAYLOADS[0];
    const check = createSecurityCheck({
      id: 'saucedemo-checkout-payloads',
      targetId: 'saucedemo',
      category: 'input-sanitization',
      owaspCategory: OWASP.INJECTION,
    });

    await loginPage.goto();
    await loginPage.login(credentials.username, credentials.password);
    await inventoryPage.goto();
    await inventoryPage.addProductToCartByIndex(0);
    await cartPage.goto();
    await checkoutPage.startCheckoutFromCart();
    await checkoutPage.fillFirstName(payload.value);
    await checkoutPage.fillLastName(payload.value);
    await checkoutPage.fillPostalCode(payload.value);
    await checkoutPage.clickContinue();

    const html = await checkoutPage.getRenderedHtml();
    const reflected = html.includes(payload.value);
    const currentUrl = checkoutPage.getCurrentUrl();
    const advancedToStepTwo = currentUrl.includes('/checkout-step-two.html');
    const completedOrder = currentUrl.includes('/checkout-complete.html');
    const findings = [
      createFinding({
        id: 'saucedemo-checkout-xss-like-payload',
        severity: reflected || completedOrder ? 'MEDIUM' : 'INFO',
        targetId: 'saucedemo',
        checkId: check.id,
        title: 'SauceDemo checkout handled harmless payloads',
        status: reflected || completedOrder ? 'review-needed' : 'observed',
        owaspCategory: OWASP.INJECTION,
        evidence: `payload=${payload.id}; reflected=${String(reflected)}; advancedToStepTwo=${String(advancedToStepTwo)}; completedOrder=${String(completedOrder)}; currentUrl=${currentUrl}`,
        nextAction: reflected || completedOrder
          ? 'Review checkout output encoding and order-flow controls'
          : 'Keep as Discovery Mode baseline observation',
      }),
    ];

    annotateFindings(testInfo, findings);
    await appendSecurityReport({
      targets: createDefaultSecurityTargets(),
      checks: [check],
      findings,
    });

    expect(completedOrder).toBe(false);
  });
});
