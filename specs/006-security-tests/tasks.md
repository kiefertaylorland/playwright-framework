# Tasks: Security Tests

**Input**: Design documents from `/specs/006-security-tests/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: This feature explicitly requires automated security validation. Write tests first, confirm they fail for missing implementation/reporting, then implement.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no direct dependency)
- **[Story]**: User story label (`US1`, `US2`, `US3`, `US4`)
- Every task includes an exact file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add security project wiring, directories, and run commands.

- [x] T001 Update `playwright.config.ts` with a dedicated `security` project matching `tests/security/**/*.spec.ts` and excluding `tests/security/**` from browser/API projects
- [x] T002 Add security scripts to `package.json` (`test:security`, `security:secrets`, `security:audit`, `security:discovery`) using Node.js TypeScript type stripping for `scripts/*.ts`, and include `scripts/**/*.ts` in `tsconfig.json`
- [x] T003 [P] Create security source directories/files: `tests/security/security-report.spec.ts`, `tests/security/saucedemo-security.spec.ts`, `tests/security/pst-api-security.spec.ts`, `utils/security-report.ts`, `utils/security-targets.ts`, `scripts/security-secret-scan.ts`, and `scripts/security-npm-audit.ts`
- [x] T004 [P] Confirm generated report path remains gitignored via existing `reports/` entry in `.gitignore`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build typed Discovery Mode primitives used by all stories.

**CRITICAL**: No user-story work starts before this phase is complete.

- [x] T005 Define strict TypeScript security domain types in `utils/security-report.ts` (`SecuritySeverity`, `SecurityMode`, `SecurityTarget`, `SecurityCheck`, `SecurityFinding`, `SecurityRun`)
- [x] T006 Implement redaction helpers and Markdown escaping in `utils/security-report.ts`
- [x] T007 Implement Markdown report writer/overwriter in `utils/security-report.ts` for `reports/security/security-summary.md`
- [x] T008 Implement target configuration, safe payload constants, OWASP category constants, and SauceDemo/PST defaults in `utils/security-targets.ts`
- [x] T009 Validate fixture import discipline for `tests/security/*.spec.ts` (`test`/`expect` from `@fixtures`, no direct `@playwright/test`)

**Checkpoint**: Security report model and target config are available for every story.

---

## Phase 3: User Story 1 - Security Posture Report (Priority: P1) MVP

**Goal**: A user can run the security project and receive an overwritten Markdown report with Discovery Mode policy, target summary, finding details, skipped coverage, and graduation path.

**Independent Test**: Run `npx playwright test --project=security tests/security/security-report.spec.ts` and verify `reports/security/security-summary.md` is generated with required sections.

### Tests for User Story 1

- [x] T010 [P] [US1] Add report-generation test in `tests/security/security-report.spec.ts` that writes sample findings and verifies `reports/security/security-summary.md` contains timestamp, Discovery Mode, non-gating policy, severity, OWASP mapping, skipped coverage, and graduation path
- [x] T011 [P] [US1] Add redaction test in `tests/security/security-report.spec.ts` that verifies passwords, bearer tokens, and session-like values are not written to `reports/security/security-summary.md`

### Implementation for User Story 1

- [x] T012 [US1] Implement report run initialization, finding aggregation, severity/status summaries, and report overwrite behavior in `utils/security-report.ts`
- [x] T013 [US1] Implement test annotation helper in `utils/security-report.ts` so findings can be attached to Playwright test metadata without failing tests
- [x] T014 [US1] Add Discovery Mode target summary generation in `utils/security-targets.ts` for SauceDemo, Practice Software Testing, and repository targets

**Checkpoint**: US1 independently produces a credible Markdown report.

---

## Phase 4: User Story 2 - SauceDemo Runtime Security Checks (Priority: P2)

**Goal**: SauceDemo authentication/session and harmless login/checkout payload behavior are observed and reported without destructive actions.

**Independent Test**: Run `npx playwright test --project=security tests/security/saucedemo-security.spec.ts` and verify report findings are produced without failing on security observations.

### Tests for User Story 2

- [x] T015 [P] [US2] Add SauceDemo auth/session observation test in `tests/security/saucedemo-security.spec.ts` using public defaults and `LoginPage`/`InventoryPage`
- [x] T016 [P] [US2] Add SauceDemo login payload observation test in `tests/security/saucedemo-security.spec.ts` for harmless XSS-like, SQLi-like, and long-string payloads
- [x] T017 [US2] Add SauceDemo checkout payload observation test in `tests/security/saucedemo-security.spec.ts` that reaches checkout step one, submits harmless payloads, records behavior, and does not finish checkout

### Implementation for User Story 2

- [x] T018 [US2] Add public SauceDemo credential fallback helper in `utils/security-targets.ts` without changing secret-based `utils/auth.ts` behavior
- [x] T019 [US2] Extend `pages/login.page.ts` with page-object-owned read helpers needed for payload reflection/navigation observations
- [x] T020 [US2] Extend `pages/checkout.page.ts` with page-object-owned read helpers needed for checkout payload reflection/navigation observations
- [x] T021 [US2] Implement SauceDemo finding creation and annotation flow in `tests/security/saucedemo-security.spec.ts`

**Checkpoint**: US2 independently records SauceDemo runtime security observations.

---

## Phase 5: User Story 3 - Practice Software Testing API Security Checks (Priority: P3)

**Goal**: Practice Software Testing public, optional authenticated, unauthenticated access-control, and conservative rate-limit observations are recorded safely.

**Independent Test**: Run `npx playwright test --project=security tests/security/pst-api-security.spec.ts` with and without PST credentials and verify missing credentials become informational skipped coverage.

### Tests for User Story 3

- [x] T022 [P] [US3] Add PST public input/query payload observation test in `tests/security/pst-api-security.spec.ts`
- [x] T023 [P] [US3] Add PST unauthenticated protected-resource access observation test in `tests/security/pst-api-security.spec.ts`
- [x] T024 [US3] Add PST optional authenticated checks in `tests/security/pst-api-security.spec.ts` that skip/report when `PST_API_USERNAME` or `PST_API_PASSWORD` is missing
- [x] T025 [US3] Add PST conservative repeated-request observation test in `tests/security/pst-api-security.spec.ts` capped at 10 requests per selected surface

### Implementation for User Story 3

- [x] T026 [US3] Implement optional PST credential and base URL resolution in `utils/security-targets.ts`
- [x] T027 [US3] Implement non-throwing HTTP observation helpers in `tests/security/pst-api-security.spec.ts` for status/body-shape/evidence capture
- [x] T028 [US3] Implement PST skipped-coverage and rate-limit finding generation in `tests/security/pst-api-security.spec.ts`

**Checkpoint**: US3 independently records PST API security observations with or without credentials.

---

## Phase 6: User Story 4 - Repository Security Hygiene Checks (Priority: P4)

**Goal**: Repository secret-pattern scanning and high/critical dependency audit results are folded into the same Markdown security summary as non-gating findings.

**Independent Test**: Run `npm run security:secrets` and `npm run security:audit` and verify `reports/security/security-summary.md` includes repository hygiene sections without failing solely on findings.

### Tests for User Story 4

- [x] T029 [P] [US4] Add secret scanner fixture/self-check logic in `scripts/security-secret-scan.ts` to validate excluded directories and redacted evidence formatting
- [x] T030 [P] [US4] Add npm audit parsing self-check logic in `scripts/security-npm-audit.ts` for zero, high, and critical advisory JSON shapes

### Implementation for User Story 4

- [x] T031 [US4] Implement repository file traversal and common secret-pattern detection in `scripts/security-secret-scan.ts`, excluding `.git`, `node_modules`, `reports`, `test-results`, `playwright-report`, `.auth`, and `.env`
- [x] T032 [US4] Implement non-gating `npm audit --audit-level=high --json` capture and finding mapping in `scripts/security-npm-audit.ts`
- [x] T033 [US4] Ensure both hygiene scripts append/merge repository findings through `utils/security-report.ts` into `reports/security/security-summary.md`

**Checkpoint**: US4 independently records repository hygiene findings.

---

## Phase 7: CI, Documentation, and Polish

**Purpose**: Wire non-gating CI, validate constitution compliance, and run quality gates.

- [x] T034 [P] Add non-gating Discovery workflow in `.github/workflows/security-discovery.yml` for pull requests and manual dispatch, publishing `reports/security/security-summary.md`
- [x] T035 [P] Update `AGENTS.md` command guidance for `npm run security:discovery` and Discovery Mode report behavior
- [x] T036 Run security Discovery suite (`npm run security:discovery`)
- [x] T037 Run lint and resolve findings (`npm run lint`)
- [x] T038 Run type-check and resolve findings (`npm run typecheck`)
- [x] T039 Validate quickstart and constitution checks from `specs/006-security-tests/quickstart.md`
- [x] T040 Confirm Discovery Mode graduation criteria are documented in `specs/006-security-tests/plan.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1) starts immediately
- Foundational (Phase 2) depends on Setup and blocks all user stories
- US1 (Phase 3) depends on Foundational and is the MVP
- US2 (Phase 4) depends on Foundational and benefits from US1 report helpers
- US3 (Phase 5) depends on Foundational and benefits from US1 report helpers
- US4 (Phase 6) depends on Foundational and benefits from US1 report helpers
- CI/Polish (Phase 7) depends on desired user stories

### User Story Dependencies

- US1 (P1) should complete first because all later stories write findings into the same report
- US2 (P2), US3 (P3), and US4 (P4) can proceed after US1 report mechanics are available
- US2 and US3 can run in parallel after US1 because they write different spec files
- US4 can run in parallel with US2/US3 after report merge behavior is stable

### Within Each User Story

- Write tests/self-checks first and confirm they fail because implementation is absent
- Implement shared utilities before target-specific observation logic
- Keep all observations non-gating; only infrastructure problems may fail tests
- Keep report evidence redacted before writing

---

## Parallel Opportunities

- T003 and T004 can run in parallel during setup
- T010 and T011 can run in parallel after foundational types exist
- T015 and T016 can run in parallel with coordination in the same SauceDemo spec file
- T022 and T023 can run in parallel in PST spec work
- T029 and T030 can run in parallel across separate scripts
- T034 and T035 can run in parallel during polish

---

## Parallel Example: US2 + US3

```bash
# Independent runtime security surfaces after report helpers exist:
Task T015: SauceDemo auth/session observation in tests/security/saucedemo-security.spec.ts
Task T022: PST public payload observation in tests/security/pst-api-security.spec.ts
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phases 1-2
2. Complete Phase 3 (US1)
3. Validate report generation independently
4. Demo a Markdown report with sample findings and redaction

### Incremental Delivery

1. Foundation complete
2. Deliver US1 report infrastructure
3. Add US2 SauceDemo runtime observations
4. Add US3 PST API observations
5. Add US4 repository hygiene scripts
6. Add CI workflow and run quality gates

### Parallel Team Strategy

1. Engineer A: `utils/security-report.ts` + `tests/security/security-report.spec.ts`
2. Engineer B: SauceDemo page-object helpers + `tests/security/saucedemo-security.spec.ts`
3. Engineer C: `utils/security-targets.ts` + `tests/security/pst-api-security.spec.ts`
4. Engineer D: `scripts/security-secret-scan.ts`, `scripts/security-npm-audit.ts`, and `.github/workflows/security-discovery.yml`

---

## Notes

- `[P]` marks tasks suitable for parallel execution when dependencies permit
- Security tests must import from `@fixtures`, not `@playwright/test`
- Security observations are findings, not test failures
- Discovery Mode must remain visible in the report and CI workflow
- Active scanning and ZAP are explicitly out of scope for this first Discovery Mode implementation
