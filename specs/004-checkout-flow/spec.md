# Feature Specification: Checkout Flow

**Feature Branch**: `004-checkout-flow`
**Created**: 2026-03-13
**Status**: Draft
**Input**: User description: "Checkout flow for SauceDemo (3-step process)"

## Clarifications

### Session 2026-03-13

- Q: What is the order total math strategy for step 2 assertions? →
  A: Use exactly 2 items — "Sauce Labs Backpack" ($29.99) and "Sauce Labs Bike
  Light" ($9.99). All monetary assertions parse displayed DOM values only; no
  independent tax rate recalculation. Item total is verified by summing the two
  displayed prices and asserting against the displayed "Item total" line. Grand
  total is verified by parsing the displayed "Tax" and "Total" values and
  asserting `item_total + tax === total` using `toFixed(2)` precision.
  Rationale: DOM-driven arithmetic avoids false failures from rounding
  differences between test and application.
- Q: What is the cancel navigation destination for step 2? →
  A: SauceDemo's "Cancel" button on step 2 navigates to `/inventory.html`, not
  back to the cart. This is intentional SauceDemo behaviour — already captured
  correctly in US4 Scenario 2 and in Assumptions.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — End-to-End Happy Path (Priority: P1)

An authenticated user with items in their cart can complete the full 3-step
checkout: entering personal details on step 1, reviewing the order summary on
step 2, and reaching the confirmation page on step 3. The confirmation page
displays a success message acknowledging the order was placed.

**Why this priority**: The complete purchase funnel is the highest-value user
journey in the entire application. It is the critical path through all three
checkout steps and is the baseline that all other checkout scenarios build upon.
Without a passing happy path, no checkout validation is meaningful.

**Independent Test**: Can be fully tested by adding a product to the cart,
proceeding through all three checkout steps with valid data, and asserting
the confirmation message on the final page.

**Acceptance Scenarios**:

1. **Given** a user has at least one item in the cart and is on the cart page,
   **When** they click "Checkout", **Then** they are taken to step 1
   (personal information form).
2. **Given** a user is on step 1 and enters a valid first name, last name, and
   zip/postal code, **When** they click "Continue", **Then** they are taken
   to step 2 (order summary).
3. **Given** a user is on step 2 and reviews the order summary, **When** they
   click "Finish", **Then** they are taken to the confirmation page.
4. **Given** a user has reached the confirmation page, **When** they view the
   page, **Then** the message "Thank you for your order!" is displayed.

---

### User Story 2 — Step 1 Form Validation (Priority: P2)

An authenticated user who attempts to proceed from step 1 without completing
all required fields sees a specific, field-targeted error message. Each missing
field produces its own distinct error. The user remains on step 1 and can
correct the input before continuing.

**Why this priority**: Input validation on the personal information form
prevents incomplete orders from entering the system and guides users to correct
mistakes. Each field's validation message must be exact to be trustworthy.

**Independent Test**: Can be fully tested by submitting the step 1 form with
each required field empty in turn and asserting the exact error text. The
standard path (cart → checkout) is used to reach step 1 for realism.

**Acceptance Scenarios**:

1. **Given** a user is on step 1 and leaves the First Name field empty,
   **When** they click "Continue", **Then** the error message
   "Error: First Name is required" is displayed and the user remains on step 1.
2. **Given** a user is on step 1 and leaves the Last Name field empty (but
   First Name is filled), **When** they click "Continue", **Then** the error
   message "Error: Last Name is required" is displayed and the user remains
   on step 1.
3. **Given** a user is on step 1 and leaves the Zip/Postal Code field empty
   (but First Name and Last Name are filled), **When** they click "Continue",
   **Then** the error message "Error: Postal Code is required" is displayed
   and the user remains on step 1.

---

### User Story 3 — Step 2 Order Summary Accuracy (Priority: P3)

An authenticated user on step 2 sees a complete and financially accurate
summary of their order. The two specific products — "Sauce Labs Backpack"
($29.99) and "Sauce Labs Bike Light" ($9.99) — are added to the cart for this
test. All monetary assertions are DOM-driven: values are parsed from the
displayed page and cross-checked against each other using two-decimal precision.

**Why this priority**: The order summary is the final point where a user can
verify their purchase before committing. Incorrect item lists, totals, or tax
figures directly undermine user trust and represent a data integrity failure.

**Independent Test**: Can be fully tested by adding "Sauce Labs Backpack" and
"Sauce Labs Bike Light" to the cart, completing step 1, and asserting the
item list, displayed item total, displayed tax, and displayed grand total on
step 2. All figures are read from the DOM — no values are independently
recomputed. No completion of step 3 is required.

**Acceptance Scenarios**:

1. **Given** a user has added "Sauce Labs Backpack" and "Sauce Labs Bike Light"
   to the cart and reached step 2, **When** they view the order summary,
   **Then** the item list contains exactly those two products and no others.
2. **Given** a user is on step 2, **When** they view the displayed "Item total"
   line, **Then** its value equals the sum of the two displayed product prices
   ($29.99 + $9.99 = $39.98), verified using two-decimal precision.
3. **Given** a user is on step 2, **When** they view the tax line,
   **Then** a non-zero tax amount is displayed.
4. **Given** a user is on step 2, **When** they view the displayed "Total" line,
   **Then** its value equals the displayed "Item total" plus the displayed
   "Tax" amount, verified using two-decimal precision (`toFixed(2)`).

---

### User Story 4 — Cancel Navigation (Priority: P4)

An authenticated user can abandon the checkout process at step 1 or step 2
by clicking "Cancel". The destination differs by step: cancelling on step 1
returns to the cart, while cancelling on step 2 returns to the inventory page
(SauceDemo's documented behaviour — not a bug).

**Why this priority**: Cancel paths are safety valves that let users correct
mistakes without losing their session. Incorrect cancel destinations strand
users and force them to navigate manually, breaking the expected flow.

**Independent Test**: Can be fully tested by navigating to each checkout step
and clicking "Cancel", asserting the resulting destination independently for
each step.

**Acceptance Scenarios**:

1. **Given** a user is on step 1 (personal information), **When** they click
   "Cancel", **Then** they are returned to the cart page.
2. **Given** a user is on step 2 (order summary), **When** they click
   "Cancel", **Then** they are navigated to the inventory page
   (`/inventory.html`) — not back to the cart.

---

### Edge Cases

- What happens when the user navigates directly to step 2 or the confirmation
  page without completing prior steps? Direct URL access to mid-flow pages is
  out of scope; tests access steps only via the normal checkout funnel.
- What happens if the user completes the checkout and then clicks the browser
  back button? Post-confirmation back-navigation is out of scope.
- What happens when the cart is empty and the user reaches step 2? An empty
  cart at checkout is out of scope for this spec; at least one item is always
  present in setup.
- What happens when all three step 1 fields are empty and the user clicks
  "Continue"? SauceDemo validates fields sequentially — only the First Name
  error is shown first. Tests validate each field in isolation (one empty,
  others filled) to assert each error message independently.
- What happens if the DOM-parsed monetary values contain a rounding difference?
  All assertions use `toFixed(2)` precision on parsed values. No independent
  tax rate recalculation is performed; only the displayed `item_total + tax ===
  total` relationship is verified.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST present a personal information form (first name, last
  name, zip/postal code) as the first step of checkout.
- **FR-002**: System MUST prevent progression from step 1 when the First Name
  field is empty, displaying the message "Error: First Name is required".
- **FR-003**: System MUST prevent progression from step 1 when the Last Name
  field is empty, displaying the message "Error: Last Name is required".
- **FR-004**: System MUST prevent progression from step 1 when the Zip/Postal
  Code field is empty, displaying the message "Error: Postal Code is required".
- **FR-005**: System MUST advance the user to step 2 when all three step 1
  fields are completed and the user clicks "Continue".
- **FR-006**: System MUST display on step 2 the complete list of items that
  were in the cart when checkout was initiated, with no additions or omissions.
- **FR-007**: System MUST display on step 2 an "Item total" line whose displayed
  value equals the sum of all individual product prices shown in the summary,
  verified at two-decimal precision using DOM-parsed values only.
- **FR-008**: System MUST display on step 2 a non-zero tax amount on a "Tax"
  line.
- **FR-009**: System MUST display on step 2 a "Total" line whose displayed
  value equals the displayed "Item total" plus the displayed "Tax" amount,
  verified at two-decimal precision (`item_total + tax === total`).
- **FR-010**: System MUST display the message "Thank you for your order!" on
  the confirmation page after the user clicks "Finish" on step 2.
- **FR-011**: Clicking "Cancel" on step 1 MUST return the user to the cart page.
- **FR-012**: Clicking "Cancel" on step 2 MUST navigate the user to the
  inventory page (`/inventory.html`).

### Key Entities

- **Checkout Session**: Represents a user's in-progress purchase attempt
  initiated from the cart. Spans all three steps and carries the cart contents
  and entered personal details forward.
- **Personal Information**: The data collected on step 1: first name, last name,
  and zip/postal code. All three fields are required for progression.
- **Order Summary**: The financial breakdown shown on step 2. Consists of the
  item list (from the cart), a displayed "Item total", a displayed "Tax" amount,
  and a displayed "Total". The relationship `Item total + Tax = Total` is the
  verifiable financial contract, asserted using two-decimal precision.
- **Order Confirmation**: The terminal state of a successfully completed
  checkout. Identified by the "Thank you for your order!" message.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of checkout attempts with valid data in all three fields
  reach the confirmation page and display the success message.
- **SC-002**: Each of the three step 1 validation errors is triggered correctly
  and displays the exact expected message in 100% of test executions.
- **SC-003**: The item list on step 2 contains exactly "Sauce Labs Backpack"
  and "Sauce Labs Bike Light" in 100% of test executions (no missing or
  extra items).
- **SC-004**: The displayed "Item total" equals $39.98 (sum of $29.99 + $9.99)
  in 100% of test executions, verified at two-decimal precision from DOM values.
- **SC-005**: The displayed "Total" equals the displayed "Item total" plus the
  displayed "Tax" in 100% of test executions, verified using
  `toFixed(2)` precision.
- **SC-006**: "Cancel" on step 1 lands on the cart page and "Cancel" on step 2
  lands on the inventory page in 100% of test executions.

## Assumptions

- The entire checkout flow requires at least one item in the cart. Tests for
  step 1 validation and step 2 accuracy MUST add items programmatically
  before initiating checkout, per Constitution Principle III.
- For order summary tests (US3), exactly two products are used:
  "Sauce Labs Backpack" ($29.99) and "Sauce Labs Bike Light" ($9.99).
  These are stable SauceDemo catalogue items whose prices are fixed.
- All monetary assertions are DOM-driven: values are parsed from the displayed
  page and cross-verified against each other. No independent tax rate
  recalculation is performed in test code.
- Floating-point precision is handled by comparing `toFixed(2)` representations
  of parsed DOM values, not raw floating-point arithmetic.
- "Cancel" on step 2 returning to the inventory page (not the cart) is a
  documented SauceDemo behaviour, not a bug. US4 and FR-012 reflect this
  correctly.
- Post-confirmation state (e.g., cart cleared, badge reset) is observable
  but not in scope for this spec. That behaviour belongs to a post-checkout
  spec if required.
- "Continue" on step 1 is the progression control. "Finish" on step 2 is the
  order commitment control. Both are distinct and tested separately.
- Only `standard_user` is in scope. `error_user` has known errors on specific
  checkout actions and is excluded.
