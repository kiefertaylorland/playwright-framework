# Quick Start: OWASP Security Test Suite

This guide helps you run the security test suite locally (with or without Docker) and understand the architecture.

## Prerequisites

- **Node.js** 18+
- **npm** 9+
- **Playwright** 1.40+ (should be installed via `npm install`)
- **Docker** (optional, required for ZAP proxy; can skip with `ZAP_PROXY_SKIP=1`)

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

### Option A: Run Security Tests WITHOUT ZAP (Local Testing)

Fastest option for local development. Skips ZAP passive scanning and REST API assertions.

```bash
# Run all security tests, skip ZAP-related assertions
ZAP_PROXY_SKIP=1 npx playwright test tests/security/ --project=security

# Run a single test file
ZAP_PROXY_SKIP=1 npx playwright test tests/security/access-control.spec.ts --project=security

# Run in headed mode (see browser)
ZAP_PROXY_SKIP=1 npx playwright test tests/security/ --project=security --headed

# Run with UI mode (interactive debugger)
ZAP_PROXY_SKIP=1 npx playwright test tests/security/ --project=security --ui
```

**What gets skipped**: `tests/security/zap-passive-scan.spec.ts` — all other 5 test files run normally.

---

### Option B: Run Security Tests WITH ZAP (Full Validation)

Requires Docker and OWASP ZAP. Performs passive scanning and validates CI failure on Critical/High alerts.

#### Step 1: Start ZAP Docker Container

```bash
# Start ZAP daemon on port 8080
docker run -d \
  --name zap-container \
  -p 8080:8080 \
  -e ZAP_CONFIG_ENABLEALPHA=true \
  owasp/zap2docker-stable \
  zap.sh -config api.disablekey=true -config api.addons.scripts=true

# Verify ZAP is ready (wait for port 8080 to respond)
curl http://localhost:8080/JSON/core/view/version/
```

Alternatively, use the provided docker-compose:

```bash
npm run zap:up    # Starts ZAP container via docker-compose.zap.yml
```

#### Step 2: Run Security Tests with ZAP Proxy

```bash
# Run all security tests (includes ZAP passive scanning)
npx playwright test tests/security/ --project=security

# Run only the ZAP passive scan test
npx playwright test tests/security/zap-passive-scan.spec.ts --project=security

# Run other tests while ZAP is running (they route through proxy automatically)
npx playwright test tests/security/access-control.spec.ts --project=security
```

#### Step 3: Stop ZAP

```bash
npm run zap:down   # Stops ZAP container

# Or manually:
docker stop zap-container && docker rm zap-container
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

### ZAP Connection Refused

**Error**: `Error: connect ECONNREFUSED 127.0.0.1:8080`

**Cause**: ZAP container is not running or not listening on port 8080.

**Fix**:
```bash
# Check if ZAP is running
docker ps | grep zap

# Restart ZAP
npm run zap:down && npm run zap:up

# Wait 10 seconds for startup
sleep 10

# Test ZAP endpoint
curl http://localhost:8080/JSON/core/view/version/
```

### Playwright Test Timeout (Proxy Latency)

**Error**: `Timeout: 30000ms exceeded`

**Cause**: ZAP proxy is slow or busy scanning. Increase timeout:

```bash
# Edit playwright.config.ts, increase timeout in security project
{
  name: 'security',
  use: {
    ...
  },
  timeout: 60000, // Increase from 30s to 60s
}
```

Or run with a lower worker count to reduce load:

```bash
npx playwright test tests/security/ --project=security --workers=1
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
└── zap-passive-scan.spec.ts # ZAP integration: query REST API, assert findings

pages/
├── LoginPage.ts             # Login form interactions
├── InventoryPage.ts         # Product listing
├── CartPage.ts              # Shopping cart
└── CheckoutPage.ts          # Checkout flow

utils/
├── security-payloads.ts     # XSS/SQLi payload definitions
├── auth.ts                  # User fixtures (LOCKED_OUT_USER, etc.)
└── routes.ts                # URL constants

docker/
└── docker-compose.zap.yml   # ZAP Docker configuration

specs/006-owasp-security-tests/
├── spec.md                  # Feature specification
├── plan.md                  # Implementation plan
├── contracts/               # API/security contracts
│   ├── zap-alert-contract.md
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

### ZAP Proxy Routing

When running with ZAP, all Playwright browser traffic is automatically routed through the proxy:

```typescript
// In playwright.config.ts (security project):
proxy: { server: 'http://localhost:8080' }

// Playwright navigates normally; ZAP intercepts traffic transparently
// No test changes needed — ZAP just observes and scans
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

### Without ZAP (`ZAP_PROXY_SKIP=1`)

```
tests/security/access-control.spec.ts     ✓ 3 passed
tests/security/auth-security.spec.ts      ✓ 2 passed
tests/security/crypto-failures.spec.ts    ✓ 3 passed
tests/security/headers.spec.ts            ✗ 1 failed (demo site missing headers)
tests/security/injection.spec.ts          ✓ 4 passed
tests/security/zap-passive-scan.spec.ts   SKIPPED (ZAP_PROXY_SKIP=1)
─────────────────────────────────────────────────────
Total: 12 passed, 1 failed, 1 skipped
```

**Note**: `headers.spec.ts` may fail if SauceDemo demo site doesn't have all headers (this documents real gaps).

### With ZAP (Full Suite)

```
tests/security/access-control.spec.ts     ✓ 3 passed
tests/security/auth-security.spec.ts      ✓ 2 passed
tests/security/crypto-failures.spec.ts    ✓ 3 passed
tests/security/headers.spec.ts            ✗ 1 failed
tests/security/injection.spec.ts          ✓ 4 passed
tests/security/zap-passive-scan.spec.ts   ✓ 1 passed (if no Critical/High alerts)
─────────────────────────────────────────────────────
Total: 13 passed, 1 failed (zap-passive-scan passes if alerts are Low/Medium/Info only)
```

---

## CI/CD Integration

Security tests run in GitHub Actions via `.github/workflows/security.yml`:

```yaml
- Run lint & type-check (first)
- Start ZAP Docker container
- Run global setup (generate auth state)
- Run security test suite (tests/security/ with --project=security)
- Query ZAP REST API for findings
- Stop ZAP container
- Upload Allure report as artifact
```

The pipeline **FAILS** if:
- Lint or type-check errors
- Any test fails
- ZAP reports Critical or High severity alerts

---

## Next Steps

1. **Run locally** (Option A): `ZAP_PROXY_SKIP=1 npx playwright test tests/security/ --project=security`
2. **Review test files** to understand OWASP coverage
3. **Check out the contracts** for validation rules (`.md` files in `contracts/`)
4. **Enable ZAP** (Option B) once comfortable with baseline tests
5. **Integrate into CI** (GitHub Actions) via existing workflow

---

For more details, see:
- [spec.md](spec.md) — Feature specification and requirements
- [plan.md](plan.md) — Implementation architecture and design decisions
- [contracts/](contracts/) — API contracts and security definitions
