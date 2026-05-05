# Data Model: Security Tests

**Feature**: 006-security-tests  
**Date**: 2026-05-05

## SecuritySeverity

Allowed values:
- `INFO`
- `LOW`
- `MEDIUM`
- `HIGH`
- `CRITICAL`

Validation:
- Every finding must use exactly one allowed severity.
- Discovery Mode does not gate on severity, but severity is still required.

## SecurityMode

Allowed values:
- `DISCOVERY`
- `ENFORCEMENT`
- `PRODUCTION_GATE`

This feature uses `DISCOVERY`.

## SecurityTarget

Represents an evaluated application, API, or local repository scope.

Fields:
- `id`: stable target key, such as `saucedemo`, `practice-software-testing`, or
  `repository`
- `displayName`: human-readable target name
- `baseUrl`: URL for remote targets, omitted for local repository scans
- `authorizationStatus`: `public-training-target`, `configured-credentials`,
  `credentials-missing`, `local-repository`, or `unreachable`
- `credentialSource`: `public-default`, `environment`, or `none`

Validation:
- Credentials and tokens are never stored.
- Missing optional credentials produce skipped coverage, not failure.

## SecurityCheck

Represents one non-destructive validation activity.

Fields:
- `id`: stable check key
- `targetId`: associated target
- `category`: authentication/session, input-sanitization, access-control,
  rate-limit-observation, dependency-audit, secret-scan, or report-integrity
- `mode`: security mode
- `owaspCategory`: OWASP mapping when applicable
- `safeLimit`: optional numeric request cap for repeated-request checks

Validation:
- Repeated-request checks must define `safeLimit <= 10`.
- Checks requiring credentials must be skipped if credentials are unavailable.

## SecurityFinding

Represents a reportable observation.

Fields:
- `id`: stable finding key
- `severity`: `SecuritySeverity`
- `targetId`: associated target
- `checkId`: associated check
- `title`: concise finding title
- `status`: `observed`, `review-needed`, `skipped`, or `infrastructure-uncertain`
- `owaspCategory`: OWASP mapping where applicable
- `evidence`: redacted evidence summary
- `redactionApplied`: boolean
- `gating`: `non-gating` for this feature
- `nextAction`: reviewer-oriented action

Validation:
- Evidence must not contain plaintext credentials, tokens, session identifiers,
  or sensitive personal values.
- `status=skipped` findings must explain missing configuration or precondition.
- `HIGH` and `CRITICAL` severities are still non-gating in Discovery Mode.

## SecurityRun

Represents one report generation cycle.

Fields:
- `timestamp`: ISO-8601 timestamp
- `mode`: `DISCOVERY`
- `reportPath`: `reports/security/security-summary.md`
- `targets`: list of `SecurityTarget`
- `checks`: list of `SecurityCheck`
- `findings`: list of `SecurityFinding`
- `summary`: counts by severity, target, status, and skipped coverage

Validation:
- Each run overwrites the prior Markdown summary.
- The report must include target configuration, mode, gating behavior, and
  graduation path.

## RepositoryHygieneResult

Represents output from local dependency or secret checks.

Fields:
- `source`: `secret-scan` or `npm-audit`
- `scannedScope`: directories/files considered
- `excludedScope`: excluded directories/files
- `candidateCount`: number of candidate findings
- `findings`: mapped `SecurityFinding` entries

Validation:
- Scans exclude `.git`, `node_modules`, `reports`, `test-results`,
  `playwright-report`, `.auth`, and `.env`.
- Secret evidence is redacted to show pattern context without the full value.
