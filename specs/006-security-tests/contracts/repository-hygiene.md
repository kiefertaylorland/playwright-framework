# Contract: Repository Hygiene Checks

**Scope**: Local repository-owned files  
**Mode**: Discovery Mode  
**Gating**: Non-gating findings

## Secret Pattern Scan

Must include:
- common token/API-key assignment patterns
- private key block markers
- password/secret variable names with literal values
- authorization bearer literal patterns

Must exclude:
- `.git`
- `node_modules`
- `reports`
- `test-results`
- `playwright-report`
- `.auth`
- `.env`

Findings are candidate findings with `review-needed` status unless the evidence
is unambiguously a committed secret.

## Dependency Audit

Must run a high/critical dependency audit and capture:
- total high advisory count
- total critical advisory count
- package names when available
- advisory names or titles when available
- remediation hint when available

Non-zero audit findings are report findings, not CI failures, in Discovery Mode.

## Success Criteria Mapping

Supports SC-002, SC-004, SC-005, SC-008, and SC-009.
