# Contract: Checkout Page — 3-Step Flow and Navigation

**Page Object**: `pages/checkout.page.ts`
**Spec refs**: FR-001, FR-002, FR-003, FR-004, FR-005, FR-010, FR-011, FR-012

## Precondition

Tests begin authenticated using default storageState. Required cart items are
added fresh in each test body before clicking checkout.

---

## Cart Entry Contract

| Step | Action | Expected outcome |
|------|--------|------------------|
| 1 | Navigate to `/cart.html` after adding items | Cart page loads |
| 2 | Call `checkoutPage.startCheckoutFromCart()` | Navigates to `/checkout-step-one.html` |
| 3 | Assert `isOnStepOne()` | Returns `true` |

Selector owned by `CheckoutPage`: `[data-test="checkout"]`.

---

## Step 1 Happy Path Contract (FR-001, FR-005)

| Step | Action | Expected outcome |
|------|--------|------------------|
| 1 | Fill first name | Field contains value |
| 2 | Fill last name | Field contains value |
| 3 | Fill postal code | Field contains value |
| 4 | Click Continue | Navigates to `/checkout-step-two.html` |
| 5 | Assert `isOnStepTwo()` | Returns `true` |

---

## Step 1 Validation Contracts (FR-002, FR-003, FR-004)

| Scenario | Input state | Expected error |
|----------|-------------|----------------|
| First name required | First name empty; last + postal filled | `Error: First Name is required` |
| Last name required | Last name empty; first + postal filled | `Error: Last Name is required` |
| Postal required | Postal empty; first + last filled | `Error: Postal Code is required` |

For each scenario:
- User remains on `/checkout-step-one.html`
- Error is asserted via `checkoutPage.getStepOneErrorMessage()`

---

## Step 3 Completion Contract (FR-010)

| Step | Action | Expected outcome |
|------|--------|------------------|
| 1 | Reach step 2 with valid checkout info | `/checkout-step-two.html` loaded |
| 2 | Click Finish | Navigates to `/checkout-complete.html` |
| 3 | Assert confirmation header text | `Thank you for your order!` |

---

## Cancel Navigation Contracts (FR-011, FR-012)

### Cancel from step 1

| Step | Action | Expected outcome |
|------|--------|------------------|
| 1 | On `/checkout-step-one.html` | Step 1 visible |
| 2 | Click Cancel | Navigates to `/cart.html` |

### Cancel from step 2

| Step | Action | Expected outcome |
|------|--------|------------------|
| 1 | On `/checkout-step-two.html` | Step 2 visible |
| 2 | Click Cancel | Navigates to `/inventory.html` |

Step-2 cancel destination is intentionally inventory, not cart.

---

## Selector Inventory (owned by CheckoutPage)

| Element | Selector |
|---------|----------|
| Cart checkout button | `[data-test="checkout"]` |
| Step 1 first name | `[data-test="firstName"]` |
| Step 1 last name | `[data-test="lastName"]` |
| Step 1 postal code | `[data-test="postalCode"]` |
| Step 1 continue | `[data-test="continue"]` |
| Step 1/2 cancel | `[data-test="cancel"]` |
| Step 1 error banner | `[data-test="error"]` |
| Step 2 finish | `[data-test="finish"]` |
| Step 3 complete header | `[data-test="complete-header"]` |

All selectors use SauceDemo's `data-test` attribute convention.
