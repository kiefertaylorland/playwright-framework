import { expect, type Page } from '@playwright/test';

import { ROUTES } from '@utils/routes';

// T005 — SortOption type
// Values correspond to the <option value="..."> attributes in the sort dropdown.
export const SORT_OPTIONS = {
  NAME_ASC:   'az',   // Name (A to Z)
  NAME_DESC:  'za',   // Name (Z to A)
  PRICE_ASC:  'lohi', // Price (low to high)
  PRICE_DESC: 'hilo', // Price (high to low)
} as const;

export type SortOption = typeof SORT_OPTIONS[keyof typeof SORT_OPTIONS];

/**
 * Inventory page object extended from the 001 auth-scoped baseline.
 * 002 adds sorting, product name collection, detail navigation, and cart badge.
 */
export class InventoryPage {
  private readonly page: Page;

  // 001 auth-scoped selectors
  private readonly burgerMenuButtonSelector = '#react-burger-menu-btn';
  private readonly logoutSidebarLinkSelector = '#logout_sidebar_link';

  // 002 structural selectors (CSS class fallback — Principle IV justified,
  // SauceDemo does not expose data-test wrappers for card containers;
  // see plan.md Complexity Tracking)
  private readonly inventoryItemSelector = '.inventory_item';
  private readonly inventoryItemDescriptionSelector = '.inventory_item_desc';

  // 002 data-test selectors (data-test is SauceDemo's convention;
  // semantically equivalent to data-testid — Principle IV justified)
  private readonly addToCartButtonSelector = '[data-test^="add-to-cart"]';
  // Note: SauceDemo uses hyphens in data-test for the sort select;
  // research.md documented underscores — corrected here from live DOM inspection.
  private readonly sortDropdownSelector = '[data-test="product-sort-container"]';
  private readonly productNameSelector = '[data-test="inventory-item-name"]';
  private readonly productPriceSelector = '[data-test="inventory-item-price"]';
  private readonly cartBadgeSelector = '[data-test="shopping-cart-badge"]';

  public constructor(page: Page) {
    this.page = page;
  }

  // ----- 001 baseline methods (unchanged) -----

  public async goto(): Promise<void> {
    await this.page.goto(ROUTES.INVENTORY);
    await expect(this.page).toHaveURL(ROUTES.INVENTORY);
  }

  public isOnInventoryPage(): Promise<boolean> {
    return Promise.resolve(/\/inventory\.html(?:\?|$)/.test(this.page.url()));
  }

  public async openBurgerMenu(): Promise<void> {
    const burgerMenuButton = this.page.locator(this.burgerMenuButtonSelector);
    const logoutSidebarLink = this.page.locator(this.logoutSidebarLinkSelector);

    await burgerMenuButton.click();
    await expect(logoutSidebarLink).toBeVisible();
  }

  public async logout(): Promise<void> {
    const logoutSidebarLink = this.page.locator(this.logoutSidebarLinkSelector);

    await this.openBurgerMenu();
    await logoutSidebarLink.click();
    await expect(this.page).toHaveURL(ROUTES.LOGIN);
  }

  /**
   * Minimal inventory presence check for auth session persistence assertions.
   */
  public async hasInventoryItems(): Promise<boolean> {
    const itemCount = await this.page.locator(this.inventoryItemSelector).count();
    return itemCount > 0;
  }

  // ----- 002 US1: Structural count methods -----

  /**
   * Count all product card wrappers rendered on the inventory page.
   * Selector: `.inventory_item`
   */
  public async getProductCount(): Promise<number> {
    return this.page.locator(this.inventoryItemSelector).count();
  }

  /**
   * Count all product description elements rendered on the inventory page.
   * Selector: `.inventory_item_desc`
   */
  public async getDescriptionCount(): Promise<number> {
    return this.page.locator(this.inventoryItemDescriptionSelector).count();
  }

  /**
   * Count all "Add to Cart" buttons rendered on the inventory page.
   * Selector: `[data-test^="add-to-cart"]`
   */
  public async getAddToCartButtonCount(): Promise<number> {
    return this.page.locator(this.addToCartButtonSelector).count();
  }

  // ----- 002 US2: Sort methods -----

  /**
   * Returns all sort dropdown options as {value, label} pairs.
   * Used by T013 to verify the dropdown exposes all four expected options.
   */
  public async getSortOptions(): Promise<Array<{ value: string; label: string }>> {
    // Use evaluate() to read HTMLSelectElement.options — Playwright's locator API
    // cannot reliably query <option> children since they are not "visible" elements.
    return this.page.locator(this.sortDropdownSelector).evaluate(
      (select: HTMLSelectElement) =>
        Array.from(select.options).map((opt) => ({
          value: opt.value,
          label: opt.text.trim(),
        }))
    );
  }

  /**
   * Selects a sort mode from the inventory sort dropdown.
   * SauceDemo sorting is client-side; Playwright's selectOption awaits
   * the DOM update automatically.
   */
  public async sortBy(option: SortOption): Promise<void> {
    await this.page.locator(this.sortDropdownSelector).selectOption(option);
  }

  /**
   * Returns the text of all product name elements in current DOM order.
   * Calling after sortBy() returns the sorted order.
   */
  public async getProductNames(): Promise<string[]> {
    return this.page.locator(this.productNameSelector).allInnerTexts();
  }

  /**
   * Returns the price of each product as a parsed float in current DOM order.
   * Strips the '$' prefix and parses with parseFloat().
   */
  public async getProductPrices(): Promise<number[]> {
    const texts = await this.page.locator(this.productPriceSelector).allInnerTexts();
    return texts.map((t) => parseFloat(t.replace('$', '')));
  }

  // ----- 002 US3: Detail navigation methods -----

  /**
   * Clicks the product name link matching the given text and waits for
   * navigation to the product detail page.
   */
  public async clickProductByName(name: string): Promise<void> {
    await this.page.locator(this.productNameSelector, { hasText: name }).click();
    await this.page.waitForURL(/\/inventory-item\.html/);
  }

  /**
   * Clicks the first product name in DOM order, waits for navigation to the
   * detail page, and returns the product name that was clicked.
   */
  public async clickFirstProduct(): Promise<string> {
    const first = this.page.locator(this.productNameSelector).first();
    const name = await first.innerText();
    await first.click();
    await this.page.waitForURL(/\/inventory-item\.html/);
    return name;
  }

  // ----- 002 US4: Cart badge methods -----

  /**
   * Clicks the "Add to Cart" button for the product at the given 0-based
   * DOM index. Uses the page-object owned add-to-cart selector.
   *
   * NOTE: indices shift after each addition because clicked buttons change
   * to "Remove" and leave the `[data-test^="add-to-cart"]` set.
   * Use `addProductToCartByName` when a specific product is required.
   */
  public async addProductToCartByIndex(index: number): Promise<void> {
    const beforeCount = await this.page.locator(this.addToCartButtonSelector).count();
    await this.page.locator(this.addToCartButtonSelector).nth(index).click();
    // Wait for the clicked button to transition to "Remove", confirming the
    // cart state update is committed before any subsequent interaction.
    await expect(this.page.locator(this.addToCartButtonSelector)).toHaveCount(beforeCount - 1);
  }

  /**
   * Clicks the "Add to Cart" button for the product whose name matches
   * the given string. Scoped to the containing `.inventory_item` row,
   * so it is immune to DOM index shifting caused by previous additions.
   */
  public async addProductToCartByName(name: string): Promise<void> {
    const row = this.page
      .locator(this.inventoryItemSelector)
      .filter({ has: this.page.locator(this.productNameSelector, { hasText: name }) });
    await row.locator(this.addToCartButtonSelector).click();
  }

  /**
   * Returns the cart badge counter text (e.g., "1", "2").
   * Returns null when the badge element is not rendered (empty cart).
   */
  public async getCartBadgeCount(): Promise<string | null> {
    const badge = this.page.locator(this.cartBadgeSelector);
    if (!(await badge.isVisible())) return null;
    return badge.innerText();
  }
}
