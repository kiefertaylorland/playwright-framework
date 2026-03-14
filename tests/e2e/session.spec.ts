import { test, expect } from '@fixtures';
import { ROUTES } from '@utils/routes';

test.describe('Authentication - Session', () => {
  test('Logout — returns to login and blocks direct inventory URL', async ({ inventoryPage, loginPage, page }) => {
    await inventoryPage.goto();
    await inventoryPage.logout();

    await expect(page).toHaveURL(ROUTES.LOGIN);
    expect(await loginPage.isLoginFormVisible()).toBe(true);

    await page.goto('/inventory.html');
    await expect(page).toHaveURL(ROUTES.LOGIN);
  });

  test('Session persists on page reload', async ({ inventoryPage, loginPage, page }) => {
    await inventoryPage.goto();
    await page.reload();

    await expect(page).toHaveURL(ROUTES.INVENTORY);
    expect(await inventoryPage.isOnInventoryPage()).toBe(true);
    expect(await loginPage.isLoginFormVisible()).toBe(false);
    expect(await inventoryPage.hasInventoryItems()).toBe(true);
  });
});
