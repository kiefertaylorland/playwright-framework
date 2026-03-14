import { expect, test } from '@fixtures';

// ---------------------------------------------------------------------------
// US1 — Cart Item Display (Priority: P1) MVP
// Verifies the cart shows exactly the items that were added, with correct
// row count, badge count, and full row details (name, description, price).
// ---------------------------------------------------------------------------
test.describe('Cart Item Display', () => {
  // T012
  test('one added product appears as exactly one cart row with matching badge', async ({
    inventoryPage,
    cartPage,
  }) => {
    await inventoryPage.goto();
    await inventoryPage.addProductToCartByIndex(0);

    await cartPage.goto();

    const rowCount = await cartPage.getCartRowCount();
    const badgeCount = await cartPage.getCartBadgeCount();

    expect(rowCount).toBe(1);
    expect(badgeCount).toBe(1);
  });

  // T013
  test('three added products appear as exactly three cart rows with matching badge', async ({
    inventoryPage,
    cartPage,
  }) => {
    await inventoryPage.goto();
    await inventoryPage.addProductToCartByIndex(0);
    await inventoryPage.addProductToCartByIndex(1);
    await inventoryPage.addProductToCartByIndex(2);

    await cartPage.goto();

    const rowCount = await cartPage.getCartRowCount();
    const badgeCount = await cartPage.getCartBadgeCount();

    expect(rowCount).toBe(3);
    expect(badgeCount).toBe(3);
  });

  // T014 — row-content detail verification
  test('each cart row includes name, description, and price', async ({
    inventoryPage,
    cartPage,
  }) => {
    await inventoryPage.goto();
    await inventoryPage.addProductToCartByIndex(0);
    await inventoryPage.addProductToCartByIndex(1);
    await inventoryPage.addProductToCartByIndex(2);

    await cartPage.goto();

    const items = await cartPage.getCartItems();

    expect(items).toHaveLength(3);
    for (const item of items) {
      expect(item.name.trim()).not.toBe('');
      expect(item.description.trim()).not.toBe('');
      expect(item.priceText.trim()).toMatch(/^\$\d+\.\d{2}$/);
    }
  });
});

// ---------------------------------------------------------------------------
// US2 — Cart Item Removal (Priority: P2)
// Verifies removing items updates rows and badge correctly, including
// empty-cart behavior where badge count returns to 0.
// ---------------------------------------------------------------------------
test.describe('Cart Item Removal', () => {
  // T016 — remove one of two items; badge decrements from 2 to 1
  test('removing one of two items decrements badge from 2 to 1 and removes the row', async ({
    inventoryPage,
    cartPage,
  }) => {
    await inventoryPage.goto();
    await inventoryPage.addProductToCartByIndex(0);
    await inventoryPage.addProductToCartByIndex(1);

    await cartPage.goto();

    const namesBefore = await cartPage.getCartItemNames();
    const nameToRemove = namesBefore[0];

    await cartPage.removeItemByName(nameToRemove);

    const rowCount = await cartPage.getCartRowCount();
    const badgeCount = await cartPage.getCartBadgeCount();
    const namesAfter = await cartPage.getCartItemNames();

    expect(rowCount).toBe(1);
    expect(badgeCount).toBe(1);
    // T018 — removed item absent from cart item names
    expect(namesAfter).not.toContain(nameToRemove);
  });

  // T017 — remove last item; cart empty and badge hidden (count = 0)
  test('removing last item empties the cart and hides the badge', async ({
    inventoryPage,
    cartPage,
  }) => {
    await inventoryPage.goto();
    await inventoryPage.addProductToCartByIndex(0);

    await cartPage.goto();

    const names = await cartPage.getCartItemNames();
    await cartPage.removeItemByName(names[0]);

    const rowCount = await cartPage.getCartRowCount();
    const badgeCount = await cartPage.getCartBadgeCount();

    expect(rowCount).toBe(0);
    expect(badgeCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// US3 — Cart Persistence Across Navigation (Priority: P3)
// Verifies cart contents survive a round-trip navigation away and back.
// ---------------------------------------------------------------------------
test.describe('Cart Persistence Across Navigation', () => {
  // T020 — cart -> inventory -> cart
  test('cart items persist after navigating to inventory and returning', async ({
    inventoryPage,
    cartPage,
  }) => {
    await inventoryPage.goto();
    await inventoryPage.addProductToCartByIndex(0);
    await inventoryPage.addProductToCartByIndex(1);

    await cartPage.goto();
    const baselineNames = await cartPage.getCartItemNames();
    const baselineBadge = await cartPage.getCartBadgeCount();

    // Navigate away to inventory and return
    await cartPage.clickContinueShopping();
    await cartPage.goto();

    // T022 — compare baseline and post-return item names and badge count
    const afterNames = await cartPage.getCartItemNames();
    const afterBadge = await cartPage.getCartBadgeCount();

    expect(afterNames).toEqual(baselineNames);
    expect(afterBadge).toBe(baselineBadge);
  });

  // T021 — cart -> product detail -> cart
  test('cart items persist after navigating to a product detail page and returning', async ({
    inventoryPage,
    cartPage,
  }) => {
    await inventoryPage.goto();
    await inventoryPage.addProductToCartByIndex(0);
    await inventoryPage.addProductToCartByIndex(1);

    await cartPage.goto();
    const baselineNames = await cartPage.getCartItemNames();
    const baselineBadge = await cartPage.getCartBadgeCount();

    // Navigate away to a product detail page via the inventory
    await cartPage.clickContinueShopping();
    await inventoryPage.clickFirstProduct();

    // Return to cart directly
    await cartPage.goto();

    const afterNames = await cartPage.getCartItemNames();
    const afterBadge = await cartPage.getCartBadgeCount();

    expect(afterNames).toEqual(baselineNames);
    expect(afterBadge).toBe(baselineBadge);
  });
});

// ---------------------------------------------------------------------------
// US4 — Cart Page Actions (Priority: P4)
// Verifies that cart action buttons navigate to the correct destinations.
// ---------------------------------------------------------------------------
test.describe('Cart Page Actions', () => {
  // T024 — Continue Shopping routes to /inventory.html
  test('Continue Shopping button returns to the inventory page', async ({
    inventoryPage,
    cartPage,
  }) => {
    await inventoryPage.goto();
    await inventoryPage.addProductToCartByIndex(0);

    await cartPage.goto();
    await cartPage.clickContinueShopping();

    const onInventory = await inventoryPage.isOnInventoryPage();
    expect(onInventory).toBe(true);
  });

  // T025 — Checkout routes to /checkout-step-one.html
  test('Checkout button navigates to checkout step one', async ({
    page,
    inventoryPage,
    cartPage,
  }) => {
    await inventoryPage.goto();
    await inventoryPage.addProductToCartByIndex(0);

    await cartPage.goto();
    await cartPage.clickCheckout();

    expect(page.url()).toContain('/checkout-step-one.html');
  });
});
