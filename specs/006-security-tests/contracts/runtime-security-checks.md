# Contract: Runtime Security Checks

**Surfaces**: SauceDemo UI, Practice Software Testing API/public surfaces  
**Mode**: Discovery Mode  
**Safety**: Non-destructive only

## SauceDemo Checks

Required observations:
- Authentication/session behavior with public defaults
- Login form handling of harmless XSS-like payload
- Login form handling of harmless SQL-injection-like payload
- Login form handling of long-string payload
- Checkout identity field handling of harmless payloads

Reported outcomes:
- safely rejected
- reflected
- unexpected success
- server error
- navigation anomaly
- infrastructure uncertainty

Checkout checks must not complete an order.

## Practice Software Testing Checks

Required observations:
- Public input/query surface handling of harmless payloads
- Unauthenticated protected resource access behavior
- Optional authenticated input checks when credentials are configured
- Conservative repeated-request observation for login and selected public API
  surfaces, capped at 10 requests per surface

Reported outcomes:
- rejected
- reflected
- ignored
- accepted
- status-code anomaly
- throttling signal observed
- no throttling signal observed
- skipped due to missing credentials
- infrastructure uncertainty

## Failure Rules

Security observations are report findings. Tests fail only when:
- the reporter cannot write the Markdown report
- required test infrastructure is unavailable in a way that prevents a valid report
- TypeScript/Playwright setup is misconfigured

## Success Criteria Mapping

Supports SC-002, SC-003, SC-004, SC-005, SC-006, SC-007, SC-008, and SC-009.
