# Feature Specification: Shopping Cart

**Feature Branch**: `003-shopping-cart`
**Created**: 2026-03-13
**Status**: Draft
**Input**: User description: "Shopping cart for SauceDemo"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Cart Item Display (Priority: P1)

An authenticated user who has added items to their cart can navigate to the
cart page and see each item displayed with its full details: name, description,
and price. The cart reflects exactly the products that were added from the
inventory page.

**Why this priority**: Displaying cart contents correctly is the foundational
purpose of the cart page. All other cart interactions (removal, persistence,
checkout) depend on items being visible and structurally complete. Users cannot
make informed checkout decisions without accurate item details.

**Independent Test**: Can be fully tested by adding one or more products from
the inventory page, navigating to the cart, and asserting the item count and
detail content of each cart row. Delivers confidence that the cart accurately
reflects what the user selected.

**Acceptance Scenarios**:

1. **Given** an authenticated user has added one product from the inventory
   page, **When** they navigate to the cart page, **Then** exactly one item
   is listed in the cart.
2. **Given** an authenticated user has added three different products from
   the inventory page, **When** they navigate to the cart page, **Then**
   all three items are listed in the cart.
3. **Given** an authenticated user is on the cart page with at least one item,
   **When** they inspect a cart row, **Then** it displays the product's name,
   description, and price.

---

### User Story 2 — Cart Item Removal (Priority: P2)

An authenticated user can remove individual items from the cart while on the
cart page. After removal, the item disappears from the list and the cart badge
counter in the navigation header decrements accordingly. Removing all items
leaves the cart empty.

**Why this priority**: Item removal is a core cart management action. Without
it, users are forced to abandon and restart their session to correct mistakes.
Badge counter accuracy after removal is also critical for user trust in the
cart state.

**Independent Test**: Can be fully tested by adding items to the cart, navigating
to the cart page, removing one item, and asserting both the updated item list
and the revised badge count. No checkout step is required.

**Acceptance Scenarios**:

1. **Given** a user has two items in the cart and is on the cart page,
   **When** they click "Remove" on one item, **Then** that item is no longer
   listed in the cart.
2. **Given** a user has removed one of two cart items, **When** they view
   the navigation header, **Then** the cart badge counter decrements by 1.
3. **Given** a user has one item in the cart and removes it, **When** they
   view the cart page, **Then** the cart is empty and no item rows are shown.
4. **Given** a user has removed all items from the cart, **When** they view
   the navigation header, **Then** the cart badge is no longer visible (or
   shows zero).

---

### User Story 3 — Cart Persistence Across Navigation (Priority: P3)

An authenticated user's cart contents are preserved when they navigate away
from the cart page and return to it within the same session. Items added
before leaving the cart are still present when the user comes back.

**Why this priority**: Cart persistence is a fundamental expectation in any
e-commerce experience. Users who browse back to the inventory page to compare
products must not lose their prior selections. Loss of cart state is a direct
driver of abandoned purchases.

**Independent Test**: Can be fully tested by adding items to the cart,
navigating to the inventory page, then returning to the cart and confirming
the items are unchanged.

**Acceptance Scenarios**:

1. **Given** a user has items in their cart, **When** they navigate to the
   inventory page and then return to the cart page, **Then** the same items
   are still listed in the cart.
2. **Given** a user has items in their cart, **When** they navigate to a
   product detail page and then return to the cart page, **Then** the same
   items are still listed in the cart.

---

### User Story 4 — Cart Page Actions (Priority: P4)

An authenticated user on the cart page has two exit actions: "Continue Shopping",
which returns them to the inventory page, and "Checkout", which advances them
into the checkout flow. Both actions must navigate to the correct destination.

**Why this priority**: These navigation controls define the two critical user
journeys diverging from the cart: abandoning the cart to keep browsing versus
committing to purchase. Incorrect routing breaks the purchase funnel entirely.

**Independent Test**: Can be fully tested by navigating to the cart page and
clicking each action button independently, asserting the resulting destination.
No items in the cart are required to test navigation.

**Acceptance Scenarios**:

1. **Given** an authenticated user is on the cart page, **When** they click
   "Continue Shopping", **Then** they are navigated back to the inventory page.
2. **Given** an authenticated user is on the cart page, **When** they click
   "Checkout", **Then** they are navigated to the first step of the checkout
   flow.

---

### Edge Cases

- What happens when the user removes an item that was the only item in the
  cart? The cart should show an empty state and the badge should disappear
  or show zero.
- What happens if the user navigates directly to the cart URL before adding
  any items? The cart should load and display an empty state without error.
- What happens when the user adds the same product twice? SauceDemo does not
  support quantity — each product can only be added once. The "Add to Cart"
  button becomes "Remove" after the first click; a second add is not possible
  without removal first.
- What happens to cart contents after a page reload on the cart page? Cart
  state should persist within the session (same browser context).
- What happens when the user clicks "Checkout" from an empty cart? This edge
  case is out of scope for this spec; it belongs to the checkout flow spec.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display all products previously added from the
  inventory page as individual rows on the cart page.
- **FR-002**: Each cart row MUST show the product's name, description, and price.
- **FR-003**: System MUST display the correct number of item rows matching the
  number of distinct products added to the cart.
- **FR-004**: Users MUST be able to remove any individual item from the cart
  using a "Remove" action on its row.
- **FR-005**: System MUST remove the item row immediately upon the user
  triggering the remove action, without requiring a page reload.
- **FR-006**: System MUST decrement the cart badge counter by 1 each time an
  item is removed from the cart.
- **FR-007**: System MUST hide or clear the cart badge counter when the cart
  becomes empty.
- **FR-008**: System MUST preserve cart contents when the user navigates away
  from the cart page and returns within the same session.
- **FR-009**: Clicking "Continue Shopping" MUST navigate the user to the
  inventory page.
- **FR-010**: Clicking "Checkout" MUST navigate the user to the first step
  of the checkout flow.

### Key Entities

- **Cart**: Represents the user's current collection of selected products
  within a session. Has zero or more cart items. Persists across page navigation
  within the same session.
- **Cart Item**: Represents a single product added to the cart. Has a name,
  description, price, and a remove action. Each product appears at most once
  — quantity selection is not a feature of SauceDemo.
- **Cart Badge**: The numerical indicator in the navigation header showing the
  total count of items in the cart. Updates in real time when items are added
  or removed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of products added from the inventory page appear as rows
  on the cart page with the correct name, description, and price.
- **SC-002**: The item count on the cart page matches the number of products
  added in 100% of test executions.
- **SC-003**: After removing an item, the cart row count decreases by exactly 1
  and the badge counter decreases by exactly 1 in 100% of test executions.
- **SC-004**: An empty cart (all items removed) shows no item rows and no
  badge counter in 100% of test executions.
- **SC-005**: Cart contents are unchanged in 100% of test executions after
  navigating away and returning to the cart page within the same session.
- **SC-006**: "Continue Shopping" lands on the inventory page and "Checkout"
  lands on the checkout flow entry point in 100% of test executions.

## Assumptions

- SauceDemo does not support quantity per cart item. Each product can be
  added at most once; the "Add to Cart" button converts to "Remove" after
  the first click.
- Cart persistence is scoped to a single browser session. Cross-session
  persistence (e.g., closing and reopening the browser) is out of scope.
- The checkout flow destination (reached via "Checkout") is a distinct
  feature covered by a separate spec. This spec only validates that the
  button navigates to the correct starting point.
- "Continue Shopping" is expected to land on the inventory page regardless
  of which page the user was on before opening the cart.
- Tests that require items in the cart MUST add them programmatically via
  the inventory page in the test setup, not by assuming pre-existing cart state.
  This ensures isolation per Constitution Principle III.
- Only `standard_user` is in scope. `error_user` has known issues with
  remove functionality and is out of scope for this spec.
