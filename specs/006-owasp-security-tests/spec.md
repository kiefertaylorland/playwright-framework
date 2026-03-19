# Feature Specification: OWASP Security Test Suite with ZAP Integration

**Feature Branch**: `006-owasp-security-tests`
**Created**: 2026-03-18
**Status**: Draft
**Input**: User description: "OWASP security test suite for SauceDemo covering OWASP Top 10 categories testable via Playwright browser automation and HTTP request fixture..."

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Detect Broken Access Control Vulnerabilities (Priority: P1)

QA engineers validate that unauthenticated users cannot bypass authentication to reach protected routes (inventory, cart, checkout). The application correctly redirects unauthenticated access to the login page, preventing session fixation and privilege escalation attacks.

**Why this priority**: Broken access control (A01) is the most critical OWASP vulnerability. Failing to prevent unauthenticated access to sensitive functionality is a fundamental security failure. This is foundational to all other security tests.

**Independent Test**: Access protected routes without authentication and verify redirect to login. Demonstrates core access control enforcement without requiring other security features.

**Acceptance Scenarios**:

1. **Given** an unauthenticated user, **When** they navigate to `/inventory.html`, **Then** they are redirected to login
2. **Given** an unauthenticated user, **When** they navigate to `/cart.html`, **Then** they are redirected to login
3. **Given** an unauthenticated user, **When** they navigate to `/checkout-step-one.html`, **Then** they are redirected to login

---

### User Story 2 - Validate Cookie Security Flags (Priority: P1)

QA engineers verify that session cookies have secure security attributes (httpOnly, secure, sameSite) to prevent XSS-based cookie theft and CSRF attacks. Absence of these flags indicates cryptographic/session management failures (A02).

**Why this priority**: Cookie security flags prevent entire classes of attacks (XSS token theft, CSRF). This is fundamental to secure session management. Must be verified after successful authentication.

**Independent Test**: Authenticate user, inspect session cookies, assert all security flags are present. Demonstrates proper session configuration independent of application features.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** the test inspects the session cookie, **Then** `httpOnly` flag is set to `true`
2. **Given** an authenticated user, **When** the test inspects the session cookie, **Then** `secure` flag is set to `true`
3. **Given** an authenticated user, **When** the test inspects the session cookie, **Then** `sameSite` is NOT set to `'None'`

---

### User Story 3 - Detect XSS Injection Vulnerabilities (Priority: P1)

QA engineers inject XSS payloads into form fields (login username, checkout fields) and verify the application HTML-escapes output, preventing script execution. Unescaped payloads indicate A03 Injection vulnerabilities.

**Why this priority**: XSS (A03) is a top vulnerability in web applications. Demonstrating that payloads are escaped prevents attackers from injecting malicious scripts. This is a critical input validation test.

**Independent Test**: Submit XSS payloads to login and checkout forms, verify payloads appear escaped in DOM (not executed as script). Does not require successful authentication flow.

**Acceptance Scenarios**:

1. **Given** a login form, **When** an XSS payload `<script>alert(1)</script>` is submitted in the username field, **Then** the payload appears escaped in the DOM (e.g., as `&lt;script&gt;`) and no script is executed
2. **Given** a checkout form, **When** an XSS payload `<img src=x onerror=alert(1)>` is submitted in a field, **Then** the payload appears escaped in the DOM and no script executes
3. **Given** a login form, **When** XSS payloads are submitted, **Then** the server response is HTTP 200 (not 500), indicating the payload is handled safely

---

### User Story 4 - Detect SQLi Injection Vulnerabilities (Priority: P1)

QA engineers inject SQL injection payloads into form fields and verify the application does not execute SQL, returning safe error messages or form validation errors instead of database errors. Unhandled payloads indicate A03 Injection vulnerabilities.

**Why this priority**: SQLi (A03) is a critical injection attack. Testing that payloads do not escape the query builder and return safe responses demonstrates input parameterization. Equal priority with XSS.

**Independent Test**: Submit SQLi payloads to login form (e.g., `' OR '1'='1`), verify response is not a database error and no unauthorized access occurs.

**Acceptance Scenarios**:

1. **Given** a login form, **When** a SQLi payload `' OR '1'='1` is submitted in the username field, **Then** the server response is HTTP 200 or form validation error, not HTTP 500 with database error
2. **Given** a login form, **When** a SQLi payload `'; DROP TABLE users; --` is submitted, **Then** the database remains intact and the server responds safely
3. **Given** a checkout form, **When** SQLi payloads are submitted in any field, **Then** the application does not attempt to execute SQL or return database errors

---

### User Story 5 - Validate Security Response Headers (Priority: P2)

QA engineers verify that the application returns security-related HTTP response headers (X-Content-Type-Options, X-Frame-Options, Content-Security-Policy) to prevent MIME-sniffing, clickjacking, and other A05 Security Misconfiguration issues.

**Why this priority**: Response headers provide defense-in-depth against misconfiguration (A05). While not as critical as access control or injection, they are standard security hygiene. Testable via HTTP requests without UI interaction.

**Independent Test**: Make HTTP requests to the application and inspect response headers. Does not require authentication or browser navigation.

**Acceptance Scenarios**:

1. **Given** an HTTP request to the application, **When** the response is returned, **Then** the `X-Content-Type-Options` header is set to `nosniff`
2. **Given** an HTTP request to the application, **When** the response is returned, **Then** the `X-Frame-Options` header is present (e.g., `DENY` or `SAMEORIGIN`) OR a CSP `frame-ancestors` directive is set
3. **Given** an HTTP request to the application, **When** the response is returned, **Then** no `Server` header reveals framework/version information

---

### User Story 6 - Enforce Session Lockout on Failed Attempts (Priority: P2)

QA engineers verify that failed login attempts trigger account lockout, preventing brute-force attacks (A07 Identification & Authentication Failures). After lockout, even correct credentials are rejected until lockout expires.

**Why this priority**: Brute-force prevention (A07) is important for account security. Testable via standard login flow with a pre-configured locked-out user account.

**Independent Test**: Attempt login with locked-out user credentials, verify rejection and appropriate error message.

**Acceptance Scenarios**:

1. **Given** a locked-out user account, **When** login is attempted with correct credentials, **Then** login fails and an account lockout message is displayed
2. **Given** a locked-out user account, **When** login is attempted, **Then** the server does not return a user enumeration hint (e.g., "account locked" vs. "invalid credentials")

---

### User Story 7 - Invalidate Session on Logout (Priority: P2)

QA engineers verify that after logout, the session cookie is cleared or invalidated, preventing session fixation attacks (A07). Subsequent requests with the old session token should not authenticate the user.

**Why this priority**: Session invalidation (A07) prevents session reuse after logout. Essential for user privacy. Testable via logout flow and subsequent navigation attempts.

**Independent Test**: Logout authenticated user, verify session cookie is cleared, verify subsequent requests to protected routes are denied.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** they click logout, **Then** the session cookie is cleared (removed or set to empty value)
2. **Given** a logged-out user, **When** they navigate to a protected route, **Then** they are redirected to login

---

### User Story 8 - Perform ZAP Passive Scanning and Report Findings (Priority: P2)

QA engineers run the security test suite with OWASP ZAP operating as a transparent proxy. All Playwright traffic is intercepted and passively scanned. After tests complete, the test suite queries ZAP's REST API to retrieve alerts and fails the build if any Critical or High severity findings are present.

**Why this priority**: Automated passive scanning (via ZAP) provides broad coverage of security misconfiguration and data exposure issues. However, it depends on test execution to generate traffic, so it is secondary to individual security tests.

**Independent Test**: Execute full test suite with ZAP proxy enabled, query ZAP API, assert no Critical/High alerts.

**Acceptance Scenarios**:

1. **Given** OWASP ZAP is running as a Docker container on port 8080, **When** Playwright tests navigate protected routes, **Then** all traffic is intercepted by ZAP
2. **Given** tests have executed and ZAP has passively scanned traffic, **When** the test suite queries the ZAP REST API, **Then** a JSON list of alerts is returned
3. **Given** ZAP findings are retrieved, **When** any alert with severity Critical or High is present, **Then** the test suite fails with a descriptive error message

### Edge Cases

- What happens if ZAP is not running or becomes unreachable during test execution?
- How does the application respond to payloads containing special URL-encoded characters (e.g., `%3Cscript%3E`)?
- What happens if an authenticated session expires mid-test while ZAP is scanning?
- How are lockout timers handled if the test suite runs faster than the lockout period?
- What is the behavior if the ZAP API returns a timeout or network error when querying alerts?

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: Test suite MUST detect unauthenticated access to protected routes and assert redirects to login
- **FR-002**: Test suite MUST verify session cookies have `httpOnly=true`, `secure=true`, and `sameSite !== 'None'`
- **FR-003**: Test suite MUST inject XSS payloads into form fields and assert payloads are HTML-escaped in the DOM
- **FR-004**: Test suite MUST inject SQLi payloads into form fields and assert the application handles them safely without database errors
- **FR-005**: Test suite MUST validate presence of security response headers (`X-Content-Type-Options`, `X-Frame-Options` or CSP `frame-ancestors`, no server version leak)
- **FR-006**: Test suite MUST verify account lockout prevents login with correct credentials (via `locked_out_user` fixture)
- **FR-007**: Test suite MUST verify session cookies are cleared after logout and protected routes deny access
- **FR-008**: Test suite MUST route all Playwright browser traffic through OWASP ZAP running as a Docker-based proxy on port 8080
- **FR-009**: Test suite MUST query ZAP REST API to retrieve passive scan findings after tests complete
- **FR-010**: Test suite MUST fail CI/build if ZAP reports any Critical or High severity alerts
- **FR-011**: A new `security` Playwright project MUST be added to `playwright.config.ts` with Chromium browser and ZAP proxy configuration
- **FR-012**: Tests in the security project MUST skip ZAP-related assertions if `ZAP_PROXY_SKIP=1` environment variable is set (to allow local testing without Docker)
- **FR-013**: All security test files MUST use page object models from `pages/` directory (e.g., `LoginPage`, `InventoryPage`, `CheckoutPage`)
- **FR-014**: All security payloads (XSS, SQLi) MUST be defined in `utils/security-payloads.ts` as typed `as const` arrays, not hardcoded in tests

### Key Entities

- **Security Test Suite**: A collection of Playwright test files in `tests/security/` covering OWASP A01-A07 vulnerabilities
- **OWASP ZAP Proxy**: Docker-based transparent proxy scanning traffic passively; configured via `docker-compose.zap.yml`
- **ZAP Alert**: A security finding returned by ZAP REST API with severity (Informational, Low, Medium, High, Critical) and confidence levels
- **Security Payload**: XSS or SQLi injection string used to test input validation (defined in `utils/security-payloads.ts`)
- **Session Cookie**: HTTP-only secure cookie storing user session state; validated for security flags

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: Test suite executes against SauceDemo with all 6 security test files running independently without race conditions or flakiness
- **SC-002**: ZAP passive scan captures traffic from at least 5 distinct user flows (login, inventory, cart, checkout steps 1 & 2)
- **SC-003**: Test suite CI job completes within 5 minutes on GitHub Actions (including Docker startup, Playwright execution, ZAP queries, and shutdown)
- **SC-004**: All documented OWASP A01-A07 test scenarios execute without timeouts or proxy-related failures
- **SC-005**: ZAP alerts are retrieved and parsed without REST API errors, and failing tests clearly identify severity and description of findings
- **SC-006**: Security tests maintain independence from the existing 116-test baseline; all baseline tests continue to pass after security suite is added
- **SC-007**: All security test code adheres to project conventions (imports from `@fixtures`, uses page objects, no direct `@playwright/test` imports)
- **SC-008**: Documentation in `specs/006-owasp-security-tests/` is clear enough for new developers to run security tests locally (with and without ZAP)

## Assumptions

- **OWASP ZAP availability**: ZAP Docker image is available and running on the same host as the test runner
- **SauceDemo maturity**: SauceDemo application is production-like enough to test basic security controls; some tests may fail if the demo site is intentionally vulnerable
- **Payload safety**: XSS/SQLi payloads do not cause unintended harm (e.g., data loss); payloads are limited to rendering detection, not executing malicious actions
- **Single-browser testing**: Security project runs Chromium only to simplify ZAP proxy configuration; other browsers can test the same logic if proxy support is added later
- **Passive-only scanning**: Active ZAP scanning is out of scope to avoid overwhelming a third-party demo site; passive scanning is sufficient for OWASP coverage
- **CI environment**: GitHub Actions runner has Docker support enabled and sufficient disk space for ZAP image (~1-2 GB)
