import { expect, type Page } from '@playwright/test';

import { ROUTES } from '@utils/routes';

export interface CartItem {
  name: string;
  description: string;
  priceText: string;
}

/**
 * CartPage owns all selectors and interactions for /cart.html.
 * Tests must not reference any selectors directly.
 */
export class CartPage {
  private readonly page: Page;

  // Cart row selectors
  private readonly itemNameSelector = '[data-test="inventory-item-name"]';
  private readonly itemDescSelector = '[data-test="inventory-item-desc"]';
  private readonly itemPriceSelector = '[data-test="inventory-item-price"]';
  private readonly removeButtonSelector = '[data-test^="remove-"]';

  // Cart action selectors
  private readonly continueShoppingSelector = '[data-test="continue-shopping"]';
  private readonly checkoutSelector = '[data-test="checkout"]';

  // Badge selector (shared with header)
  private readonly cartBadgeSelector = '[data-test="shopping-cart-badge"]';

  public constructor(page: Page) {
    this.page = page;
  }

  // ----- T004: Navigation -----

  public async goto(): Promise<void> {
    await this.page.goto(ROUTES.CART);
    await expect(this.page).toHaveURL(ROUTES.CART);
  }

  public isOnCartPage(): Promise<boolean> {
    return Promise.resolve(this.page.url().includes('/cart.html'));
  }

  // ----- T005: Cart row readers -----

  /**
   * Returns all cart row details (name, description, priceText) in DOM order.
   */
  public async getCartItems(): Promise<CartItem[]> {
    const names = await this.page.locator(this.itemNameSelector).allInnerTexts();
    const descs = await this.page.locator(this.itemDescSelector).allInnerTexts();
    const prices = await this.page.locator(this.itemPriceSelector).allInnerTexts();

    return names.map((name, i) => ({
      name,
      description: descs[i] ?? '',
      priceText: prices[i] ?? '',
    }));
  }

  /**
   * Returns all cart item names in DOM order.
   */
  public async getCartItemNames(): Promise<string[]> {
    return this.page.locator(this.itemNameSelector).allInnerTexts();
  }

  /**
   * Returns the count of cart row items.
   */
  public async getCartRowCount(): Promise<number> {
    return this.page.locator(this.itemNameSelector).count();
  }

  // ----- T006: Badge -----

  /**
   * Returns the cart badge count as a number. Returns 0 when badge is not visible.
   */
  public async getCartBadgeCount(): Promise<number> {
    const badge = this.page.locator(this.cartBadgeSelector);
    if (!(await badge.isVisible())) {
      return 0;
    }
    const text = (await badge.textContent())?.trim() ?? '0';
    return Number.parseInt(text, 10);
  }

  // ----- T007: Item removal -----

  /**
   * Clicks the remove button for the item matching the given name.
   * Waits for the row to disappear from the DOM.
   */
  public async removeItemByName(name: string): Promise<void> {
    // Build the product-specific remove button by resolving the slug from
    // the item row that contains the matching name element.
    const itemRow = this.page
      .locator('.cart_item')
      .filter({ has: this.page.locator(this.itemNameSelector, { hasText: name }) });

    const removeButton = itemRow.locator(this.removeButtonSelector);
    await removeButton.click();

    // Wait for the row to be removed from the DOM.
    await expect(itemRow).not.toBeAttached();
  }

  // ----- T008: Cart action buttons -----

  /**
   * Clicks "Continue Shopping" and waits to return to the inventory page.
   */
  public async clickContinueShopping(): Promise<void> {
    await this.page.locator(this.continueShoppingSelector).click();
    await this.page.waitForURL(ROUTES.INVENTORY);
  }

  /**
   * Clicks "Checkout" and waits to arrive at checkout step one.
   */
  public async clickCheckout(): Promise<void> {
    await this.page.locator(this.checkoutSelector).click();
    await this.page.waitForURL(ROUTES.CHECKOUT_STEP_ONE);
  }
}
