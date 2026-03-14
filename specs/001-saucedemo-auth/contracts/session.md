# Contract: Session — Logout and Persistence

**Pages**: Inventory page, Login page
**Page Object**: `pages/inventory.page.ts` (auth-scoped methods)
**Spec refs**: FR-007, FR-008, FR-009, FR-010

## Precondition

All tests in this contract start with an authenticated session loaded from
`.auth/standard-user.json` via `storageState` (the global default in
`playwright.config.ts`). No programmatic login is performed inside these tests.

## Logout Contract (FR-007, FR-008)

**Page Object selectors (owned by InventoryPage — do not use in test files)**:

| Element | Attribute | Value |
|---------|-----------|-------|
| Burger menu button | `id` | `react-burger-menu-btn` |
| Logout sidebar link | `id` | `logout_sidebar_link` |

**Interaction sequence**:

| Step | Action | Expected outcome |
|------|--------|-----------------|
| 1 | Click burger menu button | Sidebar slides open |
| 2 | Click Logout link | Page navigates away |
| 3 | Assert URL | `https://www.saucedemo.com/` (login page) |
| 4 | Assert login form | Username and password inputs are visible |

**InventoryPage.logout() encapsulates steps 1–2.**

## Post-logout URL Guard Contract (FR-010)

After successful logout (from the same test body, no separate test):

| Step | Action | Expected outcome |
|------|--------|-----------------|
| 1 | Call `page.goto('/inventory.html')` | SauceDemo redirects |
| 2 | Assert URL | `https://www.saucedemo.com/` (login page, not inventory) |

## Session Persistence Contract (FR-009)

**Precondition**: Authenticated session loaded; user is on `/inventory.html`.

| Step | Action | Expected outcome |
|------|--------|-----------------|
| 1 | Call `page.reload()` | Page reloads |
| 2 | Assert URL | `https://www.saucedemo.com/inventory.html` |
| 3 | Assert login form | NOT visible (user is still authenticated) |
| 4 | Assert inventory items | At least one product card is present |

**The inventory item assertion** (step 4) is a minimal presence check — the full
product grid is tested in feature 002-inventory-listing. Here it confirms the
page did not fall back to an error or empty state after reload.

## Notes

- Session state is purely cookie/localStorage based in SauceDemo (no server
  sessions). The `.auth/standard-user.json` file captures this state.
- `storageState` is injected per-test by Playwright's fixture system — the
  test itself never reads or writes the `.auth/` file.
- The post-logout guard (FR-010) MUST run in the same test as logout to avoid
  creating a separate test that relies on prior test execution order, which
  would violate Constitution Principle III.
