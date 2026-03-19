# Security Response Headers Contract

## Scope

This contract defines HTTP response headers that MUST be present (or absent) to mitigate A05 (Security Misconfiguration) vulnerabilities.

## A05 Security Misconfiguration — Response Headers

### Header 1: X-Content-Type-Options

**Standard**: OWASP, SANS Top 25
**Purpose**: Prevents MIME-sniffing attacks
**Valid Values**:
- `nosniff` — ONLY accept declared MIME type (recommended)

**Threat Mitigated**: Attackers upload HTML/JS as PDF → browser sniffs and executes as script

```typescript
// MUST assert
header['x-content-type-options'] === 'nosniff'

// Test example
test('X-Content-Type-Options header is nosniff', async ({ request }) => {
  const response = await request.get('https://www.saucedemo.com/');
  expect(response.headers()['x-content-type-options']).toBe('nosniff');
});
```

### Header 2: X-Frame-Options OR Content-Security-Policy frame-ancestors

**Standard**: RFC 7034, CSP Level 3
**Purpose**: Prevents clickjacking / UI redressing attacks
**Valid Values (X-Frame-Options)**:
- `DENY` — Page cannot be framed (most restrictive)
- `SAMEORIGIN` — Only same-origin sites can frame

**Valid Values (CSP)**:
- `frame-ancestors 'none'` (equivalent to DENY)
- `frame-ancestors 'self'` (equivalent to SAMEORIGIN)

**Threat Mitigated**: Attacker embeds page in iframe, overlays invisible button → victim clicks attacker's action

```typescript
// MUST assert (either one is sufficient)
header['x-frame-options'] !== undefined || header['content-security-policy']?.includes('frame-ancestors')

// Test example
test('X-Frame-Options or CSP frame-ancestors header present', async ({ request }) => {
  const response = await request.get('https://www.saucedemo.com/');
  const hasFrameProtection =
    response.headers()['x-frame-options'] ||
    response.headers()['content-security-policy']?.includes('frame-ancestors');
  expect(hasFrameProtection).toBeTruthy();
});
```

### Header 3: No Server Header Leakage

**Purpose**: Do not reveal server software/version (reduces attack surface)
**Invalid Examples**:
- `Server: Apache/2.4.41 (Ubuntu)`
- `Server: nginx/1.21.0`
- `X-Powered-By: Express/4.18.1`

**Threat Mitigated**: Attackers research known CVEs for the exposed version

```typescript
// MUST assert
header['server'] === undefined || header['server'].length === 0

// Test example
test('Server header does not reveal version information', async ({ request }) => {
  const response = await request.get('https://www.saucedemo.com/');
  const server = response.headers()['server'] || '';
  expect(server).not.toMatch(/\/\d+\.\d+/); // No version number like /2.4.41
});
```

## Optional (Defense-in-Depth)

Headers not strictly required by this contract but recommended:

### Content-Security-Policy (CSP)

**Purpose**: Whitelist sources for scripts, images, styles (XSS prevention)
**Example**: `Content-Security-Policy: default-src 'self'; script-src 'self'`

### Strict-Transport-Security (HSTS)

**Purpose**: Force HTTPS for all future requests
**Example**: `Strict-Transport-Security: max-age=31536000; includeSubDomains`

### X-Content-Security-Policy (Deprecated)

**Purpose**: Legacy CSP support (older browsers)
**Note**: Superseded by `Content-Security-Policy`; optional if CSP is present

## Test Design Pattern

```typescript
import { test, expect } from '@fixtures';

test.describe('Security Headers (A05)', () => {
  test('X-Content-Type-Options is nosniff', async ({ request }) => {
    const response = await request.get('https://www.saucedemo.com/');
    expect(response.headers()['x-content-type-options']).toBe('nosniff');
  });

  test('X-Frame-Options or CSP frame-ancestors present', async ({ request }) => {
    const response = await request.get('https://www.saucedemo.com/');
    const xframe = response.headers()['x-frame-options'];
    const csp = response.headers()['content-security-policy'];
    const hasFrameProtection = xframe || csp?.includes('frame-ancestors');
    expect(hasFrameProtection).toBeTruthy();
  });

  test('Server header does not leak version', async ({ request }) => {
    const response = await request.get('https://www.saucedemo.com/');
    const server = response.headers()['server'] || '';
    expect(server).not.toMatch(/\/\d+\.\d+/);
  });
});
```

## Implementation Notes

- **Playwright `request` fixture**: Use for API-only header validation (no browser overhead)
- **Header naming**: HTTP headers are case-insensitive; Playwright lowercases all header keys
- **Missing headers**: Absence of a header is NOT the same as presence of an empty value
- **SauceDemo expectations**: As a demo site, some security headers may be missing; failing tests document real security gaps (intentional — not a test bug)
