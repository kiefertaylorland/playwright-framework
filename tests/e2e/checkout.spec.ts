import { expect, test } from '@fixtures';
import { CHECKOUT_ERRORS } from '@pages/checkout.page';

// ---------------------------------------------------------------------------
// Shared test data
// ---------------------------------------------------------------------------

const VALID_INFO = {
  firstName: 'Jane',
  lastName: 'Doe',
  postalCode: '90210',
} as const;

// These two items are mandated by the order summary contract (US3).
const SUMMARY_ITEMS = ['Sauce Labs Backpack', 'Sauce Labs Bike Light'] as const;

// ---------------------------------------------------------------------------
// US1 — End-to-End Happy Path (Priority: P1) MVP
// Verifies full 3-step checkout completes and shows the confirmation message.
// ---------------------------------------------------------------------------
test.describe('Checkout Happy Path', () => {
  // T012 / T013
  test('completing checkout from cart shows confirmation message', async ({
    inventoryPage,
    cartPage,
    checkoutPage,
  }) => {
    // Per-test item setup — Constitution Principle III
    await inventoryPage.goto();
    await inventoryPage.addProductToCartByIndex(0);

    await cartPage.goto();
    await checkoutPage.startCheckoutFromCart();

    expect(await checkoutPage.isOnStepOne()).toBe(true);

    await checkoutPage.completeStepOne(VALID_INFO);

    expect(await checkoutPage.isOnStepTwo()).toBe(true);

    await checkoutPage.finishCheckout();

    expect(await checkoutPage.isOnCompleteStep()).toBe(true);
    expect(await checkoutPage.getConfirmationHeader()).toBe(
      'Thank you for your order!'
    );
  });
});

// ---------------------------------------------------------------------------
// US2 — Step 1 Form Validation (Priority: P2)
// Verifies each required field produces the exact error string and the user
// stays on /checkout-step-one.html when a required field is missing.
// ---------------------------------------------------------------------------
test.describe('Checkout Step 1 Validation', () => {
  // T015 / T018
  test('submitting without first name shows first-name error and stays on step 1', async ({
    inventoryPage,
    cartPage,
    checkoutPage,
    page,
  }) => {
    await inventoryPage.goto();
    await inventoryPage.addProductToCartByIndex(0);

    await cartPage.goto();
    await checkoutPage.startCheckoutFromCart();

    // Leave firstName empty
    await checkoutPage.fillLastName(VALID_INFO.lastName);
    await checkoutPage.fillPostalCode(VALID_INFO.postalCode);
    await checkoutPage.clickContinue();

    expect(await checkoutPage.getStepOneErrorMessage()).toBe(
      CHECKOUT_ERRORS.FIRST_NAME_REQUIRED
    );
    expect(page.url()).toContain('/checkout-step-one.html');
  });

  // T016 / T018
  test('submitting without last name shows last-name error and stays on step 1', async ({
    inventoryPage,
    cartPage,
    checkoutPage,
    page,
  }) => {
    await inventoryPage.goto();
    await inventoryPage.addProductToCartByIndex(0);

    await cartPage.goto();
    await checkoutPage.startCheckoutFromCart();

    // Leave lastName empty
    await checkoutPage.fillFirstName(VALID_INFO.firstName);
    await checkoutPage.fillPostalCode(VALID_INFO.postalCode);
    await checkoutPage.clickContinue();

    expect(await checkoutPage.getStepOneErrorMessage()).toBe(
      CHECKOUT_ERRORS.LAST_NAME_REQUIRED
    );
    expect(page.url()).toContain('/checkout-step-one.html');
  });

  // T017 / T018
  test('submitting without postal code shows postal-code error and stays on step 1', async ({
    inventoryPage,
    cartPage,
    checkoutPage,
    page,
  }) => {
    await inventoryPage.goto();
    await inventoryPage.addProductToCartByIndex(0);

    await cartPage.goto();
    await checkoutPage.startCheckoutFromCart();

    // Leave postalCode empty
    await checkoutPage.fillFirstName(VALID_INFO.firstName);
    await checkoutPage.fillLastName(VALID_INFO.lastName);
    await checkoutPage.clickContinue();

    expect(await checkoutPage.getStepOneErrorMessage()).toBe(
      CHECKOUT_ERRORS.POSTAL_CODE_REQUIRED
    );
    expect(page.url()).toContain('/checkout-step-one.html');
  });
});

// ---------------------------------------------------------------------------
// US3 — Step 2 Order Summary Accuracy (Priority: P3)
// Verifies that the two-item summary shows exactly the expected items and that
// all monetary totals are consistent with the displayed DOM values only.
// ---------------------------------------------------------------------------
test.describe('Checkout Step 2 Order Summary', () => {
  // T020 — item names on step 2 match exactly the two added products
  test('step 2 shows exactly the two added items by name', async ({
    inventoryPage,
    cartPage,
    checkoutPage,
  }) => {
    await inventoryPage.goto();
    // Use name-based addition: index-based addition shifts after each click
    // because the button changes from "add-to-cart-*" to "remove-*".
    await inventoryPage.addProductToCartByName(SUMMARY_ITEMS[0]);
    await inventoryPage.addProductToCartByName(SUMMARY_ITEMS[1]);

    await cartPage.goto();
    await checkoutPage.startCheckoutFromCart();
    await checkoutPage.completeStepOne(VALID_INFO);

    const names = await checkoutPage.getSummaryItemNames();
    expect(names).toHaveLength(2);
    expect(names).toContain(SUMMARY_ITEMS[0]);
    expect(names).toContain(SUMMARY_ITEMS[1]);
  });

  // T021 / T022 / T023 — DOM-driven monetary assertions
  test('item total equals sum of row prices, tax is non-zero, grand total equals item total plus tax', async ({
    inventoryPage,
    cartPage,
    checkoutPage,
  }) => {
    await inventoryPage.goto();
    await inventoryPage.addProductToCartByName(SUMMARY_ITEMS[0]);
    await inventoryPage.addProductToCartByName(SUMMARY_ITEMS[1]);

    await cartPage.goto();
    await checkoutPage.startCheckoutFromCart();
    await checkoutPage.completeStepOne(VALID_INFO);

    // Parse all monetary values from DOM (no independent tax-rate formula)
    const rowPrices = await checkoutPage.getSummaryItemPrices();
    const rowSum = rowPrices.reduce((sum, p) => sum + p, 0);

    const itemTotal = await checkoutPage.getDisplayedItemTotal();
    const tax = await checkoutPage.getDisplayedTax();
    const total = await checkoutPage.getDisplayedTotal();

    // T021 — row prices sum to displayed item total
    expect(rowSum.toFixed(2)).toBe(itemTotal.toFixed(2));

    // T022 — displayed tax is non-zero
    expect(tax).toBeGreaterThan(0);

    // T023 — grand total = item total + tax (DOM arithmetic only)
    expect((itemTotal + tax).toFixed(2)).toBe(total.toFixed(2));
  });
});

// ---------------------------------------------------------------------------
// US4 — Cancel Navigation (Priority: P4)
// Verifies cancel buttons on each step route to their documented destinations.
// ---------------------------------------------------------------------------
test.describe('Checkout Cancel Navigation', () => {
  // T025 — cancel from step 1 returns to /cart.html
  test('cancelling from step 1 returns to the cart', async ({
    inventoryPage,
    cartPage,
    checkoutPage,
    page,
  }) => {
    await inventoryPage.goto();
    await inventoryPage.addProductToCartByIndex(0);

    await cartPage.goto();
    await checkoutPage.startCheckoutFromCart();
    await checkoutPage.cancelFromStepOne();

    expect(page.url()).toContain('/cart.html');
  });

  // T026 — cancel from step 2 returns to /inventory.html (SauceDemo quirk)
  test('cancelling from step 2 returns to the inventory page', async ({
    inventoryPage,
    cartPage,
    checkoutPage,
    page,
  }) => {
    await inventoryPage.goto();
    await inventoryPage.addProductToCartByIndex(0);

    await cartPage.goto();
    await checkoutPage.startCheckoutFromCart();
    await checkoutPage.completeStepOne(VALID_INFO);
    await checkoutPage.cancelFromStepTwo();

    expect(page.url()).toContain('/inventory.html');
  });
});
