# Contract: Cart Page — Display, Removal, Badge, and Actions

**Page**: `https://www.saucedemo.com/cart.html`
**Page Object**: `pages/cart.page.ts`
**Spec refs**: FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-009, FR-010

## Precondition

Tests start authenticated using default storageState. Required products are added
fresh within each test body before opening cart.

---

## Display Contract (FR-001, FR-002, FR-003)

| Step | Action | Expected outcome |
|------|--------|------------------|
| 1 | Add N items from inventory in test body | Badge reflects N |
| 2 | Open `/cart.html` | Cart page loads |
| 3 | Read cart item rows (`name`, `description`, `price`) | One full-detail row per added item |
| 4 | Read badge count from DOM | Badge value equals expected N |

Badge value is the required cart count source.

---

## Removal Contract (FR-004, FR-005, FR-006, FR-007)

### Remove one of multiple items

| Step | Action | Expected outcome |
|------|--------|------------------|
| 1 | Start with 2 items in cart | Badge = 2 |
| 2 | `removeItemByName(itemA)` | ItemA disappears from cart rows |
| 3 | Read badge again | Badge = 1 (decrement by exactly 1) |

### Remove last item

| Step | Action | Expected outcome |
|------|--------|------------------|
| 1 | Start with 1 item in cart | Badge = 1 |
| 2 | Remove that item | No cart rows remain |
| 3 | Read badge state | Badge hidden -> interpreted count = 0 |

---

## Cart Action Contract (FR-009, FR-010)

### Continue Shopping

| Step | Action | Expected outcome |
|------|--------|------------------|
| 1 | From `/cart.html`, click Continue Shopping | Navigates to `/inventory.html` |

### Checkout

| Step | Action | Expected outcome |
|------|--------|------------------|
| 1 | From `/cart.html`, click Checkout | Navigates to `/checkout-step-one.html` |

---

## Selectors (owned by `CartPage`)

| Element | Selector |
|---------|----------|
| Cart item names | `[data-test="inventory-item-name"]` |
| Cart item descriptions | `[data-test="inventory-item-desc"]` |
| Cart item prices | `[data-test="inventory-item-price"]` |
| Remove buttons | `[data-test^="remove-"]` |
| Continue Shopping | `[data-test="continue-shopping"]` |
| Checkout | `[data-test="checkout"]` |
| Cart badge | `[data-test="shopping-cart-badge"]` |

All selectors are internal to Page Objects and never used directly in tests.
