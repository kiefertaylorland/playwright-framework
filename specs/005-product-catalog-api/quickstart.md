# Quickstart: Product Catalog API Tests

**Feature**: 005-product-catalog-api
**Target**: https://api.practicesoftwaretesting.com

## Prerequisites

Node.js 18+ and npm must be installed. Playwright and its dependencies must be
installed:

```bash
npm install
npx playwright install
```

## Environment Setup

Create a `.env` file at the repository root (never commit this file):

```bash
# Practice Software Testing API
PST_API_URL=https://api.practicesoftwaretesting.com
PST_API_USERNAME=customer@practicesoftwaretesting.com
PST_API_PASSWORD=welcome01
```

The `.env` file is gitignored. In CI, these are set as GitHub Actions secrets
injected as environment variables.

## Running API Tests

API tests live under `tests/api/` and use the `request` fixture only.
No browser is launched.

```bash
# Run only API tests
npx playwright test tests/api/

# Run a single API test file
npx playwright test tests/api/products.spec.ts

# Run with verbose output
npx playwright test tests/api/ --reporter=list

# Run in parallel (default, no browser overhead)
npx playwright test tests/api/ --workers=4
```

## Expected Output

All 8 scenarios should pass in under 10 seconds total (HTTP-only, no browser):

```
Running 8 tests using 4 workers

  ✓ [api] › products.spec.ts › Product List — returns 200 with paginated data (320ms)
  ✓ [api] › products.spec.ts › Product List — every item has id, name, price, image (118ms)
  ✓ [api] › products.spec.ts › Product Detail — valid UUID returns 200 with full record (95ms)
  ✓ [api] › products.spec.ts › Product Detail — nil UUID returns 404 (88ms)
  ✓ [api] › auth.spec.ts › Auth Login — valid credentials return access_token (210ms)
  ✓ [api] › auth.spec.ts › Auth Login — invalid credentials return 401 or 422 (180ms)
  ✓ [api] › categories.spec.ts › Categories — returns 200 with non-empty array (95ms)
  ✓ [api] › categories.spec.ts › Bearer Token — product list with valid token returns 200 (310ms)

  8 passed (1.4s)
```

## Generating the Allure Report

```bash
npx playwright test tests/api/ --reporter=allure-playwright
npx allure generate reports/allure-results --clean
npx allure open
```

## Linting and Type Checking

These MUST pass before any PR:

```bash
npm run lint
npx tsc --noEmit
```

## Verifying Constitution Compliance

```bash
# Must return zero results — no direct @playwright/test imports in tests/
grep -r "from '@playwright/test'" tests/
```

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| `PST_API_URL is not defined` | Missing `.env` file | Create `.env` as shown above |
| `401 Unauthorized` on login test | Wrong credentials in `.env` | Verify `PST_API_USERNAME` and `PST_API_PASSWORD` |
| `Cannot find module '@fixtures'` | Path aliases not configured | Run `npx tsc --noEmit` to see config errors |
| Tests time out | API unreachable | Check network connectivity to `api.practicesoftwaretesting.com` |
