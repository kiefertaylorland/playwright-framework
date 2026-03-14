import { type Page } from '@playwright/test';

import { ROUTES } from '@utils/routes';

/**
 * Minimal page object for the SauceDemo product detail page.
 * Scoped to the back-navigation contract defined in
 * specs/002-inventory-listing/contracts/product-detail.md.
 */
export class ProductDetailPage {
  private readonly page: Page;

  // data-test selector (SauceDemo convention — Principle IV compliant)
  private readonly backButtonSelector = '[data-test="back-to-products"]';

  public constructor(page: Page) {
    this.page = page;
  }

  /**
   * Returns true if the current URL matches the product detail page pattern.
   * Checks for '/inventory-item.html' without asserting the id query parameter.
   */
  public isOnDetailPage(): Promise<boolean> {
    return Promise.resolve(this.page.url().includes('/inventory-item.html'));
  }

  /**
   * Clicks the "Back to products" button and waits for navigation back to
   * the inventory page.
   */
  public async goBack(): Promise<void> {
    await this.page.locator(this.backButtonSelector).click();
    await this.page.waitForURL(ROUTES.INVENTORY);
  }
}
