# Quick Start: OWASP Security Test Suite

This guide helps you run the security test suite locally (with or without Docker) and understand the architecture.

## Prerequisites

- **Node.js** 18+
- **npm** 9+
- **Playwright** 1.40+ (should be installed via `npm install`)
- **Docker** (optional, required for Nuclei scanning; can skip for baseline tests)

## Setup

### 1. Install Dependencies

```bash
cd playwright-framework
npm install
npx playwright install chromium
```

### 2. Set Environment Variables

Create a `.env` file (or export them in your terminal):

```bash
SAUCE_USERNAME=standard_user
SAUCE_PASSWORD=secret_sauce
```

Or set them directly:

```bash
export SAUCE_USERNAME=standard_user
export SAUCE_PASSWORD=secret_sauce
```

## Running Tests

### Option A: Run Security Tests WITHOUT Nuclei Scanning (Baseline)

Fastest option for local development. Skips Nuclei vulnerability scanning.

```bash
# Run all security tests (19 tests, skip Nuclei validation)
npm run test:security

# Run a single test file
npx playwright test tests/security/access-control.spec.ts --project=security

# Run in headed mode (see browser)
npx playwright test tests/security/ --project=security --headed

# Run with UI mode (interactive debugger)
npx playwright test tests/security/ --project=security --ui
```

**What gets skipped**: `tests/security/nuclei-scan.spec.ts` — all other 5 test files run normally (19 tests pass).

---

### Option B: Run Security Tests WITH Nuclei Scanning (Full Validation)

Requires Docker. Performs vulnerability scanning with 735+ templates and validates CI failure on Critical/High findings.

#### Step 1: Run Nuclei Scan

```bash
# Run Nuclei Docker container to scan target URL
npm run nuclei:scan

# This generates: reports/nuclei-results.json
```

Alternatively, use local Nuclei if installed:

```bash
brew install nuclei
npm run nuclei:scan:local
```

#### Step 2: Run Security Tests with Nuclei Validation

```bash
# Run all security tests (includes Nuclei result validation)
npm run test:security:with-nuclei

# This runs all 22 tests (19 baseline + 3 Nuclei validation tests)
# Fails if any Critical or High severity vulnerabilities found
```

---

### Option C: Run Baseline Tests (Ensure No Regressions)

Before committing security tests, verify the existing 116-test baseline still passes:

```bash
# Run E2E tests (Chromium, Firefox, WebKit)
npx playwright test --project=chromium --project=firefox --project=webkit

# Run API tests
npx playwright test --project=api

# Run all (E2E + API + Security)
npx playwright test
```

---

## Troubleshooting

### Nuclei Scan Not Generating Results

**Error**: `results file is missing or empty`

**Cause**: Nuclei scan failed or didn't run to completion.

**Fix**:
```bash
# Check Docker logs
docker logs nuclei

# Rerun the scan
npm run nuclei:scan

# Verify the results file
ls -la reports/nuclei-results.json
cat reports/nuclei-results.json | jq '.' | head -20
```

### Nuclei Tests Fail on Unexpected Vulnerabilities

**Error**: `nuclei-scan.spec.ts` fails due to Critical/High findings

**Fix**:
```bash
# Inspect findings details
cat reports/nuclei-results.json | jq 'select(.severity == "critical" or .severity == "high")'

# Review target URL for actual vulnerabilities
# If findings are false positives, they may be documentation issues on SauceDemo
```

### Test Fails Due to Demo Site Version

**Error**: Tests expect certain selectors or behavior, but SauceDemo version differs.

**Cause**: SauceDemo is a live demo; UI/behavior may change.

**Fix**: Update selectors in the corresponding Page Object (`pages/LoginPage.ts`, etc.).

---

## File Structure

```
tests/security/
├── access-control.spec.ts   # A01: Unauthenticated route access
├── auth-security.spec.ts    # A07: Lockout, session invalidation
├── crypto-failures.spec.ts  # A02: Cookie security flags
├── headers.spec.ts          # A05: Response headers (API-only)
├── injection.spec.ts        # A03: XSS + SQLi payload injection
└── nuclei-scan.spec.ts      # Nuclei integration: result validation, assert findings

pages/
├── LoginPage.ts             # Login form interactions
├── InventoryPage.ts         # Product listing
├── CartPage.ts              # Shopping cart
└── CheckoutPage.ts          # Checkout flow

utils/
├── security-payloads.ts     # XSS/SQLi payload definitions
├── nuclei-helper.ts         # Nuclei JSONL parsing and result filtering
├── auth.ts                  # User fixtures (LOCKED_OUT_USER, etc.)
└── routes.ts                # URL constants

docker/
└── docker-compose.nuclei.yml # Nuclei vulnerability scanner configuration

docs/
└── NUCLEI_SETUP.md          # Detailed Nuclei setup and troubleshooting guide

specs/006-owasp-security-tests/
├── spec.md                  # Feature specification
├── plan.md                  # Implementation plan
├── contracts/               # API/security contracts
│   ├── session-cookie-contract.md
│   └── security-headers-contract.md
└── quickstart.md            # This file
```

---

## Key Concepts

### Playwright Fixture Integration

All security tests import from `fixtures/`:

```typescript
import { test, expect } from '@fixtures';

test('example security test', async ({ page, loginPage }) => {
  // loginPage is a fixture-injected Page Object
  await loginPage.login('standard_user', 'secret_sauce');
  // ...
});
```

### Page Object Model (POM)

Security tests use existing page objects to avoid selector duplication:

```typescript
// BAD (coupled to selectors)
await page.fill('[data-testid="username"]', 'user');
await page.click('[data-testid="login-btn"]');

// GOOD (uses Page Object)
await loginPage.login('user', 'password');
```

### Nuclei Result Validation

Nuclei scans the target URL independently before tests run. Tests validate the results file:

```typescript
// In tests/security/nuclei-scan.spec.ts:
const findings = await readNucleiResults('reports/nuclei-results.json');
const critical = filterFindingsBySeverity(findings, 'critical');
const high = filterFindingsBySeverity(findings, 'high');

if (critical.length > 0 || high.length > 0) {
  throw new Error(`Found ${critical.length} critical and ${high.length} high severity findings`);
}
```

### Security Payload Definitions

Payloads are defined once, reused in tests:

```typescript
// utils/security-payloads.ts
export const XSS_PAYLOADS = ['<script>alert(1)</script>', ...] as const;

// tests/security/injection.spec.ts
for (const payload of XSS_PAYLOADS) {
  await loginPage.fillUsername(payload);
  // Assert payload is escaped...
}
```

---

## Expected Test Results

### Baseline (without Nuclei scanning)

```
tests/security/access-control.spec.ts     ✓ 3 passed
tests/security/auth-security.spec.ts      ✓ 2 passed
tests/security/crypto-failures.spec.ts    ✓ 3 passed
tests/security/headers.spec.ts            ✓ 3 passed
tests/security/injection.spec.ts          ✓ 4 passed
tests/security/nuclei-scan.spec.ts        ⊘ 3 skipped (no results file)
─────────────────────────────────────────────────────
Total: 16 passed, 3 skipped
```

### With Nuclei Scanning (Full Suite)

```
tests/security/access-control.spec.ts     ✓ 3 passed
tests/security/auth-security.spec.ts      ✓ 2 passed
tests/security/crypto-failures.spec.ts    ✓ 3 passed
tests/security/headers.spec.ts            ✓ 3 passed
tests/security/injection.spec.ts          ✓ 4 passed
tests/security/nuclei-scan.spec.ts        ✓ 3 passed (if no Critical/High vulnerabilities)
─────────────────────────────────────────────────────
Total: 22 passed
```

**Note**: Full suite requires `npm run nuclei:scan` to generate `reports/nuclei-results.json` before running tests.

---

## CI/CD Integration

Security tests run in GitHub Actions via `.github/workflows/security.yml`:

```yaml
- Run lint & type-check (first)
- Run Nuclei Docker container to scan target URL
- Generate reports/nuclei-results.json (vulnerability findings)
- Run global setup (generate auth state)
- Run security test suite (tests/security/ with --project=security)
- Validate Nuclei results (fail on Critical/High findings)
- Upload Allure report as artifact
```

The pipeline **FAILS** if:
- Lint or type-check errors
- Any test fails
- Nuclei finds Critical or High severity vulnerabilities

---

## Next Steps

1. **Run baseline tests locally** (Option A): `npm run test:security`
2. **Review test files** to understand OWASP coverage
3. **Check out the contracts** for validation rules (`.md` files in `contracts/`)
4. **Enable Nuclei scanning** (Option B) to run full vulnerability scanning
5. **Integrate into CI** (GitHub Actions) via existing workflow

---

For more details, see:
- [spec.md](spec.md) — Feature specification and requirements
- [plan.md](plan.md) — Implementation architecture and design decisions
- [contracts/](contracts/) — API contracts and security definitions
- [docs/NUCLEI_SETUP.md](../../docs/NUCLEI_SETUP.md) — Detailed Nuclei setup guide
