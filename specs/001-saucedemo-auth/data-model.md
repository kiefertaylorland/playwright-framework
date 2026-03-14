# Data Model: Authentication Flows — SauceDemo

**Feature**: 001-saucedemo-auth
**Date**: 2026-03-13

---

## Page Object Interfaces

These TypeScript interfaces define the public contract of each Page Object used
in this feature. Implementations live in `pages/`. Tests only interact through
these method signatures — no raw Locators, no selectors.

### LoginPage

```typescript
// pages/login.page.ts
interface ILoginPage {
  /** Navigate to https://www.saucedemo.com */
  goto(): Promise<void>;

  /** Fill the username field */
  fillUsername(username: string): Promise<void>;

  /** Fill the password field */
  fillPassword(password: string): Promise<void>;

  /** Click the Login button */
  submit(): Promise<void>;

  /** Fill both fields and click Login (composed action) */
  login(username: string, password: string): Promise<void>;

  /** Returns trimmed text content of the error banner */
  getErrorMessage(): Promise<string>;

  /** Returns true if the error banner is visible in the DOM */
  isErrorVisible(): Promise<boolean>;
}
```

### InventoryPage (auth-scoped methods only)

The full InventoryPage is extended in feature 002-inventory-listing.
This feature establishes the auth-relevant subset:

```typescript
// pages/inventory.page.ts
interface IInventoryPage {
  /** Navigate directly to /inventory.html */
  goto(): Promise<void>;

  /** Returns true if the current URL is /inventory.html */
  isOnInventoryPage(): Promise<boolean>;

  /** Click the hamburger (burger) menu button */
  openBurgerMenu(): Promise<void>;

  /** Click the Logout link in the sidebar (must call openBurgerMenu first,
   *  or this method opens it internally) */
  logout(): Promise<void>;
}
```

---

## Credential Types

```typescript
// utils/auth.ts
interface Credentials {
  username: string;
  password: string;
}

/** Reads SAUCE_USERNAME and SAUCE_PASSWORD from process.env.
 *  Throws a descriptive error if either is missing. */
function getSauceCredentials(): Credentials;

/** Credentials for locked-out user test (same password, different username) */
const LOCKED_OUT_USER = 'locked_out_user';

/** Invalid credentials for wrong-credentials test */
const INVALID_CREDENTIALS: Credentials = {
  username: 'invalid_user',
  password: 'wrong_password',
};
```

`LOCKED_OUT_USER` and `INVALID_CREDENTIALS` are constants, not secrets — they
are deliberately fabricated or known-public test values and do not violate
Principle V.

---

## Route Constants

```typescript
// utils/routes.ts (or inline in page objects)
const ROUTES = {
  LOGIN:     'https://www.saucedemo.com/',
  INVENTORY: 'https://www.saucedemo.com/inventory.html',
} as const;
```

---

## Selector Inventory

All selectors are owned by Page Objects. This table documents them for planning
purposes — they MUST NOT appear directly in test files.

### LoginPage selectors

| Purpose | Strategy | Value | Constitution note |
|---------|----------|-------|------------------|
| Username input | `data-test` | `[data-test="username"]` | `data-test` = SauceDemo's `data-testid` equivalent |
| Password input | `data-test` | `[data-test="password"]` | Same justification |
| Login button | `data-test` | `[data-test="login-button"]` | Same justification |
| Error banner | `data-test` | `[data-test="error"]` | Same justification |

### InventoryPage selectors (auth-scoped)

| Purpose | Strategy | Value | Constitution note |
|---------|----------|-------|------------------|
| Burger menu button | `id` | `#react-burger-menu-btn` | No `data-test`; `id` is stable fallback |
| Logout sidebar link | `id` | `#logout_sidebar_link` | No `data-test`; `id` is stable fallback |

---

## Error Message Constants

These exact strings MUST be used in test assertions (see research.md Decision 3):

```typescript
// Owned by LoginPage or a dedicated constants file
const ERROR_MESSAGES = {
  LOCKED_OUT:          'Epic sadface: Sorry, this user has been locked out.',
  INVALID_CREDENTIALS: 'Epic sadface: Username and password do not match any user in this service',
  USERNAME_REQUIRED:   'Epic sadface: Username is required',
  PASSWORD_REQUIRED:   'Epic sadface: Password is required',
} as const;
```

---

## Auth State File

```
.auth/standard-user.json   # Written by global-setup.ts; gitignored
```

Content: Playwright `StorageState` object (cookies + localStorage). Written once
per CI run in globalSetup. Read by every test that uses the default storageState.

---

## State Lifecycle (Session entity)

```
[No state]
    │
    ▼ login(username, password)
[Authenticated: /inventory.html]
    │
    ├── reload page ──► [Still Authenticated: /inventory.html]  (US4)
    │
    └── logout() ──────► [Logged Out: / (login page)]  (US3)
                              │
                              └── goto('/inventory.html') ──► [Redirected to /]  (FR-010)
```
