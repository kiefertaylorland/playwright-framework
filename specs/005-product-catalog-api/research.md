# Research: Product Catalog API

**Feature**: 005-product-catalog-api
**Date**: 2026-03-13
**Status**: Complete — all NEEDS CLARIFICATION resolved

---

## Decision 1: Playwright `request` fixture vs. dedicated HTTP client

**Decision**: Use Playwright's built-in `request` fixture exclusively.

**Rationale**: The `request` fixture is already available on every `test` invocation
from `@playwright/test`. It requires no extra dependencies, integrates with Allure
tracing automatically, and is scoped per-test — each test gets a fresh
`APIRequestContext` with no shared state. This satisfies Constitution Principles VI
(parallel-safe) and VIII (API test purity) without configuration.

**Alternatives considered**:
- `axios` / `node-fetch`: Extra dependency, no Playwright tracing integration.
- `got`: Same drawbacks. Both were rejected because the project already has
  everything needed through `@playwright/test`.

---

## Decision 2: Response shape validation strategy

**Decision**: Use plain TypeScript interfaces as the expected shape type, then
assert individual fields using `expect()` matchers rather than schema validation
libraries (Zod, Ajv).

**Rationale**: The spec calls for contract checks (field presence + correct type),
not full JSON-Schema validation. Inline `expect(product).toHaveProperty('id')`
plus `expect(typeof product.price).toBe('number')` is readable, produces clear
failure messages, and requires zero extra dependencies. If the contract grows to
20+ fields, migrating to Zod is straightforward.

**Alternatives considered**:
- `zod`: Excellent, but overkill for 8 test scenarios. Adds a dependency and a
  parsing layer not needed here.
- `ajv`: JSON-Schema validation; too verbose for the field count. Rejected.

---

## Decision 3: Token extraction and chaining (US3 → US4)

**Decision**: US4's bearer-token test obtains a fresh token by calling
`POST /auth/login` within the same test function. It does not share a token
with US3.

**Rationale**: Constitution Principle III (test isolation) forbids shared mutable
state between tests. A token obtained by US3 cannot be passed to US4 via shared
state. Re-authenticating inside US4 costs one extra HTTP call (< 200ms) and keeps
the test fully self-contained and parallel-safe.

**Alternatives considered**:
- `beforeAll` + module-level token variable: Violates Principle III — shared state
  across tests. Rejected.
- Test fixture providing a scoped token: Viable for a larger suite but adds fixture
  complexity for a single dependent test. Deferred to future fixture expansion.

---

## Decision 4: Valid UUID source for product detail test (US2)

**Decision**: Dynamic extraction — call `GET /products`, take `data[0].id` from
the response, then use it in `GET /products/{id}`.

**Rationale**: Hard-coding a UUID ties the test to a specific product that could
be deleted from the API. Dynamic extraction is more resilient and was explicitly
specified in the spec's Assumptions section.

**Implementation note**: Both calls occur within the same test body. The first
call asserts the list (US1 acceptance scenario 1), then the extracted UUID drives
the detail call. This means US1 and US2 share one test file but are structured
as separate `test()` blocks per story.

---

## Decision 5: Invalid UUID constant

**Decision**: Use `'00000000-0000-0000-0000-000000000000'` (nil UUID) as the
known-invalid identifier.

**Rationale**: The spec requires a well-formed UUID that does not correspond to
any product. The nil UUID is a universally recognised "empty" UUID and is
guaranteed never to be a real product ID. It clearly signals test intent in code.

**Alternatives considered**:
- `'invalid-uuid-string'`: Ambiguous — API might return 422 (malformed) instead
  of 404. Rejected to isolate "not found" from "bad format".
- Random UUID: Probabilistically safe but indeterminate. Nil UUID is deterministic.

---

## Decision 6: Assertion precision for numeric `price` field

**Decision**: Assert `typeof product.price === 'number'` (type check only). Do
not assert specific price values.

**Rationale**: The spec explicitly states "Response field type assertions, not value
checks. Specific product names or prices are not asserted." Price values can change
between test runs on a live public API. Type + presence assertions are resilient;
value assertions would produce spurious failures.

---

## Decision 7: Environment variable names

**Decision**: Use the following env var names for credentials:

| Variable | Purpose |
|----------|---------|
| `PST_API_URL` | Base URL (`https://api.practicesoftwaretesting.com`) |
| `PST_API_USERNAME` | Login email (`customer@practicesoftwaretesting.com`) |
| `PST_API_PASSWORD` | Login password (`welcome01`) |

**Rationale**: `PST_` prefix namespaces these variables to Practice Software Testing
and avoids collision with SauceDemo variables (which use `SAUCE_` or similar). The
base URL is also an env var so the suite can target staging environments without
code changes.

**Constitution compliance**: Per Principle V, these values MUST NOT appear in any
committed source file. They are injected via `.env` (gitignored) locally and via
GitHub Actions secrets in CI.
