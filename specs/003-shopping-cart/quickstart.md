# Quickstart: Shopping Cart Tests

**Feature**: 003-shopping-cart
**Target**: https://www.saucedemo.com/cart.html
**Depends on**: `001-saucedemo-auth` and `002-inventory-listing`

## Prerequisites

```bash
npm install
npx playwright install
```

Authenticated state file is required:

```bash
.auth/standard-user.json
```

If missing, generate by running any authenticated suite:

```bash
npx playwright test tests/e2e/session.spec.ts --project=chromium
```

## Environment Setup

Use the same env vars as 001:

```bash
SAUCE_USERNAME=standard_user
SAUCE_PASSWORD=secret_sauce
```

## Running Cart Tests

```bash
# Run only cart tests
npx playwright test tests/e2e/cart.spec.ts

# Run cart tests on chromium only
npx playwright test tests/e2e/cart.spec.ts --project=chromium

# Run cart tests on all browsers
npx playwright test tests/e2e/cart.spec.ts --project=chromium --project=firefox --project=webkit

# Debug in headed mode
npx playwright test tests/e2e/cart.spec.ts --headed --project=chromium
```

## Expected Output

```
Running 21 tests using 4 workers

  ✓ [chromium] › cart.spec.ts › Cart Display — shows one added item with full details (420ms)
  ✓ [chromium] › cart.spec.ts › Cart Display — shows three added items (530ms)
  ✓ [chromium] › cart.spec.ts › Removal — removing one of two items decrements badge (460ms)
  ✓ [chromium] › cart.spec.ts › Removal — removing last item empties cart and hides badge (470ms)
  ✓ [chromium] › cart.spec.ts › Persistence — items remain after navigating away and returning (490ms)
  ✓ [chromium] › cart.spec.ts › Cart Action — Continue Shopping routes to inventory (280ms)
  ✓ [chromium] › cart.spec.ts › Cart Action — Checkout routes to step one (300ms)
  ...

  21 passed (11.2s)
```

## Test Structure Rules

```text
tests/e2e/cart.spec.ts
  - inherits default storageState (.auth/standard-user.json)
  - does not call test.use({ storageState: ... })
  - adds items fresh inside each test body
  - verifies cart count by reading DOM badge value
  - includes away-and-return persistence assertion
  - imports test/expect from fixtures only
```

## Lint and Type Check

```bash
npm run lint
npx tsc --noEmit
```

## Constitution Compliance Checks

```bash
# Principle VII: no direct @playwright/test imports
grep -r "from '@playwright/test'" tests/

# Feature rule: no storageState override in cart tests
grep -n "test.use" tests/e2e/cart.spec.ts

# Principle II: selectors stay out of test files
grep -nE "data-test|locator\(|getByTestId\(" tests/e2e/cart.spec.ts
```

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Cart row count mismatch | Items were not added in this test body | Add all required items explicitly inside the current test |
| Badge assertion fails | Badge hidden when cart empty | Treat hidden badge as count `0` |
| Persistence test flakes | Return-to-cart step not explicit | Navigate away, then explicitly return to `/cart.html` before assertion |
| Continue shopping test lands wrong page | Assertion expects cart | Assert `/inventory.html` for `Continue Shopping` |
| Checkout action fails | Cart page not loaded before click | Ensure test is on `/cart.html` before `clickCheckout()` |
