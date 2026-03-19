# Implementation Plan: OWASP Security Test Suite with ZAP Integration

**Branch**: `006-owasp-security-tests` | **Date**: 2026-03-18 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/006-owasp-security-tests/spec.md`

## Summary

Implement a security test suite for the Playwright framework that validates OWASP Top 10 vulnerabilities (A01-A07) testable via Playwright browser automation. The suite integrates OWASP ZAP as a transparent proxy for passive vulnerability scanning. Tests cover access control (A01), cryptographic failures (A02), injection attacks (A03), security misconfiguration (A05), and authentication failures (A07). The security project runs under Chromium with ZAP proxy enabled (port 8080). CI pipeline fails on Critical/High severity alerts from ZAP REST API. All tests use page object models, avoid direct Playwright imports, and maintain independence from the existing 116-test baseline.

## Technical Context

**Language/Version**: TypeScript 5.x (matching framework, strict mode enabled)
**Primary Dependencies**:
  - Playwright 1.40+ (browser automation, request fixture for API tests)
  - OWASP ZAP (Docker image, passive scanning, REST API v1.0)
  - Node.js 18+ (test runner environment)

**Storage**: N/A (test data via fixtures; no persistent storage)
**Testing**: Playwright Test (@playwright/test via fixtures/, ESLint, TypeScript compiler)
**Target Platform**: GitHub Actions (Linux runner with Docker)
**Project Type**: Test automation framework (not shipped code; internal QA tooling)
**Performance Goals**:
  - Full security test suite completes within 5 minutes on CI (including ZAP startup/shutdown)
  - Individual test execution: <30 seconds per test (no timeouts)

**Constraints**:
  - Single browser (Chromium only) due to ZAP proxy complexity with multiple browsers
  - Passive scanning only (no active scans against third-party SauceDemo)
  - ZAP runs on port 8080 (non-standard for security testing; avoid port conflicts)
  - Must not modify SauceDemo application (target is read-only demo site)

**Scale/Scope**:
  - 6 test files (access-control, auth-security, crypto-failures, headers, injection, zap-passive-scan)
  - ~15-20 total test cases across security suite
  - 5 distinct user flows for ZAP traffic generation (login, inventory, cart, checkout steps 1-2)

## Constitution Check

✅ **GATE PASS** — All 8 principles from Constitution v1.0.0 are met or explicitly deferred.

| Principle | Status | Compliance Note |
|-----------|--------|-----------------|
| I. Strict TypeScript | ✅ PASS | Security tests use TypeScript; `strict: true`, `noImplicitAny: true` enforced |
| II. Page Object Model | ✅ PASS | All test files use `LoginPage`, `InventoryPage`, `CheckoutPage` from `pages/` |
| III. Test Isolation | ✅ PASS | Each test independently testable; no shared mutable state; parallel-safe design |
| IV. Selector Hierarchy | ✅ PASS | POM enforces `data-testid` → ARIA → CSS precedence |
| V. Secrets Management | ✅ PASS | SauceDemo credentials sourced from `process.env` (SAUCE_USERNAME, SAUCE_PASSWORD) |
| VI. Parallel-Safe Design | ✅ PASS | ~15 tests designed to run with `--workers=4`; no shared accounts or resources |
| VII. Fixture Imports | ✅ PASS | All test files import from `fixtures/` (not `@playwright/test` directly) |
| VIII. API Test Purity | ✅ PASS | `tests/security/headers.spec.ts` uses `request` fixture only; no browser/page |

**Note**: Constitution Principle VIII (Security & Quality Gates) explicitly mandates ZAP integration and CI failure on Critical/High findings — this feature fully satisfies those gates.

## Project Structure

### Documentation (this feature)

```text
specs/006-owasp-security-tests/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0: ZAP integration patterns, proxy configuration
├── data-model.md        # Phase 1: ZAP Alert entity, Security Payload definitions
├── quickstart.md        # Phase 1: Local setup guide (with/without Docker)
├── contracts/           # Phase 1: ZAP API contract, test structure contract
│   ├── zap-alert-contract.md
│   ├── security-headers-contract.md
│   └── session-cookie-contract.md
├── checklists/
│   └── requirements.md   # Quality validation checklist
└── tasks.md             # Phase 2 output (from /speckit.tasks command)
```

### Source Code (repository root)

```text
playwright-framework/
├── tests/
│   └── security/                    # NEW: Security test suite
│       ├── access-control.spec.ts   # A01 tests
│       ├── crypto-failures.spec.ts  # A02 tests
│       ├── injection.spec.ts        # A03 tests (XSS + SQLi)
│       ├── headers.spec.ts          # A05 tests
│       ├── auth-security.spec.ts    # A07 tests
│       └── zap-passive-scan.spec.ts # ZAP integration tests
│
├── pages/                           # EXISTING: Page objects (reused)
│   ├── LoginPage.ts
│   ├── InventoryPage.ts
│   ├── CartPage.ts
│   ├── CheckoutPage.ts
│   └── BasePage.ts
│
├── utils/
│   ├── security-payloads.ts         # NEW: XSS/SQLi payloads as const arrays
│   ├── auth.ts                      # EXISTING
│   └── routes.ts                    # EXISTING
│
├── fixtures/
│   └── index.ts                     # EXISTING (extend for security context if needed)
│
├── docker/
│   └── docker-compose.zap.yml       # NEW: ZAP Docker configuration
│
├── playwright.config.ts             # MODIFY: Add 'security' project
├── package.json                     # MODIFY: Add test:security, zap:up, zap:down scripts
│
└── .github/
    └── workflows/
        └── security.yml             # NEW: CI/CD for security tests + ZAP
```

**Structure Decision**: Extend existing test framework without new top-level projects. Security tests coexist with E2E/API tests under `tests/security/` directory. Page objects and fixtures are reused from existing framework. ZAP Docker configuration lives in `docker/` alongside any future infrastructure-as-code. CI pipeline added as `security.yml` alongside existing workflows.

## Phase 0: Research

No critical unknowns requiring research. All pre-decided answers documented:

- ✅ **ZAP Integration Method**: Docker-based transparent proxy (port 8080)
- ✅ **Passive vs. Active Scanning**: Passive-only (aligns with Principle VIII of Constitution)
- ✅ **Browser Selection**: Chromium only (simplifies proxy configuration)
- ✅ **Traffic Generation Strategy**: All Playwright navigation flows automatically routed through ZAP; one dedicated test (`zap-passive-scan.spec.ts`) queries ZAP REST API
- ✅ **CI Failure Criteria**: Build fails on any Critical or High severity ZAP alerts (per Constitution)
- ✅ **Payload Safety**: XSS/SQLi payloads defined as static `as const` arrays in `utils/security-payloads.ts`; payloads are rendering-detection only (no malicious side effects)

**Output**: No `research.md` required (all items pre-decided with strong rationale in spec/plan).

## Phase 1: Design Artifacts

### 1. Data Model

**Entity: ZAP Alert** (from ZAP REST API response)
```typescript
interface ZapAlert {
  id: number;
  pluginId: number;
  alert: string;              // e.g., "Cross Site Scripting (Reflected)"
  name: string;
  riskId: number;             // 0=Info, 1=Low, 2=Medium, 3=High, 4=Critical
  riskCode: string;           // "informational", "low", "medium", "high", "critical"
  confidence: number;         // 0-3 (0=False Positive, 3=Confirmed)
  confidenceText: string;     // "False Positive", "Low", "Medium", "High"
  description: string;
  instances: Array<{
    uri: string;
    method: string;
    evidence: string;
  }>;
  otherInfo: string;
  solution: string;
  reference: string;
  cweid?: string;
  wascid?: string;
}

// Test helper to parse and validate
function parseZapAlerts(jsonResponse: object): ZapAlert[] {
  const { alerts } = jsonResponse as { alerts: ZapAlert[] };
  return alerts;
}

function hasHigherOrCriticalAlerts(alerts: ZapAlert[]): boolean {
  return alerts.some(a => a.riskId >= 3); // High (3) or Critical (4)
}
```

**Entity: Security Payload**
```typescript
// Defined in utils/security-payloads.ts
export const XSS_PAYLOADS = [
  '<script>alert(1)</script>',
  '<img src=x onerror=alert(1)>',
  '<svg/onload=alert(1)>',
] as const;

export const SQLI_PAYLOADS = [
  "' OR '1'='1",
  "'; DROP TABLE users; --",
  "1' UNION SELECT NULL--",
] as const;

type XSSPayload = typeof XSS_PAYLOADS[number];
type SQLiPayload = typeof SQLI_PAYLOADS[number];
```

**Entity: Session Cookie Contract** (from Playwright `context.cookies()`)
```typescript
interface SessionCookie {
  name: string;          // Session token name (e.g., "sessionId")
  value: string;         // Token value
  domain: string;
  path: string;
  expires?: number;      // UNIX timestamp or undefined
  httpOnly: boolean;     // MUST be true (A02 control)
  secure: boolean;       // MUST be true for HTTPS (A02 control)
  sameSite?: 'Strict' | 'Lax' | 'None'; // MUST NOT be 'None' (A02 control)
}

// Validation: Assert on auth state
function validateSessionCookie(cookie: SessionCookie): void {
  expect(cookie.httpOnly).toBe(true);
  expect(cookie.secure).toBe(true);
  expect(cookie.sameSite).not.toBe('None');
}
```

### 2. Contracts (Interface Specifications)

#### Contract 1: `contracts/zap-alert-contract.md` — ZAP REST API Response Format

```markdown
# ZAP Alert REST API Contract

## Endpoint
`GET http://localhost:8080/JSON/core/view/alerts/?zapapiformat=JSON`

## Response Format
```json
{
  "alerts": [
    {
      "id": 1,
      "pluginId": 6,
      "alert": "Cross Site Scripting (Reflected)",
      "name": "Cross Site Scripting (Reflected)",
      "riskId": 3,
      "riskCode": "high",
      "confidence": 3,
      "confidenceText": "High",
      "description": "Cross-site Scripting (XSS)...",
      "instances": [
        {
          "uri": "https://www.saucedemo.com/login",
          "method": "POST",
          "evidence": "<script>alert(1)</script>"
        }
      ],
      "otherInfo": "...",
      "solution": "Encode user input...",
      "reference": "https://owasp.org/www-community/attacks/xss/"
    }
  ]
}
```

## Failure on Critical/High
Test MUST fail if any alert has `riskCode` = "critical" or "high"
```

#### Contract 2: `contracts/session-cookie-contract.md` — Session Cookie Security

```markdown
# Session Cookie Security Contract

POST /api/login → Set-Cookie response MUST include:
- `httpOnly=true` (prevents XSS cookie theft)
- `Secure=true` (HTTPS only)
- `SameSite=Strict|Lax` (prevents CSRF; NOT 'None')

GET /logout → Set-Cookie response MUST include:
- Clear cookie: `Set-Cookie: sessionId=; Max-Age=0`
```

#### Contract 3: `contracts/security-headers-contract.md` — Response Headers

```markdown
# Security Headers Contract

All responses MUST include OR exceed:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY | SAMEORIGIN` OR CSP `frame-ancestors`
- NO `Server` header revealing framework/version (e.g., `Server: Apache/2.4.1` is a violation)
```

### 3. Quickstart Guide (`quickstart.md`)

See section below for full quickstart content.

## Phase 1 Complete

✅ Data model defined (ZapAlert, Security Payload, Session Cookie entities)
✅ Contracts defined (ZAP API, session cookies, security headers)
✅ Directory structure finalized
✅ Constitution Check re-validated (PASS)
