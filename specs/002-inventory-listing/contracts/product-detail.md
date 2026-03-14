# Contract: Product Detail Page — Navigation

**Page**: `https://www.saucedemo.com/inventory-item.html?id={n}`
**Page Object**: `pages/product-detail.page.ts`
**Spec refs**: FR-008

## Precondition

The user has navigated to a product detail page by clicking a product name on the
inventory page. The test reaches this state via `InventoryPage.clickProductByName()`
or `InventoryPage.clickFirstProduct()`.

---

## Detail Navigation Contract (FR-008)

### From inventory → detail page

| Step | Action | Expected outcome |
|------|--------|--------------------|
| 1 | Call `inventoryPage.clickFirstProduct()` (or `clickProductByName(name)`) | Navigation triggered |
| 2 | Call `productDetailPage.isOnDetailPage()` | Returns `true` |
| 3 | Assert URL | Contains `/inventory-item.html` |

### From detail page → back to inventory

| Step | Action | Expected outcome |
|------|--------|--------------------|
| 1 | Call `productDetailPage.goBack()` | Clicks "Back to products" button |
| 2 | Assert URL | `https://www.saucedemo.com/inventory.html` |
| 3 | Assert inventory page is active | `inventoryPage.isOnInventoryPage()` returns `true` |

---

## Selectors (owned by ProductDetailPage — do not use in test files)

| Element | Selector | Notes |
|---------|----------|-------|
| Back button | `[data-test="back-to-products"]` | Present on all product detail pages |

---

## `isOnDetailPage()` Implementation Note

```typescript
// Returns true if URL matches the product detail pattern
// Pattern: URL contains '/inventory-item.html'
// Example: https://www.saucedemo.com/inventory-item.html?id=4

async isOnDetailPage(): Promise<boolean> {
  return this.page.url().includes('/inventory-item.html');
}
```

The `id` query parameter is NOT asserted here — verifying the product-specific ID
is out of scope for feature 002.

---

## Out of Scope (feature 002)

The following detail page elements are present on SauceDemo but are NOT tested
by feature 002:

- Product name on detail page
- Product description on detail page
- Product price on detail page
- "Add to cart" button on detail page
- Product image

These would be tested by a hypothetical `006-product-detail` feature.
