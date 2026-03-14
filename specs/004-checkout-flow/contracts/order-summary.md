# Contract: Checkout Step 2 — Order Summary and Monetary Math

**Page**: `https://www.saucedemo.com/checkout-step-two.html`
**Page Object**: `pages/checkout.page.ts`
**Spec refs**: FR-006, FR-007, FR-008, FR-009

## Precondition

This contract test must perform setup inside the same test body:
1. Add exactly `Sauce Labs Backpack` and `Sauce Labs Bike Light` fresh.
2. Navigate cart -> checkout step 1.
3. Submit valid personal info to reach step 2.

No item setup is shared across tests.

---

## Item List Contract (FR-006)

| Step | Action | Expected outcome |
|------|--------|------------------|
| 1 | Call `getSummaryItemNames()` | Returns item names shown on step 2 |
| 2 | Compare set/array to expected pair | Contains exactly Backpack + Bike Light |
| 3 | Assert item count | Exactly 2 items, no extras |

---

## Monetary Contract (FR-007, FR-008, FR-009)

All money values are parsed from displayed DOM strings only.
No tax rate is calculated independently.

| Step | Action | Expected outcome |
|------|--------|------------------|
| 1 | Call `getSummaryItemPrices()` | Returns two parsed prices from item rows |
| 2 | Sum parsed row prices | `rowSum` computed from DOM values |
| 3 | Call `getDisplayedItemTotal()` | Parses `Item total` label from DOM |
| 4 | Assert `rowSum.toFixed(2) === itemTotal.toFixed(2)` | Item total matches row prices |
| 5 | Call `getDisplayedTax()` | Parses `Tax` label from DOM |
| 6 | Assert `tax > 0` | Non-zero displayed tax |
| 7 | Call `getDisplayedTotal()` | Parses `Total` label from DOM |
| 8 | Assert `(itemTotal + tax).toFixed(2) === total.toFixed(2)` | Grand total matches DOM arithmetic rule |

### Required arithmetic expression

```typescript
expect((itemTotal + tax).toFixed(2)).toBe(total.toFixed(2));
```

Where `itemTotal`, `tax`, and `total` are all parsed via `parseFloat(...)` from
step 2 DOM text values.

---

## Parsing Contract

Step 2 labels include prefixes and currency symbols:
- `Item total: $...`
- `Tax: $...`
- `Total: $...`

The parser must strip non-numeric characters and parse with `parseFloat`.

```typescript
const parseMoneyFromText = (text: string): number =>
  parseFloat(text.replace(/[^0-9.]/g, ''));
```

No hard-coded tax percentage, no independent expected-tax formula, and no hidden
constants outside displayed DOM values.

---

## Selectors (owned by CheckoutPage)

| Element | Selector |
|---------|----------|
| Summary item names | `[data-test="inventory-item-name"]` |
| Summary item prices | `[data-test="inventory-item-price"]` |
| Item total label | `[data-test="subtotal-label"]` |
| Tax label | `[data-test="tax-label"]` |
| Grand total label | `[data-test="total-label"]` |

These selectors are internal to the Page Object and never appear in test files.
