# Implementation Plan: Product Catalog API

**Branch**: `005-product-catalog-api` | **Date**: 2026-03-13 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/005-product-catalog-api/spec.md`

## Summary

Implement API test coverage for the Practice Software Testing catalogue API
(`https://api.practicesoftwaretesting.com`). The suite covers 4 public endpoints
across 8 test scenarios: product list (paginated shape + field contract), product
detail (valid UUID success + nil UUID 404), authentication (valid credentials →
token; invalid credentials → rejection), and categories (non-empty array) plus
bearer token compatibility on the product list endpoint.

All tests live under `tests/api/`, use Playwright's `request` fixture exclusively,
and launch no browser — satisfying Constitution Principles VI (parallel-safe) and
VIII (API test purity).

## Technical Context

**Language/Version**: TypeScript 5.x, `strict: true`, `noImplicitAny: true`
**Primary Dependencies**: `@playwright/test` (request fixture), `allure-playwright`,
  `eslint`, `@typescript-eslint/eslint-plugin`
**Storage**: N/A — stateless HTTP tests; no persistence layer
**Testing**: `@playwright/test` native runner, `request` fixture, no browser
**Target Platform**: Public REST API — `https://api.practicesoftwaretesting.com`
**Project Type**: API test suite (headless, no browser)
**Performance Goals**: All 8 tests complete in < 30 seconds total on CI
**Constraints**: No browser launch; credentials via env vars; parallel execution
  at `--workers=4`; no hard-coded UUIDs for product IDs
**Scale/Scope**: 8 test scenarios, 3 test files, 4 contract documents

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Strict TypeScript | ✅ Pass | `strict: true` in tsconfig; no `any` in test files or type helpers |
| II. Page Object Model | ✅ Exempt | API tests; no UI interaction; no pages/ involvement |
| III. Test Isolation | ✅ Pass | Each `test()` block is self-contained; token for US4 obtained within its own test body |
| IV. Selector Hierarchy | ✅ Exempt | API tests; no DOM selectors |
| V. Secrets Management | ✅ Pass | `PST_API_URL`, `PST_API_USERNAME`, `PST_API_PASSWORD` sourced from env vars only |
| VI. Parallel-Safe Design | ✅ Pass | Stateless HTTP requests; no shared accounts or browser state |
| VII. Fixture Imports | ✅ Pass | `test` and `expect` imported from `@fixtures` path alias |
| VIII. API Test Purity | ✅ Pass | `request` fixture only; no `page`, `browser`, or `context` |

**All gates pass. No violations.**

## Project Structure

### Documentation (this feature)

```text
specs/005-product-catalog-api/
├── plan.md              # This file
├── research.md          # Phase 0 — 7 architectural decisions
├── data-model.md        # Phase 1 — TypeScript interfaces + assertion strategy
├── quickstart.md        # Phase 1 — setup and run guide
├── contracts/
│   ├── products-list.md     # GET /products contract
│   ├── product-detail.md    # GET /products/{id} contract
│   ├── auth-login.md        # POST /auth/login contract
│   └── categories-list.md   # GET /categories contract
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
tests/
└── api/
    ├── products.spec.ts     # US1 (list shape) + US2 (detail valid/404)
    ├── auth.spec.ts         # US3 (login success/failure)
    └── categories.spec.ts   # US4 (categories list + bearer token compat)

utils/
└── api-types.ts             # TypeScript interfaces: Product, PaginatedResponse,
                             #   AuthRequest, AuthResponse, Category, etc.

fixtures/
└── index.ts                 # Extends @playwright/test; exports { test, expect }
                             # API tests use the request fixture via this export

.env                         # gitignored; PST_API_URL, PST_API_USERNAME, PST_API_PASSWORD
```

**Structure Decision**: Single-project layout at repository root. API tests are
isolated under `tests/api/` per the CLAUDE.md architecture plan. No additional
`src/` or `lib/` directories are needed — this feature has no implementation code,
only test code and type declarations.

## Complexity Tracking

> No Constitution Check violations. This section intentionally empty.

---

## Phase 0: Research Summary

All 7 architectural decisions are documented in [research.md](research.md).
No NEEDS CLARIFICATION items remain.

Key decisions:
1. **Playwright `request` fixture** — no extra HTTP library dependency
2. **Inline field assertions** — `expect().toHaveProperty()` + `typeof` checks
3. **Token isolation** — US4 re-authenticates within its own test body
4. **Dynamic UUID extraction** — `GET /products → data[0].id` for detail test
5. **Nil UUID** — `00000000-0000-0000-0000-000000000000` for 404 test
6. **Type-only price assertion** — `typeof === 'number'`, no value check
7. **`PST_` env var prefix** — avoids collision with SauceDemo vars

## Phase 1: Design Summary

Artifacts generated:
- **[data-model.md](data-model.md)**: TypeScript interfaces for `Product`,
  `PaginatedResponse<T>`, `Category`, `AuthRequest`, `AuthResponse`, UUID pattern,
  nil UUID constant, and assertion strategy table.
- **[contracts/](contracts/)**: 4 contract documents — one per endpoint — specifying
  request shape, success/error response, and per-field assertion rules.
- **[quickstart.md](quickstart.md)**: Setup guide covering env vars, run commands,
  expected output, Allure reporting, lint/typecheck gates, and constitution
  compliance verification.

## Post-Phase 1 Constitution Re-check

All 8 principles continue to pass after design. No new concerns introduced:
- `utils/api-types.ts` is TypeScript-only with no `any`
- No UI or selector code was introduced
- All credentials remain in env vars
- `fixtures/index.ts` remains the sole import source for `test` and `expect`
