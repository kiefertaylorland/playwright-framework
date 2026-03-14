# Data Model: Shopping Cart — SauceDemo

**Feature**: 003-shopping-cart
**Date**: 2026-03-13

---

## TypeScript Interfaces

### CartItem

```typescript
interface CartItem {
  name: string;
  description: string;
  priceText: string; // e.g. "$29.99"
}
```

Represents one displayed row on `/cart.html`.

### ICartPage

```typescript
// pages/cart.page.ts
interface ICartPage {
  goto(): Promise<void>;
  isOnCartPage(): Promise<boolean>;

  // Cart rows
  getCartItems(): Promise<CartItem[]>;
  getCartItemNames(): Promise<string[]>;
  getCartRowCount(): Promise<number>;

  // Badge (DOM source of cart count)
  getCartBadgeCount(): Promise<number>;

  // Item management
  removeItemByName(name: string): Promise<void>;

  // Page actions
  clickContinueShopping(): Promise<void>;
  clickCheckout(): Promise<void>;
}
```

All methods return `void` or domain-typed values. No `Locator` objects are
exposed to tests (Principle II).

---

## Route Constants

```typescript
const ROUTES = {
  INVENTORY: 'https://www.saucedemo.com/inventory.html',
  CART: 'https://www.saucedemo.com/cart.html',
  CHECKOUT_STEP_ONE: 'https://www.saucedemo.com/checkout-step-one.html',
} as const;
```

---

## Selector Inventory

All selectors are owned by Page Objects and must not appear in test files.

### Cart row selectors

| Purpose | Selector | Type | Notes |
|---------|----------|------|-------|
| Item names | `[data-test="inventory-item-name"]` | `data-test` | one per row |
| Item descriptions | `[data-test="inventory-item-desc"]` | `data-test` | one per row |
| Item prices | `[data-test="inventory-item-price"]` | `data-test` | one per row |
| Remove buttons | `[data-test^="remove-"]` | `data-test` prefix | product-specific values |

### Cart page action selectors

| Purpose | Selector | Type |
|---------|----------|------|
| Continue Shopping button | `[data-test="continue-shopping"]` | `data-test` |
| Checkout button | `[data-test="checkout"]` | `data-test` |

### Badge selector

| Purpose | Selector | Type |
|---------|----------|------|
| Header cart badge | `[data-test="shopping-cart-badge"]` | `data-test` |

**Constitution note**: SauceDemo uses `data-test` instead of `data-testid`.
This is a documented Principle IV deviation for third-party UI.

---

## Badge Parsing Contract

`getCartBadgeCount()` reads the badge text from DOM and converts it to number.
If the badge is absent, count is `0`.

```typescript
async function getCartBadgeCount(): Promise<number> {
  const badge = page.locator('[data-test="shopping-cart-badge"]');
  if (!(await badge.isVisible())) {
    return 0;
  }

  const text = (await badge.textContent())?.trim() ?? '0';
  return Number.parseInt(text, 10);
}
```

This method is the authoritative count source for cart item count assertions.

---

## Cart Setup Data in Tests

Each test chooses its own setup items and adds them fresh from inventory. Example
stable products used across cart tests:

```typescript
const CART_TEST_ITEMS = [
  'Sauce Labs Backpack',
  'Sauce Labs Bike Light',
  'Sauce Labs Bolt T-Shirt',
] as const;
```

No setup is shared between tests.

---

## State Lifecycle

```text
Authenticated context (default storageState)
  └── Test body adds items from inventory (fresh per test)
      └── Cart badge updates in header DOM
          └── Navigate to cart
              ├── Display rows match added items
              ├── Remove operations decrement badge and rows
              ├── Empty cart hides badge (count=0)
              ├── Continue Shopping -> inventory
              └── Checkout -> checkout-step-one

Persistence flow:
cart with items
  └── navigate away to inventory
      └── return to cart
          └── same item rows still present
```
