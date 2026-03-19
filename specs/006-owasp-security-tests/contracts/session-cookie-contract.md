# Session Cookie Security Contract

## Scope

This contract defines the security requirements for session cookies set by the SauceDemo application and tested via Playwright's `context.cookies()` API.

## A02 Cryptographic Failures — Cookie Security Flags

### Requirement 1: HttpOnly Flag

**Standard**: RFC 6265
**Control**: Prevents JavaScript from accessing cookie via `document.cookie`
**Threat Mitigated**: XSS-based cookie theft (A03)

```typescript
// MUST assert
cookie.httpOnly === true

// Test example
test('session cookie has httpOnly flag', async ({ page }) => {
  await loginPage.login('standard_user', 'secret_sauce');
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find(c => c.name === 'session-id');
  expect(sessionCookie?.httpOnly).toBe(true);
});
```

### Requirement 2: Secure Flag

**Standard**: RFC 6265
**Control**: Cookie only sent over HTTPS; blocks transmission on unencrypted HTTP
**Threat Mitigated**: Man-in-the-middle (MITM) interception

```typescript
// MUST assert
cookie.secure === true

// Test example
test('session cookie has secure flag', async ({ page }) => {
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find(c => c.name === 'session-id');
  expect(sessionCookie?.secure).toBe(true);
});
```

### Requirement 3: SameSite Attribute

**Standard**: RFC 6265bis
**Control**: Restricts cookie transmission in cross-site requests
**Valid Values**: `Strict`, `Lax`, or `undefined` (browser default)
**Invalid Value**: `None` (requires Secure flag, used only for third-party embeds)
**Threat Mitigated**: Cross-Site Request Forgery (CSRF, A01)

```typescript
// MUST assert
cookie.sameSite !== 'None'  // Strict or Lax is acceptable

// Test example
test('session cookie SameSite is not None', async ({ page }) => {
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find(c => c.name === 'session-id');
  expect(sessionCookie?.sameSite).not.toBe('None');
});
```

## A07 Authentication — Session Invalidation on Logout

### Requirement 4: Cookie Cleared After Logout

**Control**: Session cookie is removed or expired after logout
**Threat Mitigated**: Session fixation (A07), session reuse post-logout

```typescript
// MUST assert
// After logout, the session cookie is removed (value is empty or expires)
// OR its value changes to prevent reuse

test('session cookie cleared after logout', async ({ page }) => {
  // Login
  await loginPage.login('standard_user', 'secret_sauce');
  let cookies = await page.context().cookies();
  const sessionBefore = cookies.find(c => c.name === 'session-id');
  expect(sessionBefore?.value).toBeTruthy();

  // Logout
  await inventoryPage.logout();

  // Verify cookie is cleared
  cookies = await page.context().cookies();
  const sessionAfter = cookies.find(c => c.name === 'session-id');
  expect(sessionAfter?.value).toBeFalsy();  // Empty or removed
});
```

### Requirement 5: Session Revocation Prevents Access

**Control**: Using a cleared/expired session cookie to access protected routes is rejected
**Threat Mitigated**: Session reuse post-logout

```typescript
// MUST assert
// After logout, navigation to protected routes is redirected to login

test('logged-out user cannot access protected routes', async ({ page }) => {
  // Login
  await loginPage.login('standard_user', 'secret_sauce');

  // Logout
  await inventoryPage.logout();

  // Verify protected route redirects to login
  await page.goto('/inventory.html', { waitUntil: 'load' });
  expect(page.url()).toContain('/login');
});
```

## Cookie Naming Convention

Common session cookie names:
- `session-id` (generic)
- `JSESSIONID` (Java)
- `PHPSESSID` (PHP)
- `sessionId` (custom)
- `auth_token` (custom token-based)

Tests MUST identify the actual session cookie name by filtering cookies after login (typically the longest-lived, non-expiring cookie or one with a recognizable session pattern).

## Expected Response Headers

Typical Set-Cookie header for login response:

```
Set-Cookie: session-id=abc123def456; Path=/; Domain=.saucedemo.com; HttpOnly; Secure; SameSite=Lax; Max-Age=3600
```

On logout, the header becomes:

```
Set-Cookie: session-id=; Path=/; Domain=.saucedemo.com; HttpOnly; Secure; SameSite=Lax; Max-Age=0
```

(Max-Age=0 or Expires in the past = immediate expiration)
