# Quickstart: Checkout Flow Tests

**Feature**: 004-checkout-flow
**Target**: https://www.saucedemo.com
**Depends on**: `001-saucedemo-auth` and `002-inventory-listing`

## Prerequisites

```bash
npm install
npx playwright install
```

Authenticated state file must exist:

```bash
.auth/standard-user.json
```

If missing, generate it by running any authenticated suite:

```bash
npx playwright test tests/e2e/session.spec.ts --project=chromium
```

## Environment Setup

Use the same env vars as feature 001:

```bash
SAUCE_USERNAME=standard_user
SAUCE_PASSWORD=secret_sauce
```

## Running Checkout Tests

```bash
# Run checkout feature only
npx playwright test tests/e2e/checkout.spec.ts

# Run on one browser
npx playwright test tests/e2e/checkout.spec.ts --project=chromium

# Run all 3 browser projects
npx playwright test tests/e2e/checkout.spec.ts --project=chromium --project=firefox --project=webkit

# Debug in headed mode
npx playwright test tests/e2e/checkout.spec.ts --headed --project=chromium
```

## Expected Output

```
Running 21 tests using 4 workers

  ✓ [chromium] › checkout.spec.ts › Happy Path — completes 3-step checkout (620ms)
  ✓ [chromium] › checkout.spec.ts › Step 1 Validation — first name required (380ms)
  ✓ [chromium] › checkout.spec.ts › Step 1 Validation — last name required (390ms)
  ✓ [chromium] › checkout.spec.ts › Step 1 Validation — postal code required (400ms)
  ✓ [chromium] › checkout.spec.ts › Step 2 Summary — Backpack + Bike Light totals are DOM-consistent (540ms)
  ✓ [chromium] › checkout.spec.ts › Cancel — step 1 returns to cart (300ms)
  ✓ [chromium] › checkout.spec.ts › Cancel — step 2 returns to inventory (340ms)
  ...

  21 passed (10.8s)
```

## Test Structure at a Glance

```text
tests/e2e/checkout.spec.ts
  - uses default storageState (.auth/standard-user.json)
  - adds required items fresh inside each test body
  - asserts step 1 validation messages exactly
  - asserts step 2 monetary values by parsing displayed DOM strings only
  - verifies grand total with (itemTotal + tax).toFixed(2) === total.toFixed(2)
```

## Linting and Type Checking

```bash
npm run lint
npx tsc --noEmit
```

## Verifying Constitution Compliance

```bash
# Principle VII: test files must import from fixtures only
grep -r "from '@playwright/test'" tests/

# Feature rule: checkout tests must not override storageState
grep -n "storageState: undefined" tests/e2e/checkout.spec.ts

# Principle II: no selectors in checkout test file
grep -nE "data-test|locator\(|getByTestId\(" tests/e2e/checkout.spec.ts
```

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Step 2 has unexpected extra items | Cart was not set up explicitly in test body | Add/remove items only inside each test body before checkout |
| Item total assertion fails | Label parsing did not strip prefix text | Parse from DOM with `parseFloat(text.replace(/[^0-9.]/g, ''))` |
| Grand total assertion fails by 0.01 | Raw float comparison used | Compare `toFixed(2)` values only |
| Cancel step 2 test expects cart | Wrong expectation | Assert `/inventory.html` for step-2 cancel |
| Tests redirect to login page | Missing/invalid auth storage state | Regenerate `.auth/standard-user.json` via global setup |
