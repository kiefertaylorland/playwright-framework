# Contract: Inventory Page — UI Interactions

**Page**: `https://www.saucedemo.com/inventory.html`
**Page Object**: `pages/inventory.page.ts` (extended)
**Spec refs**: FR-001–FR-010

## Precondition

All tests in this contract start on `/inventory.html` with a valid authenticated
session loaded from `.auth/standard-user.json`. No login step is performed inside
test bodies.

---

## Product Catalogue Display Contract (FR-001, FR-002)

**Page Object selectors (owned by InventoryPage — do not use in test files)**:

| Element | Selector | Count |
|---------|----------|-------|
| Product card wrappers | `.inventory_item` | 6 |
| Product descriptions | `.inventory_item_desc` | 6 |
| Add-to-cart buttons | `[data-test^="add-to-cart"]` | 6 |
| Product prices | `[data-test="inventory-item-price"]` | 6 |

**Interaction sequence**:

| Step | Action | Expected outcome |
|------|--------|--------------------|
| 1 | Navigate to `/inventory.html` (via `InventoryPage.goto()`) | Page loads |
| 2 | Call `inventoryPage.getProductCount()` | Returns `6` |
| 3 | Call `inventoryPage.getDescriptionCount()` | Returns same value as `getProductCount()` |
| 4 | Call `inventoryPage.getAddToCartButtonCount()` | Returns same value as `getProductCount()` |
| 5 | Assert parity | `descriptionCount === productCount` and `buttonCount === productCount` |
| 6 | Assert exact product count | `productCount === 6` |

**US1 structural proof rule (SC-001)**:
`getProductCount() === 6`,
`getDescriptionCount() === getProductCount()`,
`getAddToCartButtonCount() === getProductCount()`.

---

## Sort Dropdown Contract (FR-003)

| Step | Action | Expected outcome |
|------|--------|--------------------|
| 1 | Locate `[data-test="product_sort_container"]` | Element is visible |
| 2 | Inspect `<option>` elements | Exactly 4 options present |
| 3 | Verify option values | `az`, `za`, `lohi`, `hilo` |
| 4 | Verify option labels | "Name (A to Z)", "Name (Z to A)", "Price (low to high)", "Price (high to low)" |

---

## Sort: Name (A to Z) Contract (FR-004)

| Step | Action | Expected outcome |
|------|--------|--------------------|
| 1 | Call `inventoryPage.sortBy('az')` | Dropdown selection changes |
| 2 | Call `inventoryPage.getProductNames()` | Returns array of 6 name strings |
| 3 | Compare to `[...names].sort()` | Arrays are deeply equal |

---

## Sort: Name (Z to A) Contract (FR-005)

| Step | Action | Expected outcome |
|------|--------|--------------------|
| 1 | Call `inventoryPage.sortBy('za')` | Dropdown selection changes |
| 2 | Call `inventoryPage.getProductNames()` | Returns array of 6 name strings |
| 3 | Compare to `[...names].sort().reverse()` | Arrays are deeply equal |

---

## Sort: Price (Low to High) Contract (FR-006)

| Step | Action | Expected outcome |
|------|--------|--------------------|
| 1 | Call `inventoryPage.sortBy('lohi')` | Dropdown selection changes |
| 2 | Call `inventoryPage.getProductPrices()` | Returns array of 6 floats |
| 3 | Compare to `[...prices].sort((a,b) => a - b)` | Arrays are deeply equal |

**Note**: Equal prices may appear in any relative order among themselves.
The assertion only requires that the full array matches the sorted reference.

---

## Sort: Price (High to Low) Contract (FR-007)

| Step | Action | Expected outcome |
|------|--------|--------------------|
| 1 | Call `inventoryPage.sortBy('hilo')` | Dropdown selection changes |
| 2 | Call `inventoryPage.getProductPrices()` | Returns array of 6 floats |
| 3 | Compare to `[...prices].sort((a,b) => b - a)` | Arrays are deeply equal |

---

## Cart Badge Counter Contract (FR-009, FR-010)

**Precondition**: User is on `/inventory.html`; cart is empty (badge not visible).

| Step | Action | Expected outcome |
|------|--------|--------------------|
| 1 | Call `inventoryPage.getCartBadgeCount()` | Returns `null` (badge hidden) |
| 2 | Call `inventoryPage.addProductToCartByIndex(0)` | First product added |
| 3 | Call `inventoryPage.getCartBadgeCount()` | Returns `"1"` |
| 4 | Call `inventoryPage.addProductToCartByIndex(1)` | Second product added |
| 5 | Call `inventoryPage.getCartBadgeCount()` | Returns `"2"` |

**Badge selector**: `[data-test="shopping-cart-badge"]` — element is not rendered
in the DOM when the cart is empty; `getCartBadgeCount()` returns `null` in that case.

---

## Notes

- `getProductNames()` and `getProductPrices()` return items in DOM order (the current
  display order). Calling them after `sortBy()` returns the sorted order.
- Sort assertions use `toEqual` (array deep equality), not `toBe`.
- Price parsing: `parseFloat(text.replace('$', ''))` — no rounding required since
  only ordering is compared (not arithmetic sums).
- The default sort on page load is "Name (A to Z)". Tests that test A-Z sort MUST
  still call `sortBy('az')` explicitly to ensure isolation (Principle III).
- Adding products with `addProductToCartByIndex()` changes the button text to "Remove"
  but this is out of scope for feature 002.
