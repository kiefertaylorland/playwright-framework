# Quickstart: Security Discovery Tests

**Feature**: 006-security-tests  
**Mode**: Discovery Mode  
**Report**: `reports/security/security-summary.md`

## Prerequisites

Install dependencies and browsers:

```bash
npm install
npx playwright install
```

## Optional Environment

SauceDemo uses public training defaults when env vars are absent. Practice
Software Testing public checks use default public target configuration when
available. Authenticated PST checks require optional credentials:

```bash
PST_API_URL=https://api.practicesoftwaretesting.com
PST_API_USERNAME=<optional username>
PST_API_PASSWORD=<optional password>
```

Do not commit `.env`; it is gitignored.

## Run Security Discovery Checks

```bash
npm run test:security
npm run security:secrets
npm run security:audit
```

The hygiene scripts are TypeScript files executed by Node.js built-in type
stripping. Use Node.js 24+ for local and CI runs.

Expected report:

```text
reports/security/security-summary.md
```

Security findings are non-gating in Discovery Mode. Infrastructure failures such
as an unwritable report path or invalid test configuration may still fail.

## Run Quality Gates

```bash
npm run lint
npm run typecheck
```

## Verify Constitution Compliance

```bash
# Tests must use fixture imports only.
grep -r "from '@playwright/test'" tests/

# Security report must not include plaintext secrets or tokens.
grep -Ei "(access_token|authorization: bearer|password=|session)" reports/security/security-summary.md
```

The second command may return section labels or redacted examples, but must not
show live secret values.

## CI Artifact

The Discovery workflow publishes `reports/security/security-summary.md` as a
workflow artifact. Pull requests must not fail solely because the report contains
security findings.

## Graduation To Enforcement Mode

Before switching to Enforcement Mode:

1. Record at least two stable CI runs.
2. Triage false positives.
3. Approve severity policy.
4. Confirm target authorization.
5. Confirm report evidence is adequate.
6. Create owners or follow-up tasks for skipped coverage.
