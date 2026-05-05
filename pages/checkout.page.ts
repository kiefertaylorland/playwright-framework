import { expect, type Page } from '@playwright/test';

import { ROUTES } from '@utils/routes';

export interface CheckoutInfo {
  firstName: string;
  lastName: string;
  postalCode: string;
}

export const CHECKOUT_ERRORS = {
  FIRST_NAME_REQUIRED: 'Error: First Name is required',
  LAST_NAME_REQUIRED: 'Error: Last Name is required',
  POSTAL_CODE_REQUIRED: 'Error: Postal Code is required',
} as const;

/**
 * CheckoutPage owns all selectors and interactions across the 3-step
 * SauceDemo checkout funnel: cart entry, step 1 (personal info), step 2
 * (order summary), and step 3 (confirmation). Tests must not reference
 * any selectors directly.
 */
export class CheckoutPage {
  private readonly page: Page;

  // Cart entry
  private readonly cartCheckoutSelector = '[data-test="checkout"]';

  // Step 1 — personal info form
  private readonly firstNameSelector = '[data-test="firstName"]';
  private readonly lastNameSelector = '[data-test="lastName"]';
  private readonly postalCodeSelector = '[data-test="postalCode"]';
  private readonly continueSelector = '[data-test="continue"]';
  private readonly cancelSelector = '[data-test="cancel"]';
  private readonly errorBannerSelector = '[data-test="error"]';

  // Step 2 — order summary
  private readonly summaryItemNameSelector = '[data-test="inventory-item-name"]';
  private readonly summaryItemPriceSelector = '[data-test="inventory-item-price"]';
  private readonly subtotalLabelSelector = '[data-test="subtotal-label"]';
  private readonly taxLabelSelector = '[data-test="tax-label"]';
  private readonly totalLabelSelector = '[data-test="total-label"]';
  private readonly finishSelector = '[data-test="finish"]';

  // Step 3 — confirmation
  private readonly completeHeaderSelector = '[data-test="complete-header"]';

  public constructor(page: Page) {
    this.page = page;
  }

  // ----- Cart entry -----

  /**
   * Clicks Checkout on the cart page and waits for step 1 to load.
   * Must be called while the browser is already on /cart.html.
   */
  public async startCheckoutFromCart(): Promise<void> {
    await this.page.locator(this.cartCheckoutSelector).click();
    await this.page.waitForURL(ROUTES.CHECKOUT_STEP_ONE);
  }

  // ----- Step 1 navigation guards -----

  public isOnStepOne(): Promise<boolean> {
    return Promise.resolve(this.page.url().includes('/checkout-step-one.html'));
  }

  public isOnStepTwo(): Promise<boolean> {
    return Promise.resolve(this.page.url().includes('/checkout-step-two.html'));
  }

  public isOnCompleteStep(): Promise<boolean> {
    return Promise.resolve(this.page.url().includes('/checkout-complete.html'));
  }

  // ----- Step 1 form interactions -----

  public async fillFirstName(value: string): Promise<void> {
    await this.page.locator(this.firstNameSelector).fill(value);
  }

  public async fillLastName(value: string): Promise<void> {
    await this.page.locator(this.lastNameSelector).fill(value);
  }

  public async fillPostalCode(value: string): Promise<void> {
    await this.page.locator(this.postalCodeSelector).fill(value);
  }

  /**
   * Clicks the Continue button on step 1 without waiting for navigation.
   * Use this when testing validation errors that keep the user on step 1.
   * For the happy path, use `continueFromStepOne()` instead.
   */
  public async clickContinue(): Promise<void> {
    await this.page.locator(this.continueSelector).click();
  }

  /**
   * Clicks Continue on step 1 and waits for step 2 to load.
   * Precondition: all required fields are already filled.
   */
  public async continueFromStepOne(): Promise<void> {
    await this.page.locator(this.continueSelector).click();
    await this.page.waitForURL(ROUTES.CHECKOUT_STEP_TWO);
  }

  /**
   * Clicks Cancel on step 1 and waits to return to the cart.
   */
  public async cancelFromStepOne(): Promise<void> {
    await this.page.locator(this.cancelSelector).click();
    await this.page.waitForURL(ROUTES.CART);
  }

  /**
   * Convenience: fills all step 1 fields and continues to step 2.
   */
  public async completeStepOne(info: CheckoutInfo): Promise<void> {
    await this.fillFirstName(info.firstName);
    await this.fillLastName(info.lastName);
    await this.fillPostalCode(info.postalCode);
    await this.continueFromStepOne();
  }

  /**
   * Returns the text content of the step 1 validation error banner.
   * Waits for the banner to become visible before reading.
   */
  public async getStepOneErrorMessage(): Promise<string> {
    const banner = this.page.locator(this.errorBannerSelector);
    await expect(banner).toBeVisible();
    return (await banner.textContent())?.trim() ?? '';
  }

  // ----- Step 2 order summary reads -----

  /**
   * Returns the names of all item rows on the step 2 summary page in DOM order.
   */
  public async getSummaryItemNames(): Promise<string[]> {
    return this.page.locator(this.summaryItemNameSelector).allInnerTexts();
  }

  /**
   * Returns each item row price as a parsed float in DOM order.
   */
  public async getSummaryItemPrices(): Promise<number[]> {
    const texts = await this.page
      .locator(this.summaryItemPriceSelector)
      .allInnerTexts();
    return texts.map((t) => this.parseMoneyFromText(t));
  }

  /**
   * Returns the displayed "Item total" value parsed as a float.
   * DOM text format: "Item total: $XX.XX"
   */
  public async getDisplayedItemTotal(): Promise<number> {
    const text = await this.page
      .locator(this.subtotalLabelSelector)
      .innerText();
    return this.parseMoneyFromText(text);
  }

  /**
   * Returns the displayed "Tax" value parsed as a float.
   * DOM text format: "Tax: $X.XX"
   */
  public async getDisplayedTax(): Promise<number> {
    const text = await this.page.locator(this.taxLabelSelector).innerText();
    return this.parseMoneyFromText(text);
  }

  /**
   * Returns the displayed "Total" value parsed as a float.
   * DOM text format: "Total: $XX.XX"
   */
  public async getDisplayedTotal(): Promise<number> {
    const text = await this.page.locator(this.totalLabelSelector).innerText();
    return this.parseMoneyFromText(text);
  }

  /**
   * Clicks Finish on step 2 and waits for the confirmation page to load.
   */
  public async finishCheckout(): Promise<void> {
    await this.page.locator(this.finishSelector).click();
    await this.page.waitForURL(ROUTES.CHECKOUT_COMPLETE);
  }

  /**
   * Clicks Cancel on step 2 and waits to return to the inventory page.
   * Note: SauceDemo intentionally routes step 2 cancel to /inventory.html,
   * not /cart.html.
   */
  public async cancelFromStepTwo(): Promise<void> {
    await this.page.locator(this.cancelSelector).click();
    await this.page.waitForURL(ROUTES.INVENTORY);
  }

  // ----- Step 3 confirmation -----

  /**
   * Returns the text content of the step 3 confirmation header.
   * Expected value: "Thank you for your order!"
   */
  public async getConfirmationHeader(): Promise<string> {
    return (
      await this.page.locator(this.completeHeaderSelector).innerText()
    ).trim();
  }

  public getCurrentUrl(): string {
    return this.page.url();
  }

  public async getRenderedHtml(): Promise<string> {
    return this.page.content();
  }

  // ----- Private helpers -----

  /**
   * Strips non-numeric characters (except '.') and parses with parseFloat.
   * Handles SauceDemo label formats such as "Item total: $39.98", "Tax: $3.20",
   * "Total: $43.18", and plain price strings like "$29.99".
   */
  private parseMoneyFromText(text: string): number {
    return parseFloat(text.replace(/[^0-9.]/g, ''));
  }
}
