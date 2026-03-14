# Contract: Cart Persistence — Navigate Away and Return

**Page**: `https://www.saucedemo.com/cart.html`
**Page Object**: `pages/cart.page.ts` (with `InventoryPage` for setup/navigation)
**Spec refs**: FR-008

## Precondition

Within a single test body:
1. Add two or more products from inventory.
2. Open cart and capture current cart item names.

No shared setup state is allowed.

---

## Persistence Contract

| Step | Action | Expected outcome |
|------|--------|------------------|
| 1 | On cart page with items, store current item names | Baseline item set recorded |
| 2 | Navigate away to inventory page | `/inventory.html` loaded |
| 3 | Return to cart page | `/cart.html` loaded |
| 4 | Read cart item names again | Same set as baseline |
| 5 | Read DOM badge count | Count unchanged from baseline |

The same item set must remain after away-and-return navigation in the same
browser context/session.

---

## Optional Alternate Path (same contract)

Instead of inventory route, test may navigate to a product detail page and return.
Expected result is identical: cart rows and badge count remain unchanged.

---

## Assertion Guidance

- Compare item names using set/array equality with deterministic ordering.
- Keep count assertion badge-driven (`getCartBadgeCount()` from DOM).
- Do not create persistence expectations across separate tests or sessions.
