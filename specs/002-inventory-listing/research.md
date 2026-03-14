# Research: Inventory Page — Product Listing

**Feature**: 002-inventory-listing
**Phase**: 0 — Research
**Status**: Complete — 0 NEEDS CLARIFICATION items remain

---

## Decision 1: InventoryPage Extension Strategy

**Decision**: Extend the existing `pages/inventory.page.ts` class established in
001. New methods are added to the same class; the existing 001 interface
(`goto`, `isOnInventoryPage`, `openBurgerMenu`, `logout`) is preserved unchanged.

**Rationale**: The same class covers both the auth-scoped methods (001) and the
inventory-display methods (002). Features 003 and 004 depend on both sets of
methods from the same `InventoryPage`. A separate class or inheritance hierarchy
adds complexity with no benefit on a single-page scope.

**Alternatives considered**:
- **New `InventoryListingPage` class**: Creates a parallel class hierarchy and
  forces test files to import two classes for the same page. Rejected — one page,
  one class.
- **TypeScript class inheritance (`extends`)**: Adds an inheritance chain where
  flat extension is sufficient. Rejected — premature hierarchy.

---

## Decision 2: SauceDemo Inventory Selector Audit

**Decision**: Use the following `data-test` attributes, confirmed via SauceDemo
DOM inspection:

| Element | Selector | Notes |
|---------|----------|-------|
| Sort dropdown `<select>` | `data-test="product-sort-container"` | Standard `<select>` element |
| Sort option values | `az`, `za`, `lohi`, `hilo` | The `value=` attributes on `<option>` elements |
| Product name (link) | `data-test="inventory-item-name"` | Also acts as navigation link to detail page |
| Product description | `.inventory_item_desc` | Used for US1 structural description count |
| Product price | `data-test="inventory-item-price"` | Text format: `$XX.XX` |
| Add-to-cart button | `data-test^="add-to-cart"` | Prefix selector for all product-specific values |
| Cart badge | `data-test="shopping-cart-badge"` | Hidden when cart is empty |
| Shopping cart link | `data-test="shopping-cart-link"` | Header nav link |
| Inventory item wrapper | `.inventory_item` | Used for US1 structural product count |

**Rationale**: `data-test` is SauceDemo's equivalent of `data-testid`. For US1
structural assertions, SauceDemo does not expose `data-test` on product wrappers,
so `.inventory_item` and `.inventory_item_desc` are used as constrained fallback
selectors inside `InventoryPage` only.

**Principle IV deviation**: `data-test` instead of `data-testid` — justified
(third-party site; documented in Complexity Tracking).

---

## Decision 3: Product Count and Structural Validation via Wrapper/Description Counts

**Decision**: Validate US1 structural completeness with explicit parity across
three counts:
- `getProductCount()` uses `.inventory_item`
- `getDescriptionCount()` uses `.inventory_item_desc`
- `getAddToCartButtonCount()` uses `[data-test^="add-to-cart"]`

```text
getProductCount()             === 6
getDescriptionCount()         === getProductCount()
getAddToCartButtonCount()     === getProductCount()
```

**Rationale**: This directly proves product-card presence and required structural
controls for SC-001 while keeping selectors in Page Objects only.

**Alternatives considered**:
- **Name-only count approach**: Rejected because it does not explicitly prove
  wrapper/description/button structural parity at method-contract level.

---

## Decision 4: Sort Validation Strategy

**Decision**: Collect all product name strings (or parsed price floats) into an
array, then compare to a sorted reference array.

**For name sorts:**
```text
actual   = getProductNames()          // e.g. ["Sauce Labs Backpack", ...]
expected = [...actual].sort()         // ascending A-Z (JS default sort)
assert actual === expected            // for Name (A to Z)

expected = [...actual].sort().reverse()
assert actual === expected            // for Name (Z to A)
```

**For price sorts:**
```text
prices   = getProductPrices()         // parsed floats, e.g. [29.99, 9.99, ...]
expected = [...prices].sort((a,b) => a - b)
assert prices === expected            // for Price (low to high)

expected = [...prices].sort((a,b) => b - a)
assert prices === expected            // for Price (high to low)
```

**Rationale**: This approach is self-validating — the expected order is derived
from the actual data, so the test does not require hard-coded product names or
prices. It correctly handles equal-price ties (relative order among ties is
unspecified in the spec).

**Alternatives considered**:
- **Hard-coded expected arrays**: More explicit but brittle if SauceDemo adds/removes
  products. The computed approach is future-safe.
- **Pairwise adjacent comparison**: Checks each pair `price[i] <= price[i+1]`
  without constructing the full sorted array. Equivalent but less readable.

---

## Decision 5: ProductDetailPage Design

**Decision**: Create a minimal `pages/product-detail.page.ts` class with two methods:

```typescript
interface IProductDetailPage {
  isOnDetailPage(): Promise<boolean>;  // URL contains '/inventory-item.html'
  goBack(): Promise<void>;             // clicks [data-test="back-to-products"]
}
```

**Rationale**: Feature 002 only needs to assert arrival on the detail page and
successful back-navigation. Full detail-page content (name, price, description,
add-to-cart) is out of scope (spec assumption). A minimal class avoids over-building.

**Detail page URL pattern**: `/inventory-item.html?id={number}` — `isOnDetailPage()`
asserts that the current URL contains `/inventory-item.html` (id value not asserted
here; it varies by product).

**Back button selector**: `data-test="back-to-products"` — confirmed on SauceDemo
product detail pages.

**Alternatives considered**:
- **Inline in InventoryPage (`InventoryPage.goBackFromDetail()`)**: Violates POM
  principle — detail page interactions belong to a detail page object.
- **Full ProductDetailPage with name/price assertions**: Out of scope for this
  feature; would be built in a hypothetical 006-product-detail feature.

---

## Decision 6: Cart State Isolation

**Decision**: Each test in `inventory.spec.ts` inherits the default `storageState`
(`.auth/standard-user.json`). SauceDemo stores cart state in `localStorage`.
Playwright creates a **new browser context per test** and loads the storageState
fresh — the standard user's saved state has an empty cart. Cart additions in one
test do not bleed into another.

**Rationale**: No test teardown or cart cleanup is needed. Playwright's context
isolation guarantees test independence (Principle III) automatically.

**Verification**: The `.auth/standard-user.json` file is written by `global-setup.ts`
immediately after a clean login (before any cart additions). It captures an empty-cart
state and is treated as read-only by tests.

**Alternatives considered**:
- **Explicit cart cleanup in `afterEach`**: Adds unnecessary complexity. Playwright's
  per-test context isolation handles this without intervention.
- **`test.use({ storageState: undefined })` with programmatic login per test**: Slower
  and unnecessary — the auth state already provides a clean empty-cart context.
