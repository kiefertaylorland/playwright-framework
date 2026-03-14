# Feature Specification: Inventory Page — Product Listing

**Feature Branch**: `002-inventory-listing`
**Created**: 2026-03-13
**Status**: Draft
**Input**: User description: "Inventory page (product listing) for SauceDemo"

## Clarifications

### Session 2026-03-14

- Q: How should US1 structural completeness assertions be implemented in the
  `InventoryPage` contract? →
  A: Add and use the following `InventoryPage` methods for US1 structural
  assertions:
  - `getProductCount(): Promise<number>` counts `.inventory_item` elements and
    MUST equal `6`.
  - `getDescriptionCount(): Promise<number>` counts `.inventory_item_desc`
    elements and MUST equal `getProductCount()`.
  - `getAddToCartButtonCount(): Promise<number>` counts
    `[data-test^="add-to-cart"]` buttons and MUST equal `getProductCount()`.
  Rationale: Contract and task coverage require structural completeness proof
  for SC-001, not only product-name based assertions.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Product Catalogue Display (Priority: P1)

An authenticated user lands on the inventory page and sees a complete, correctly
structured product catalogue. Every product card shows a name, description,
price, and an actionable button to add the item to the cart. The page must
display all products without the user taking any additional action.

**Why this priority**: This is the foundational view of the application. All
other inventory interactions (sorting, navigation, cart) depend on products
being visible and structurally correct. It is the most-visited page in the app.

**Independent Test**: Can be fully tested by navigating to the inventory page
as an authenticated user and asserting the count and content structure of all
product cards. Delivers confidence that the catalogue renders correctly.

**Acceptance Scenarios**:

1. **Given** an authenticated user is on the inventory page, **When** the page
   finishes loading, **Then** exactly 6 product cards are visible.
2. **Given** an authenticated user is on the inventory page, **When** they
   inspect any product card, **Then** it contains a product name, a description
   text, a price, and an "Add to Cart" button.
3. **Given** an authenticated user is on the inventory page, **When** the page
   finishes loading, **Then** all 6 product cards have all four required
   elements present simultaneously.

---

### User Story 2 — Product Sorting (Priority: P2)

An authenticated user can sort the product catalogue using a dropdown menu that
offers four sort modes. Selecting a mode immediately reorders the visible
products according to the chosen criterion, with no page reload required.

**Why this priority**: Sorting is the primary discovery mechanism for users
comparing products. It validates data ordering logic and ensures the dropdown
controls the catalogue view correctly.

**Independent Test**: Can be fully tested in isolation by selecting each sort
option and asserting the resulting product order. No cart or navigation state
is required.

**Acceptance Scenarios**:

1. **Given** an authenticated user is on the inventory page, **When** they open
   the sort dropdown, **Then** exactly 4 options are available: Name (A to Z),
   Name (Z to A), Price (low to high), and Price (high to low).
2. **Given** an authenticated user selects "Name (A to Z)", **When** the
   catalogue updates, **Then** product names are ordered in ascending
   alphabetical order from first to last.
3. **Given** an authenticated user selects "Name (Z to A)", **When** the
   catalogue updates, **Then** product names are ordered in descending
   alphabetical order from first to last.
4. **Given** an authenticated user selects "Price (low to high)", **When** the
   catalogue updates, **Then** the product with the lowest price is listed
   first and prices increase toward the last item.
5. **Given** an authenticated user selects "Price (high to low)", **When** the
   catalogue updates, **Then** the product with the highest price is listed
   first and prices decrease toward the last item.

---

### User Story 3 — Product Detail Navigation (Priority: P3)

An authenticated user can navigate to a product's detail page by clicking its
name on the inventory listing. The detail page is specific to that product and
the user can return to the catalogue afterward.

**Why this priority**: Product detail navigation is essential for users
evaluating individual items before purchasing. It validates the link between
the catalogue and per-product content.

**Independent Test**: Can be fully tested by clicking a product name on the
inventory page and confirming the destination is that product's detail page.
No cart interaction is required.

**Acceptance Scenarios**:

1. **Given** an authenticated user is on the inventory page, **When** they
   click a product's name, **Then** they are navigated to that product's
   dedicated detail page.
2. **Given** an authenticated user is on a product detail page, **When** they
   navigate back, **Then** they return to the inventory page.

---

### User Story 4 — Cart Badge Counter (Priority: P4)

An authenticated user can add products to the cart directly from the inventory
page using the "Add to Cart" button on each product card. A badge on the cart
icon in the navigation header reflects the total number of items added,
updating with each addition.

**Why this priority**: The cart badge is the user's primary visual feedback
that items have been added successfully. Accurate counter state is a
prerequisite for any checkout flow built on top of this page.

**Independent Test**: Can be fully tested by adding one or more products from
the inventory page and asserting the cart badge count after each action. No
checkout or payment flow is required.

**Acceptance Scenarios**:

1. **Given** an authenticated user is on the inventory page with an empty cart,
   **When** they click "Add to Cart" on a product, **Then** the cart badge
   counter displays "1".
2. **Given** an authenticated user has already added one product, **When** they
   click "Add to Cart" on a second different product, **Then** the cart badge
   counter displays "2".
3. **Given** an authenticated user has added multiple products, **When** they
   view the cart badge, **Then** the count equals the total number of distinct
   products added from the inventory page.

---

### Edge Cases

- What if the sort dropdown is interacted with before the product list fully
  loads? The sort should apply to whichever products are rendered at the time
  or wait until products are available.
- What if two products have identical prices when sorting by price? Their
  relative order among themselves is unspecified; the test should only assert
  that lower-priced items appear before higher-priced items.
- What if two products have names starting with the same letter when sorting
  alphabetically? Standard lexicographic order applies.
- What happens to the cart badge if the user navigates away and returns to
  the inventory page? The badge count should persist — it reflects cart state,
  not page state.
- What happens when the user adds all 6 products? The badge should show "6"
  and all "Add to Cart" buttons should change state (e.g., to "Remove").

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display exactly 6 product cards on the inventory page
  upon arrival by an authenticated user.
- **FR-002**: Each product card MUST contain a product name, a description, a
  price, and an "Add to Cart" button.
- **FR-003**: System MUST provide a sort dropdown on the inventory page with
  exactly four options: Name (A to Z), Name (Z to A), Price (low to high),
  and Price (high to low).
- **FR-004**: Selecting "Name (A to Z)" MUST reorder the visible products into
  ascending alphabetical order by product name.
- **FR-005**: Selecting "Name (Z to A)" MUST reorder the visible products into
  descending alphabetical order by product name.
- **FR-006**: Selecting "Price (low to high)" MUST reorder products so the
  cheapest item appears first and prices increase toward the last item.
- **FR-007**: Selecting "Price (high to low)" MUST reorder products so the most
  expensive item appears first and prices decrease toward the last item.
- **FR-008**: Clicking a product name MUST navigate the user to that product's
  dedicated detail page.
- **FR-009**: Clicking "Add to Cart" on a product card MUST increment the cart
  badge counter in the navigation header by 1.
- **FR-010**: The cart badge counter MUST reflect the cumulative total of all
  products added across multiple "Add to Cart" interactions on the inventory page.

### Key Entities

- **Product**: Represents a single item in the catalogue. Has a name, a
  description, a price, and a cart-add action. The inventory page always shows
  all products; there is no pagination.
- **Sort Selection**: Represents the user's chosen ordering criterion for the
  product list. Changing the selection immediately reorders all visible products.
- **Cart Badge**: Represents the running count of items in the user's cart,
  displayed in the navigation header. Updated in real time as items are added.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of inventory page loads for authenticated users show exactly
  6 product cards with all four required elements per card.
- **SC-002**: All 4 sort options are selectable and produce the correct ordering
  in 100% of test executions.
- **SC-003**: The product order after each sort selection is verifiably correct
  against the expected alphabetical or numeric sequence.
- **SC-004**: Clicking a product name navigates to the correct detail page in
  100% of test executions.
- **SC-005**: The cart badge count is accurate after each individual "Add to Cart"
  action, verified for sequences of 1 through at least 3 additions.
- **SC-006**: The cart badge reflects the correct cumulative total when multiple
  different products are added in a single session.

## Assumptions

- The inventory page always shows all 6 products for `standard_user`. No
  filtering, pagination, or category grouping is present.
- Product prices are numeric values (e.g., "$29.99") — price sorting is
  validated against the numeric value, not the string representation.
- The default sort order on page load is "Name (A to Z)" unless a prior
  session has persisted a different selection. Tests that depend on sort
  order MUST explicitly set the sort option rather than relying on default state.
- "Add to Cart" buttons in these scenarios are tested using `standard_user`
  only. `problem_user` and `error_user` have known bugs on this page and are
  out of scope for this spec.
- Product detail navigation is verified by confirming arrival on the correct
  detail page; the content of the detail page itself is out of scope for
  this spec.
- Cart badge persistence across navigation is assumed to be within a single
  browser session only.
