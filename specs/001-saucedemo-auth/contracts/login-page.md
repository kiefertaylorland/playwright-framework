# Contract: Login Page — UI Interactions

**Page**: `https://www.saucedemo.com/`
**Page Object**: `pages/login.page.ts`
**Spec refs**: FR-001, FR-002, FR-003, FR-004, FR-005, FR-006

## Selectors (owned by LoginPage — do not use in test files)

| Element | Attribute | Value |
|---------|-----------|-------|
| Username input | `data-test` | `username` |
| Password input | `data-test` | `password` |
| Login button | `data-test` | `login-button` |
| Error message banner | `data-test` | `error` |

## Happy Path Contract (FR-001, FR-002)

**Precondition**: User is on `https://www.saucedemo.com/`

| Step | Action | Expected outcome |
|------|--------|-----------------|
| 1 | Fill username with valid non-locked account | Field contains entered value |
| 2 | Fill password | Field contains entered value (masked) |
| 3 | Click login button | Page navigates to `/inventory.html` |
| 4 | Assert URL | `https://www.saucedemo.com/inventory.html` |

**Error banner**: MUST NOT be visible after successful login.

## Error State Contracts

### Locked-out user (FR-003)

| Condition | Expected result |
|-----------|----------------|
| Username = `locked_out_user` | Error banner visible |
| Password = `secret_sauce` | Stays on login page (`/`) |
| Error text | `Epic sadface: Sorry, this user has been locked out.` |

### Invalid credentials (FR-004)

| Condition | Expected result |
|-----------|----------------|
| Username = any non-existent value | Error banner visible |
| Password = any value | Stays on login page |
| Error text | `Epic sadface: Username and password do not match any user in this service` |

### Empty username (FR-005)

| Condition | Expected result |
|-----------|----------------|
| Username field = empty | Error banner visible |
| Password = any value | Form NOT submitted (no navigation) |
| Error text | `Epic sadface: Username is required` |

### Empty password (FR-006)

| Condition | Expected result |
|-----------|----------------|
| Username = any non-empty value | Error banner visible |
| Password field = empty | Form NOT submitted (no navigation) |
| Error text | `Epic sadface: Password is required` |

## Notes

- The error banner is a single element; it shows one error at a time.
- When username is empty, the empty-username error takes precedence over
  the empty-password error even if both fields are empty.
- After an error, the login page URL remains `https://www.saucedemo.com/`
  (no redirect, no query params).
