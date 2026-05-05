# Contract: CI Security Discovery Workflow

**Workflow type**: Pull request and manual execution  
**Mode**: Discovery Mode  
**Gating**: Non-gating security findings; infrastructure failures still fail

## Required Behavior

The workflow must:
- run on pull requests
- support manual dispatch
- run lint and type-check before security checks
- run the dedicated security project
- run repository hygiene scripts
- publish `reports/security/security-summary.md` as an artifact when present
- avoid failing solely because findings were reported

## Environment

Required:
- Node.js and npm
- Playwright browser dependencies

Optional:
- Practice Software Testing credentials for authenticated checks

Missing optional credentials must appear as skipped coverage in the report.

## Graduation Note

This workflow remains Discovery Mode until the plan's graduation criteria are met.
Future Enforcement Mode may gate confirmed Critical/High findings after severity
policy approval and false-positive triage.

## Success Criteria Mapping

Supports SC-001, SC-003, SC-007, SC-009, and SC-010.
