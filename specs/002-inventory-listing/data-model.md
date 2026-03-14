# Data Model: Inventory Page — Product Listing

**Feature**: 002-inventory-listing
**Phase**: 1 — Design

---

## TypeScript Interfaces

### IInventoryPage (extended from 001)

```typescript
// pages/inventory.page.ts — extends the 001 interface

// --- Inherited from 001 (do not modify) ---
interface IInventoryPage_001 {
  goto(): Promise<void>;
  isOnInventoryPage(): Promise<boolean>;
  openBurgerMenu(): Promise<void>;
  logout(): Promise<void>;
}

// --- New methods added by 002 ---
interface IInventoryPage extends IInventoryPage_001 {
  /**
   * Returns the count of product card containers.
   * Uses `.inventory_item`.
   * Asserts there are exactly 6 products (FR-001).
   */
  getProductCount(): Promise<number>;

  /**
   * Returns the count of product description elements.
   * Uses `.inventory_item_desc`.
   * Must equal getProductCount() for structural completeness.
   */
  getDescriptionCount(): Promise<number>;

  /**
   * Returns the count of Add to Cart buttons.
   * Uses `[data-test^="add-to-cart"]`.
   * Must equal getProductCount() for structural completeness.
   */
  getAddToCartButtonCount(): Promise<number>;

  /**
   * Returns the text of all product name elements in DOM order.
   * Used to validate sort results (FR-004, FR-005).
   */
  getProductNames(): Promise<string[]>;

  /**
   * Returns the price of each product as a parsed float in DOM order.
   * Strips the '$' prefix and parses with parseFloat().
   * Used to validate sort results (FR-006, FR-007).
   */
  getProductPrices(): Promise<number[]>;

  /**
   * Selects a sort option from the sort dropdown.
   * Uses data-test="product-sort-container" (FR-003–FR-007).
   */
  sortBy(option: SortOption): Promise<void>;

  /**
   * Clicks the product name link for the product matching the given name.
   * Navigates to the product's detail page (FR-008).
   */
  clickProductByName(name: string): Promise<void>;

  /**
   * Clicks the first product name in DOM order and returns its text.
   * Convenience method for US3 detail navigation tests.
   */
  clickFirstProduct(): Promise<string>;

  /**
   * Clicks the Add to Cart button for the product at the given DOM index
   * (0-based). Used to add products in US4 cart badge tests.
   */
  addProductToCartByIndex(index: number): Promise<void>;

  /**
   * Returns the cart badge text (e.g., "1", "2").
   * Returns null if the badge is not visible (empty cart).
   * Uses data-test="shopping-cart-badge" (FR-009, FR-010).
   */
  getCartBadgeCount(): Promise<string | null>;
}
```

### IProductDetailPage

```typescript
// pages/product-detail.page.ts — NEW in feature 002

interface IProductDetailPage {
  /**
   * Returns true if the current URL contains '/inventory-item.html'.
   * Confirms arrival on a product detail page (FR-008).
   */
  isOnDetailPage(): Promise<boolean>;

  /**
   * Clicks the "Back to products" button.
   * Navigates back to the inventory page (FR-008).
   * Uses data-test="back-to-products".
   */
  goBack(): Promise<void>;
}
```

---

## SortOption Type

```typescript
// Used as parameter type for InventoryPage.sortBy()
// Values correspond to the <option value="..."> attributes in the sort dropdown

export const SORT_OPTIONS = {
  NAME_ASC:   'az',    // Name (A to Z)
  NAME_DESC:  'za',    // Name (Z to A)
  PRICE_ASC:  'lohi',  // Price (low to high)
  PRICE_DESC: 'hilo',  // Price (high to low)
} as const;

export type SortOption = typeof SORT_OPTIONS[keyof typeof SORT_OPTIONS];
```

---

## Selector Inventory

All selectors are owned by Page Object classes. Test files MUST NOT reference these.

### InventoryPage selectors

| Element | Selector | Type | Notes |
|---------|----------|------|-------|
| Product card wrappers (all) | `.inventory_item` | CSS class | Used by `getProductCount()` |
| Sort dropdown | `[data-test="product-sort-container"]` | `data-test` | Standard `<select>` element |
| Product names (all) | `[data-test="inventory-item-name"]` | `data-test` | 6 elements; also act as navigation links |
| Product descriptions (all) | `.inventory_item_desc` | CSS class | Used by `getDescriptionCount()` |
| Product prices (all) | `[data-test="inventory-item-price"]` | `data-test` | 6 elements; text format `$XX.XX` |
| Add-to-cart buttons (all) | `[data-test^="add-to-cart"]` | `data-test` prefix | Used by `getAddToCartButtonCount()` |
| Cart badge | `[data-test="shopping-cart-badge"]` | `data-test` | Not rendered when cart is empty |

**Constitution note**: `data-test` instead of `data-testid` — justified Principle IV
deviation (SauceDemo third-party convention). See Complexity Tracking in plan.md.

**Constitution note**: `[data-test^="add-to-cart"]` is an attribute-prefix CSS
selector. It is the minimum viable selector for all add-to-cart buttons without
exposing product-specific slugs to test files. Owned exclusively by `InventoryPage`.

**Constitution note**: `.inventory_item` and `.inventory_item_desc` are class
selectors used as a fallback for US1 structural count methods. SauceDemo does not
expose a stable `data-test` wrapper for product cards, so class selectors are used
only inside `InventoryPage`.

### ProductDetailPage selectors

| Element | Selector | Type | Notes |
|---------|----------|------|-------|
| Back button | `[data-test="back-to-products"]` | `data-test` | Navigates back to `/inventory.html` |

---

## US1 Structural Proof Rule (SC-001)

US1 structural completeness is proven with these method-level invariants:

```typescript
const productCount = await inventoryPage.getProductCount();
const descriptionCount = await inventoryPage.getDescriptionCount();
const addToCartButtonCount = await inventoryPage.getAddToCartButtonCount();

expect(productCount).toBe(6);
expect(descriptionCount).toBe(productCount);
expect(addToCartButtonCount).toBe(productCount);
```

These assertions verify that all rendered product cards have the required
description and add-to-cart controls while preserving the exact 6-product contract.

---

## Price Parsing Strategy

```typescript
// Used in InventoryPage.getProductPrices()
// Input:  "$29.99"  (text content of [data-test="inventory-item-price"])
// Output: 29.99     (number)

function parsePrice(priceText: string): number {
  return parseFloat(priceText.replace('$', ''));
}
```

**Sort validation logic** (in `InventoryPage` or test utilities):

```typescript
// Name sort — ascending (A to Z)
const names = await inventoryPage.getProductNames();
const sorted = [...names].sort();
expect(names).toEqual(sorted);

// Name sort — descending (Z to A)
const sorted = [...names].sort().reverse();
expect(names).toEqual(sorted);

// Price sort — ascending (low to high)
const prices = await inventoryPage.getProductPrices();
const sorted = [...prices].sort((a, b) => a - b);
expect(prices).toEqual(sorted);

// Price sort — descending (high to low)
const sorted = [...prices].sort((a, b) => b - a);
expect(prices).toEqual(sorted);
```

**Note**: Comparison is `toEqual` (deep equality on arrays), not `toBe`.
Floating-point precision is not a concern here since sort order is compared,
not sum/total arithmetic.

---

## Entity Relationships

```text
InventoryPage
  ├── has many → ProductCard (logical, not a class)
  │     ├── has one → wrapper       [.inventory_item]
  │     ├── has one → name          [data-test="inventory-item-name"]
  │     ├── has one → description   [.inventory_item_desc]
  │     ├── has one → price         [data-test="inventory-item-price"]
  │     └── has one → addToCart     [data-test^="add-to-cart"]
  ├── has one  → SortDropdown       [data-test="product-sort-container"]
  └── has one  → CartBadge          [data-test="shopping-cart-badge"]

ProductDetailPage
  └── has one  → BackButton         [data-test="back-to-products"]
```

---

## Session State Lifecycle (inventory context)

```
globalSetup
  └── saves .auth/standard-user.json  (empty cart, authenticated)

Test starts
  └── Playwright creates new browser context
      └── loads .auth/standard-user.json → user is on /inventory.html (or navigates there)
          └── cart localStorage = empty

Test body (US4)
  └── addProductToCartByIndex(0) → cart localStorage = { "sauce-labs-backpack": 1 }
  └── getCartBadgeCount()        → "1"
  └── addProductToCartByIndex(1) → cart localStorage = { "sauce-labs-backpack": 1, "sauce-labs-bike-light": 1 }
  └── getCartBadgeCount()        → "2"

Test ends
  └── browser context destroyed → cart state discarded
  └── next test starts with fresh empty-cart context
```
