import { expect, test } from '@fixtures';

import { SORT_OPTIONS } from '@pages/inventory.page';

// ---------------------------------------------------------------------------
// US1 — Product Catalogue Display (Priority: P1)
// Verifies that the inventory page renders exactly 6 product cards, each with
// all four required elements: name, description, price, and add-to-cart button.
// ---------------------------------------------------------------------------
test.describe('Product Catalogue', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.goto();
  });

  // T010
  test('displays 6 product cards', async ({ inventoryPage }) => {
    const count = await inventoryPage.getProductCount();
    expect(count).toBe(6);
  });

  // T011 — SC-001 structural parity proof
  test('each card has name, description, price, and add-to-cart button', async ({ inventoryPage }) => {
    const productCount = await inventoryPage.getProductCount();
    const descriptionCount = await inventoryPage.getDescriptionCount();
    const buttonCount = await inventoryPage.getAddToCartButtonCount();

    expect(productCount).toBe(6);
    expect(descriptionCount).toBe(productCount);
    expect(buttonCount).toBe(productCount);
  });
});

// ---------------------------------------------------------------------------
// US2 — Product Sorting (Priority: P2)
// Verifies all four sort modes exist in the dropdown and correctly reorder
// the catalogue. Sort option values and labels are read from the page object.
// ---------------------------------------------------------------------------
test.describe('Sorting', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.goto();
  });

  // T013
  test('sort dropdown has exactly 4 options with correct labels and values', async ({ inventoryPage }) => {
    const options = await inventoryPage.getSortOptions();

    expect(options).toHaveLength(4);
    expect(options.map((o) => o.value)).toEqual([
      SORT_OPTIONS.NAME_ASC,
      SORT_OPTIONS.NAME_DESC,
      SORT_OPTIONS.PRICE_ASC,
      SORT_OPTIONS.PRICE_DESC,
    ]);
    expect(options.map((o) => o.label)).toEqual([
      'Name (A to Z)',
      'Name (Z to A)',
      'Price (low to high)',
      'Price (high to low)',
    ]);
  });

  // T014
  test('Name (A to Z) orders product names ascending', async ({ inventoryPage }) => {
    await inventoryPage.sortBy(SORT_OPTIONS.NAME_ASC);
    const names = await inventoryPage.getProductNames();
    expect(names).toEqual([...names].sort());
  });

  // T015
  test('Name (Z to A) orders product names descending', async ({ inventoryPage }) => {
    await inventoryPage.sortBy(SORT_OPTIONS.NAME_DESC);
    const names = await inventoryPage.getProductNames();
    expect(names).toEqual([...names].sort().reverse());
  });

  // T016
  test('Price (low to high) orders prices ascending', async ({ inventoryPage }) => {
    await inventoryPage.sortBy(SORT_OPTIONS.PRICE_ASC);
    const prices = await inventoryPage.getProductPrices();
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  // T017
  test('Price (high to low) orders prices descending', async ({ inventoryPage }) => {
    await inventoryPage.sortBy(SORT_OPTIONS.PRICE_DESC);
    const prices = await inventoryPage.getProductPrices();
    expect(prices).toEqual([...prices].sort((a, b) => b - a));
  });
});

// ---------------------------------------------------------------------------
// US3 — Product Detail Navigation (Priority: P3)
// Verifies click-through from the inventory listing to a product detail page
// and back-navigation to the inventory page.
// ---------------------------------------------------------------------------
test.describe('Product Detail Navigation', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.goto();
  });

  // T020
  test('clicking a product name navigates to its detail page', async ({ inventoryPage, productDetailPage }) => {
    await inventoryPage.clickProductByName('Sauce Labs Backpack');
    const onDetail = await productDetailPage.isOnDetailPage();
    expect(onDetail).toBe(true);
  });

  // T021
  test('back button returns to the inventory page', async ({ inventoryPage, productDetailPage }) => {
    await inventoryPage.clickProductByName('Sauce Labs Backpack');
    await productDetailPage.goBack();
    const onInventory = await inventoryPage.isOnInventoryPage();
    expect(onInventory).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// US4 — Cart Badge Counter (Priority: P4)
// Verifies that the cart badge increments correctly with each "Add to Cart"
// action and reflects the cumulative total (SC-005: sequences 1 through 3).
// ---------------------------------------------------------------------------
test.describe('Cart Badge Counter', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.goto();
  });

  // T024
  test('badge shows 1 after first product is added', async ({ inventoryPage }) => {
    await inventoryPage.addProductToCartByIndex(0);
    const count = await inventoryPage.getCartBadgeCount();
    expect(count).toBe('1');
  });

  // T025
  test('badge shows 2 after second product is added', async ({ inventoryPage }) => {
    await inventoryPage.addProductToCartByIndex(0);
    await inventoryPage.addProductToCartByIndex(1);
    const count = await inventoryPage.getCartBadgeCount();
    expect(count).toBe('2');
  });

  // T025b — added to satisfy SC-005 "sequences of 1 through at least 3"
  test('badge shows 3 after third product is added (SC-005)', async ({ inventoryPage }) => {
    await inventoryPage.addProductToCartByIndex(0);
    await inventoryPage.addProductToCartByIndex(1);
    await inventoryPage.addProductToCartByIndex(2);
    const count = await inventoryPage.getCartBadgeCount();
    expect(count).toBe('3');
  });
});
