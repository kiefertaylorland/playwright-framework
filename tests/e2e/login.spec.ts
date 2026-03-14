import { test, expect } from '@fixtures';
import { ERROR_MESSAGES } from '@pages/login.page';
import { INVALID_CREDENTIALS, LOCKED_OUT_USER, getSauceCredentials } from '@utils/auth';
import { ROUTES } from '@utils/routes';

test.use({ storageState: undefined });

test.describe('Authentication - Login', () => {
  test('Successful Login — redirects to inventory', async ({ loginPage, inventoryPage, page }) => {
    const credentials = getSauceCredentials();

    await loginPage.goto();
    await loginPage.login(credentials.username, credentials.password);

    await expect(page).toHaveURL(ROUTES.INVENTORY);
    expect(await inventoryPage.isOnInventoryPage()).toBe(true);
    expect(await loginPage.isErrorVisible()).toBe(false);
  });

  test('Error — locked-out account shows correct message', async ({ loginPage, page }) => {
    const credentials = getSauceCredentials();

    await loginPage.goto();
    await loginPage.login(LOCKED_OUT_USER, credentials.password);

    await expect(page).toHaveURL(ROUTES.LOGIN);
    expect(await loginPage.isErrorVisible()).toBe(true);
    expect(await loginPage.getErrorMessage()).toBe(ERROR_MESSAGES.LOCKED_OUT);
  });

  test('Error — invalid credentials show correct message', async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.login(INVALID_CREDENTIALS.username, INVALID_CREDENTIALS.password);

    await expect(page).toHaveURL(ROUTES.LOGIN);
    expect(await loginPage.isErrorVisible()).toBe(true);
    expect(await loginPage.getErrorMessage()).toBe(ERROR_MESSAGES.INVALID_CREDENTIALS);
  });

  test('Error — empty username shows required message', async ({ loginPage, page }) => {
    const credentials = getSauceCredentials();

    await loginPage.goto();
    await loginPage.fillPassword(credentials.password);
    await loginPage.submit();

    await expect(page).toHaveURL(ROUTES.LOGIN);
    expect(await loginPage.isErrorVisible()).toBe(true);
    expect(await loginPage.getErrorMessage()).toBe(ERROR_MESSAGES.USERNAME_REQUIRED);
  });

  test('Error — empty password shows required message', async ({ loginPage, page }) => {
    const credentials = getSauceCredentials();

    await loginPage.goto();
    await loginPage.fillUsername(credentials.username);
    await loginPage.submit();

    await expect(page).toHaveURL(ROUTES.LOGIN);
    expect(await loginPage.isErrorVisible()).toBe(true);
    expect(await loginPage.getErrorMessage()).toBe(ERROR_MESSAGES.PASSWORD_REQUIRED);
  });
});
