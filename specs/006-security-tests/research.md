# Research: Security Tests

**Feature**: 006-security-tests  
**Date**: 2026-05-05  
**Status**: Complete - all NEEDS CLARIFICATION resolved

---

## Decision 1: Dedicated Playwright Security Project

**Decision**: Add a Playwright project named `security` that matches
`tests/security/**/*.spec.ts`.

**Rationale**: The suite must run independently from normal functional and API
tests. A named project supports `npx playwright test --project=security`, CI
selection, and reporting without mixing Discovery Mode checks into regular pass/fail
quality gates.

**Alternatives considered**:
- Run `npx playwright test tests/security/`: workable locally, but weaker CI and
  project-level isolation.
- Mix security checks into existing browser/API projects: rejected because the
  first pass is non-gating and has different reporting semantics.

---

## Decision 2: Reporting-Only Findings

**Decision**: Security findings are written to a shared report and test annotations.
Tests use hard assertions only for infrastructure conditions that prevent reliable
execution or report generation.

**Rationale**: The constitution-approved Discovery Mode requires visibility without
premature gating. This avoids noisy CI failures while preserving evidence for
review and future Enforcement Mode calibration.

**Alternatives considered**:
- `expect.soft` for every security observation: still risks marking the run failed
  depending on assertion behavior and does not model skipped coverage cleanly.
- Always passing tests with console logs only: insufficient evidence and weak
  artifact story for CTO-level credibility.

---

## Decision 3: Shared Markdown Reporter

**Decision**: Implement `utils/security-report.ts` as the shared writer for
Playwright runtime checks and repository hygiene scripts.

**Rationale**: A single finding model prevents divergent report formats between
tests and scripts. Markdown is human-readable in CI artifacts and satisfies the
feature requirement for `reports/security/security-summary.md`.

**Alternatives considered**:
- JSON only: easier for machines but less useful as a first artifact for reviewers.
- Separate reports per check type: fragments the story and makes skipped coverage
  harder to audit.

---

## Decision 4: Target Configuration Defaults

**Decision**: Use SauceDemo public defaults when env vars are absent. Use Practice
Software Testing public URL defaults for public checks, while authenticated checks
run only when `PST_API_USERNAME` and `PST_API_PASSWORD` are configured.

**Rationale**: SauceDemo training credentials are public and non-secret. PST
credentials are optional and must not be hard-coded. Missing PST credentials should
produce an informational skipped-coverage finding, not a failed run.

**Alternatives considered**:
- Require all env vars: too much friction for Discovery Mode and contradicts the
  spec's skip-and-report behavior.
- Hard-code PST credentials: violates the constitution's secrets principle.

---

## Decision 5: Conservative Rate-Limit Observation

**Decision**: Probe selected PST login and public API surfaces with 5-10 repeated
requests, capped at 10 per surface.

**Rationale**: The feature is non-destructive. The goal is to observe whether
throttling, delay, lockout, or no signal appears, not to stress the service.

**Alternatives considered**:
- Aggressive bursts: rejected as unsafe and constitutionally prohibited.
- No rate-limit checks: leaves a common production incident class uncovered.

---

## Decision 6: Runtime Payload Strategy

**Decision**: Use harmless strings representing XSS-like, SQL-injection-like, and
long-string input categories. Report reflection, unexpected success, validation,
navigation, and server-error behavior.

**Rationale**: Harmless payloads can reveal unsafe reflection or error handling
without exploit behavior. They also map cleanly to OWASP injection and input
validation categories.

**Alternatives considered**:
- Real exploit payloads: rejected for safety.
- Validation-only tests: too weak for the incident-prevention goal.

---

## Decision 7: Repository Secret Scan

**Decision**: Create a custom lightweight scanner that reads repository-owned
files and excludes `.git`, `node_modules`, `reports`, `test-results`,
`playwright-report`, `.auth`, and `.env`.

**Rationale**: The first pass should avoid binary tooling dependencies while still
catching common accidental exposures. Candidate findings are review-needed, not
confirmed exposures.

**Alternatives considered**:
- Add `gitleaks`: valuable later, but adds setup surface before the finding model
  is proven.
- No secret scanning: misses a high-value incident class.

---

## Decision 8: Dependency Audit Capture

**Decision**: Run `npm audit --audit-level=high --json` from a script and convert
high/critical advisory output into non-gating report findings.

**Rationale**: `npm audit` is available through the existing package manager and
fits the first-pass goal. Capturing JSON lets the report show actionable summary
without failing CI.

**Alternatives considered**:
- Fail CI on audit output: too aggressive for Discovery Mode.
- Skip dependency checks: weakens CTO-level credibility.

---

## Decision 9: CI Workflow Behavior

**Decision**: Add a pull-request and manual workflow that runs lint/typecheck plus
the security Discovery checks, then uploads the security report artifact without
failing solely on findings.

**Rationale**: This creates shift-left visibility while respecting Discovery Mode.
Infrastructure failures still fail the job; security observations remain report
data until Enforcement Mode graduation.

**Alternatives considered**:
- Manual-only CI: slower feedback and weaker DevSecOps story.
- Gating PRs immediately: rejected until false positives and severity policy are
  calibrated.

---

## Decision 10: TypeScript Script Execution

**Decision**: Run repository hygiene scripts with Node.js 24+ built-in TypeScript
type stripping and include `scripts/**/*.ts` in the project type-check.

**Rationale**: The repo has no `tsx` or `ts-node` dependency, and the first pass
intentionally avoids new packages. The local environment is Node.js 24.15.0, which
can execute erasable TypeScript syntax directly. Including scripts in `tsconfig`
keeps strict TypeScript coverage.

**Alternatives considered**:
- Add `tsx`: ergonomic, but adds a dependency before it is necessary.
- Write scripts as JavaScript: avoids a runner but violates the TypeScript-only
  direction for source files.
- Compile scripts separately before running: more moving parts than needed for
  two small scripts.
