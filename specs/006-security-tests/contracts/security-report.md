# Contract: Security Summary Report

**Output**: `reports/security/security-summary.md`  
**Mode**: Discovery Mode  
**Gating**: Non-gating findings; infrastructure failures may fail execution

## Required Sections

1. Title and run timestamp
2. Security mode and gating policy
3. Target configuration summary
4. Check coverage summary
5. Findings summary by severity and status
6. Detailed findings table
7. Skipped coverage
8. Redaction statement
9. Graduation path to Enforcement Mode

## Finding Row Fields

Each detailed finding row must include:
- ID
- Severity
- Target
- Check category
- OWASP mapping, or `N/A`
- Status
- Gating status
- Evidence summary
- Next action

## Redaction Rules

The report must not include:
- plaintext passwords
- access tokens
- session identifiers
- cookies
- API keys
- full secret candidate values

Evidence may include safe metadata such as status codes, route names, response
shape notes, and redacted snippets.

## Success Criteria Mapping

Supports SC-001, SC-002, SC-003, SC-004, SC-008, SC-009, and SC-010.
