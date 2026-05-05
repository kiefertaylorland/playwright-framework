<!--
  SYNC IMPACT REPORT
  ==================
  Version change:     1.0.0 -> 2.0.0
  Bump type:          MAJOR - redefines the non-negotiable security gate from
                      immediate ZAP/high-critical failure to a staged security
                      governance model with explicit modes and graduation rules.

  Modified principles:
    - Security & Quality Gates: replaced mandatory always-on ZAP gating with
      Discovery, Enforcement, and Production Gate modes.
    - Development Workflow: CI security behavior now depends on the documented
      security mode and confirmed finding status.

  Added sections:
    - Security gate maturity modes
    - Security report content requirements
    - Safe security testing constraints
    - Graduation criteria from Discovery Mode to Enforcement Mode

  Removed sections:
    - Mandatory active ZAP scan requirement for every security test suite
    - Mandatory CI failure for every unfiltered ZAP Critical/High finding

  Templates reviewed for consistency:
    ✅ .specify/templates/plan-template.md
         Constitution Check now requires security features to document mode,
         target authorization, reporting, gating behavior, and graduation path.
    ✅ .specify/templates/spec-template.md
         Requirements section remains compatible; no structural change needed.
    ✅ .specify/templates/tasks-template.md
         Polish phase now calls out security gate/mode follow-through.
    ✅ AGENTS.md
         Security testing and CI guidance updated to staged gates.
    ✅ specs/006-security-tests/spec.md
         Discovery Mode scope now aligns with constitution instead of flagging
         an unresolved conflict.
    ✅ specs/006-security-tests/checklists/requirements.md
         Checklist note updated for constitution alignment.
    N/A .specify/templates/commands/
         Directory is not present in this repository.

  Deferred TODOs:
    None.
-->

# Playwright Framework Constitution

## Core Principles

### I. Strict TypeScript

All source files MUST be TypeScript. The use of `any` is forbidden. Type assertions
(`as SomeType` or `<SomeType>`) MUST include an inline comment justifying why inference
is insufficient. Compiler flags `strict: true` and `noImplicitAny: true` MUST be
enabled in `tsconfig.json`.

**Rationale**: Type safety eliminates entire categories of runtime errors in test helpers
and page objects. Unexplained assertions are a maintenance hazard — justification
keeps intent visible.

### II. Page Object Model (NON-NEGOTIABLE)

Test files MUST NOT contain CSS selectors, XPath expressions, or direct locator
construction (e.g., `page.locator(...)`, `page.$(...)`). Every UI interaction MUST
be delegated to a Page Object class under `pages/`. Page Object methods MUST return
`void` or domain-typed values, never raw Playwright `Locator` objects.

**Rationale**: POM decouples selector maintenance from test logic. Exposing raw
locators collapses the abstraction boundary and couples tests to DOM structure.

### III. Test Isolation

Each test MUST be fully self-contained. Tests MUST NOT share mutable state — no
shared variables, no cross-test fixture side effects, no reliance on execution order.
Every test MUST leave the system in the same state it found it (or use isolated
accounts/data). Global `beforeAll`/`afterAll` blocks MUST NOT mutate shared runtime
state; they MAY perform read-only setup such as loading storage state.

**Rationale**: Shared state is the primary cause of flaky tests. Isolation guarantees
results are deterministic regardless of parallelism or execution order.

### IV. Selector Hierarchy

Selectors MUST follow this precedence, applied strictly in order:

1. `data-testid` attribute (preferred — semantically stable, decoupled from style)
2. ARIA roles and accessible names (`getByRole`, `getByLabel`, `getByText`)
3. CSS selectors (last resort — MUST include a justifying comment explaining why
   `data-testid` and ARIA selectors were insufficient)

XPath selectors are forbidden.

**Rationale**: `data-testid` attributes survive styling and layout changes.
ARIA roles also validate accessibility. CSS selectors are brittle and tie tests
to presentational decisions.

### V. Secrets Management

Hard-coded credentials, tokens, API keys, or any sensitive value are forbidden in
all source files, including test data factories and fixture files. All secrets MUST
be sourced from environment variables (e.g., `process.env.TEST_USERNAME`). The
`.env` file MUST be `.gitignore`d. CI/CD pipelines MUST inject secrets via encrypted
environment variables or a secrets manager.

**Rationale**: Hard-coded credentials are a critical security risk. Secrets in source
control are effectively public and cannot be safely rotated per-environment.

### VI. Parallel-Safe Design

Every test MUST be designed to run correctly with `--workers=4` or higher. Tests
MUST NOT depend on shared browser state, shared database rows, shared user accounts,
or any resource that only one worker can hold at a time. Tests that require unique
accounts MUST generate them dynamically (e.g., via data factories) or use dedicated
pre-provisioned accounts per worker.

**Rationale**: Parallel execution is the primary driver of CI speed at scale.
Tests that are only safe under serial execution silently degrade the pipeline.

### VII. Fixture Imports (NON-NEGOTIABLE)

All test files MUST import `test` and `expect` exclusively from the project's
`fixtures/` directory. Direct imports from `@playwright/test` are forbidden in
`tests/` files. Fixtures extend the base `test` object with project-wide helpers,
page objects, and auth state — bypassing fixtures loses this context silently.

**Rationale**: This enforces a single extension point for test infrastructure.
Teams adding capabilities do so once in `fixtures/`; all tests inherit immediately.
Direct `@playwright/test` imports fragment this contract.

### VIII. API Test Purity

API test files (under `tests/api/`) MUST use only Playwright's `request` fixture.
They MUST NOT import or use `page`, `browser`, or `context`. Browser launch overhead
is unnecessary for HTTP-only assertions and wastes CI resources.

**Rationale**: API tests that spin up a browser are 10–50× slower than necessary.
Strict separation also makes it obvious which tests are pure API contracts versus
UI-driven flows.

## Security & Quality Gates

Security gates are mandatory, but their enforcement level MUST be staged and
explicit. Every security feature MUST document its current security mode in the
feature spec or implementation plan.

### Security Gate Maturity Modes

- **Discovery Mode**: Non-destructive, non-gating, report-only validation used
  to establish coverage and calibrate findings for a new target, new risk area,
  or newly unstable check. Discovery Mode MUST produce a report, publish all
  findings, document skipped coverage, and include a graduation path to
  Enforcement Mode.
- **Enforcement Mode**: Calibrated validation that gates CI on confirmed policy
  violations. Enforcement Mode MUST fail CI on confirmed Critical or High
  findings. Suspected, untriaged, or known false-positive findings MAY remain
  non-gating only when their status and rationale are documented.
- **Production Gate Mode**: Release-readiness validation for protected branches
  or release workflows. Production Gate Mode MUST require all mandated security
  checks for the target and MUST have no unresolved confirmed Critical or High
  findings before release promotion.

Discovery Mode is allowed only for first implementation of a target, first
implementation of a risk area, or calibration of unstable checks. It MUST NOT
be used as a permanent bypass for Enforcement Mode.

### Security Coverage Requirements

- **Scanner coverage**: Enforcement Mode web security coverage MUST include
  OWASP ZAP or an equivalent approved scanner where the target exposes browser
  or HTTP surfaces suitable for scanning.
- **Active scan authorization**: Active scans MUST run only against local,
  disposable, owned, or explicitly authorized targets. Passive scans SHOULD be
  preferred for pull requests unless the target authorization and safety model
  are documented.
- **Input sanitization coverage**: Security test suites MUST include checks for
  XSS, SQL injection, and CSRF where the target application exposes relevant
  attack surfaces.
- **Authentication flaw coverage**: Tests MUST validate session fixation,
  credential brute-force resistance, access control, and JWT validation where
  applicable.
- **Safe testing**: Security checks MUST be non-destructive unless explicitly
  authorized. Tests MUST NOT attempt data deletion, service disruption, account
  lockout, credential stuffing, or uncontrolled traffic generation.
- **Rate-limit checks**: Rate-limit and brute-force-resistance checks MUST use
  conservative, documented request limits appropriate to the target.

### Security Reporting Requirements

Non-gating findings MUST still be reported and published; non-gating status MUST
NOT suppress visibility. Security reports MUST include target, mode, target
authorization status, gating status, severity, OWASP mapping where applicable,
evidence summary, redaction status, skipped coverage, and recommended next
action.

Reports and artifacts MUST NOT contain plaintext credentials, tokens, session
identifiers, or personally identifiable information.

Before a suite graduates from Discovery Mode to Enforcement Mode, the plan MUST
document at least two stable CI runs, triaged false positives, an approved
severity policy, target authorization, adequate report evidence, and owners or
follow-up tasks for skipped coverage.

## Development Workflow

The following workflow rules apply to all contributors:

- **TDD cycle**: Tests are written first, confirmed to fail, then implementation
  follows. No implementation code is merged without a corresponding failing test
  that was written before implementation began.
- **Import discipline**: Running `grep -r "from '@playwright/test'" tests/` MUST
  return zero results in any passing CI run.
- **Lint + type-check gate**: `npm run lint` and `npx tsc --noEmit` MUST pass
  before any PR is merged. These run as the first CI job.
- **Staged security gates**: Pull requests MAY run Discovery Mode checks as
  non-gating report publishers. `main` SHOULD run Enforcement Mode once checks
  are calibrated. Scheduled and manual workflows MAY run deeper scans, including
  active scans when authorization is documented. Release workflows MUST use
  Production Gate Mode once release workflows exist.
- **Auth state via global setup**: Authenticated test files MUST use
  `test.use({ storageState: '.auth/user.json' })` sourced from `globalSetup`.
  Login flows MUST NOT be repeated inside individual test bodies.
- **Reporting**: Allure reports are generated from `reports/allure-results/` and
  published as GitHub Actions artifacts on every run against `main`.

## Governance

This constitution supersedes all other practices, conventions, or informal agreements
within this repository. It is the authoritative source of non-negotiable rules.

**Amendment procedure**: Any amendment MUST be proposed as a pull request modifying
this file. The PR description MUST include: (a) the principle being changed, (b) the
rationale for the change, and (c) a migration plan for any existing tests affected.

**Versioning policy**:

- MAJOR: Backward-incompatible removals or redefinitions of existing principles.
- MINOR: New principles or materially expanded guidance added.
- PATCH: Clarifications, wording corrections, non-semantic refinements.

**Compliance review**: All PRs modifying files under `tests/`, `pages/`, or
`fixtures/` MUST be checked against the Constitution Check gate in `plan-template.md`
before approval. Reviewers are responsible for flagging violations.

**Runtime guidance**: See `AGENTS.md` for command references and directory conventions.

**Version**: 2.0.0 | **Ratified**: 2026-03-13 | **Last Amended**: 2026-05-05
