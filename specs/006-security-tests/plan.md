# Implementation Plan: Security Tests

**Branch**: `006-security-tests` | **Date**: 2026-05-05 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/006-security-tests/spec.md`

## Summary

Implement a Discovery Mode security validation suite for SauceDemo and Practice
Software Testing. The suite adds a dedicated Playwright `security` project,
runtime security tests under `tests/security/`, a shared Markdown security
reporter, and repository hygiene scripts for lightweight secret-pattern scanning
and high/critical dependency audit capture.

The first pass is non-destructive and non-gating by design. Security observations
are recorded as findings, annotations, and report entries; tests fail only for
infrastructure errors that prevent reliable execution or report generation.

## Technical Context

**Language/Version**: TypeScript 5.x, `strict: true`, `noImplicitAny: true`  
**Primary Dependencies**: `@playwright/test`, Node.js 24+ built-in TypeScript
type stripping for local security scripts, Node.js built-in `fs`, `path`,
`process`, `child_process`, existing `dotenv` config; no new package dependency
for first pass  
**Storage**: Markdown report at `reports/security/security-summary.md`
(`reports/` is gitignored)  
**Testing**: Playwright Test runner, dedicated `security` project, `@fixtures`
imports for all test files  
**Target Platform**: SauceDemo browser UI and Practice Software Testing HTTP/API
surfaces; repository hygiene checks run against local repo files  
**Project Type**: Test automation framework feature  
**Performance Goals**: Security project plus hygiene scripts complete in under
5 minutes under normal local network conditions  
**Constraints**: Discovery Mode only; non-destructive checks; findings are
non-gating; no plaintext credentials/tokens in reports; conservative rate-limit
observations capped at 10 requests per selected surface; no hard-coded secrets  
**Scale/Scope**: 4 user stories, 3 runtime security spec files, 2 repository
hygiene scripts, 1 shared reporting utility, 1 CI workflow

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Gate | Status | Notes |
|------------------|--------|-------|
| I. Strict TypeScript | PASS | All new code is TypeScript with explicit domain types and no `any`. |
| II. Page Object Model | PASS | SauceDemo UI interactions use existing or extended page objects; tests do not own selectors. |
| III. Test Isolation | PASS | Each security test records independent findings and avoids shared mutable target state. |
| IV. Selector Hierarchy | PASS | Existing page objects own data-test/CSS fallback selectors; any new UI selectors remain in page objects. |
| V. Secrets Management | PASS | SauceDemo public defaults are non-secret training values; optional PST credentials come from env vars only and are redacted. |
| VI. Parallel-Safe Design | PASS | Runtime checks avoid cross-test state and use conservative request counts. |
| VII. Fixture Imports | PASS | Security test files import `test`/`expect` from `@fixtures` only. |
| VIII. API Test Purity | PASS | Applies only to `tests/api/`; security tests may use `request` and `page` because they are mixed runtime security tests. |
| Security Gate Mode | PASS | Feature is explicitly Discovery Mode: report-only, non-gating, with graduation criteria below. |
| Safe Security Testing | PASS | No destructive probes, account lockout attempts, credential stuffing, or uncontrolled traffic. |
| Security Reporting | PASS | Report includes mode, target authorization, severity, OWASP mapping, evidence, redaction, skipped coverage, and next action. |

**Security mode**: Discovery Mode.

**Gating behavior**:
- PR: run security checks non-gating and publish `reports/security/security-summary.md`.
- `main`: publish non-gating Discovery report until the suite graduates.
- Scheduled/manual: may run the same Discovery checks; active scans remain out of scope.
- Release: Production Gate Mode is not introduced by this feature.

**Target authorization status**:
- SauceDemo: public training target, non-destructive UI checks only.
- Practice Software Testing: public training target, non-destructive public API
  and optional credential-dependent checks only.
- Repository hygiene: local repository-owned files only.

**Graduation path to Enforcement Mode**:
1. Complete at least two stable CI runs of the Discovery suite.
2. Triage false positives and document known-review findings.
3. Approve a severity policy for confirmed Critical/High findings.
4. Confirm target authorization for any scanner or active checks.
5. Ensure report evidence is sufficient for remediation without raw logs.
6. Create owners or follow-up tasks for skipped coverage.

**All gates pass. No unjustified constitution violations.**

## Project Structure

### Documentation (this feature)

```text
specs/006-security-tests/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── security-report.md
│   ├── runtime-security-checks.md
│   ├── repository-hygiene.md
│   └── ci-security-workflow.md
└── tasks.md
```

### Source Code (repository root)

```text
pages/
├── login.page.ts              # May gain safe input observation helpers
├── checkout.page.ts           # May gain safe checkout observation helpers
└── inventory.page.ts          # Used for safe cart setup

tests/
└── security/
    ├── saucedemo-security.spec.ts
    ├── pst-api-security.spec.ts
    └── security-report.spec.ts

utils/
├── security-report.ts         # Shared finding model + Markdown writer
└── security-targets.ts        # Target config, defaults, payloads, redaction

scripts/
├── security-secret-scan.ts    # Lightweight repo-owned file scan
└── security-npm-audit.ts      # Non-gating npm audit capture

.github/
└── workflows/
    └── security-discovery.yml # Non-gating PR/manual workflow

reports/
└── security/
    └── security-summary.md    # Generated, gitignored
```

**Structure Decision**: Single-project layout. Runtime behavior belongs in
`tests/security/`; shared reporting and target configuration belong in `utils/`;
repository hygiene belongs in `scripts/`; CI lives in `.github/workflows/`.

## Complexity Tracking

> No Constitution Check violations. This section intentionally empty.

---

## Phase 0: Research Summary

All architectural decisions are documented in [research.md](research.md).
No NEEDS CLARIFICATION items remain.

Key decisions:
1. Dedicated `security` Playwright project.
2. Discovery Mode findings are recorded, not asserted as failures.
3. Shared Markdown reporter is the source of truth for test and script output.
4. SauceDemo uses public defaults; PST credentials remain optional.
5. Rate-limit observations use conservative request caps.
6. Secret scanning is custom and repository-local.
7. Dependency auditing uses `npm audit --audit-level=high` as non-gating input.
8. TypeScript hygiene scripts run with Node.js built-in type stripping and are
   included in project type-checking.
9. CI publishes the report without failing on findings.

## Phase 1: Design Summary

Artifacts generated:
- **[data-model.md](data-model.md)**: Security run, target, check, finding,
  skipped coverage, repository hygiene result, severity, and OWASP mapping models.
- **[contracts/](contracts/)**: Report, runtime check, repository hygiene, and
  CI workflow contracts.
- **[quickstart.md](quickstart.md)**: Local and CI-oriented setup/run guide,
  expected outputs, and constitution checks.

## Post-Phase 1 Constitution Re-check

All gates continue to pass after design:
- Discovery Mode is explicit and has a graduation path.
- Reports are mandatory and non-gating findings remain visible.
- Active scanning is not included.
- Request caps and safe payloads are documented.
- Credentials and tokens are redacted and not hard-coded.
