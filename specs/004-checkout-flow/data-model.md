# Data Model: Checkout Flow — SauceDemo

**Feature**: 004-checkout-flow
**Date**: 2026-03-13

---

## TypeScript Interfaces

### CheckoutInfo

```typescript
interface CheckoutInfo {
  firstName: string;
  lastName: string;
  postalCode: string;
}
```

Used for step 1 form input in happy-path and summary-setup flows.

### OrderSummaryAmounts

```typescript
interface OrderSummaryAmounts {
  itemTotal: number;
  tax: number;
  total: number;
}
```

All values are parsed from displayed DOM labels on step 2.

### ICheckoutPage

```typescript
// pages/checkout.page.ts
interface ICheckoutPage {
  // Cart entry point
  startCheckoutFromCart(): Promise<void>;

  // Step 1
  isOnStepOne(): Promise<boolean>;
  fillFirstName(value: string): Promise<void>;
  fillLastName(value: string): Promise<void>;
  fillPostalCode(value: string): Promise<void>;
  continueFromStepOne(): Promise<void>;
  cancelFromStepOne(): Promise<void>;
  completeStepOne(info: CheckoutInfo): Promise<void>;
  getStepOneErrorMessage(): Promise<string>;

  // Step 2
  isOnStepTwo(): Promise<boolean>;
  getSummaryItemNames(): Promise<string[]>;
  getSummaryItemPrices(): Promise<number[]>;
  getDisplayedItemTotal(): Promise<number>;
  getDisplayedTax(): Promise<number>;
  getDisplayedTotal(): Promise<number>;
  finishCheckout(): Promise<void>;
  cancelFromStepTwo(): Promise<void>;

  // Step 3
  isOnCompleteStep(): Promise<boolean>;
  getConfirmationHeader(): Promise<string>;
}
```

All methods return `void` or domain-typed values. No raw `Locator` objects are
exposed (Constitution Principle II).

---

## Route Constants

```typescript
const ROUTES = {
  INVENTORY: 'https://www.saucedemo.com/inventory.html',
  CART: 'https://www.saucedemo.com/cart.html',
  CHECKOUT_STEP_ONE: 'https://www.saucedemo.com/checkout-step-one.html',
  CHECKOUT_STEP_TWO: 'https://www.saucedemo.com/checkout-step-two.html',
  CHECKOUT_COMPLETE: 'https://www.saucedemo.com/checkout-complete.html',
} as const;
```

---

## Selector Inventory

All selectors below are owned by Page Objects and MUST NOT be used in test files.

### Cart entry selector

| Purpose | Selector | Type | Notes |
|---------|----------|------|-------|
| Checkout button on cart page | `[data-test="checkout"]` | `data-test` | Opens step 1 |

### Step 1 selectors

| Purpose | Selector | Type |
|---------|----------|------|
| First name input | `[data-test="firstName"]` | `data-test` |
| Last name input | `[data-test="lastName"]` | `data-test` |
| Postal code input | `[data-test="postalCode"]` | `data-test` |
| Continue button | `[data-test="continue"]` | `data-test` |
| Cancel button | `[data-test="cancel"]` | `data-test` |
| Error banner | `[data-test="error"]` | `data-test` |

### Step 2 selectors

| Purpose | Selector | Type |
|---------|----------|------|
| Summary item names | `[data-test="inventory-item-name"]` | `data-test` |
| Summary item prices | `[data-test="inventory-item-price"]` | `data-test` |
| Item total label | `[data-test="subtotal-label"]` | `data-test` |
| Tax label | `[data-test="tax-label"]` | `data-test` |
| Grand total label | `[data-test="total-label"]` | `data-test` |
| Finish button | `[data-test="finish"]` | `data-test` |
| Cancel button | `[data-test="cancel"]` | `data-test` |

### Step 3 selectors

| Purpose | Selector | Type |
|---------|----------|------|
| Confirmation header | `[data-test="complete-header"]` | `data-test` |

**Constitution note**: SauceDemo uses `data-test` rather than `data-testid`.
This is a justified Principle IV deviation for a third-party app.

---

## Validation Error Constants

```typescript
const CHECKOUT_ERRORS = {
  FIRST_NAME_REQUIRED: 'Error: First Name is required',
  LAST_NAME_REQUIRED: 'Error: Last Name is required',
  POSTAL_CODE_REQUIRED: 'Error: Postal Code is required',
} as const;
```

---

## Order Summary Test Fixture Data

```typescript
const ORDER_SUMMARY_ITEMS = [
  'Sauce Labs Backpack',
  'Sauce Labs Bike Light',
] as const;
```

This pair is mandatory for the step 2 monetary accuracy test.

---

## DOM Money Parsing Model

Displayed labels include text prefixes and currency symbols:
- `Item total: $39.98`
- `Tax: $3.20`
- `Total: $43.18`

Parsing helper:

```typescript
function parseMoneyFromText(text: string): number {
  return parseFloat(text.replace(/[^0-9.]/g, ''));
}
```

Contract rules:
1. Parse item row prices from summary list DOM text.
2. Parse item total from `subtotal-label` DOM text.
3. Parse tax from `tax-label` DOM text.
4. Parse total from `total-label` DOM text.
5. Assert grand total as:

```typescript
expect((itemTotal + tax).toFixed(2)).toBe(total.toFixed(2));
```

No independent tax-rate computation is allowed.

---

## Checkout Session State Lifecycle

```text
Authenticated user (default storageState)
  └── Inventory setup in test body
      └── Add required items fresh
          └── Navigate to cart and click Checkout
              └── Step 1: checkout-step-one.html
                  ├── Continue with valid info -> Step 2
                  ├── Cancel -> cart.html
                  └── Validation error -> remain on step 1
                      
Step 2: checkout-step-two.html
  ├── Finish -> Step 3 (checkout-complete.html)
  ├── Cancel -> inventory.html
  └── Monetary assertions (DOM parsed only)

Step 3: checkout-complete.html
  └── Confirm message: "Thank you for your order!"
```
