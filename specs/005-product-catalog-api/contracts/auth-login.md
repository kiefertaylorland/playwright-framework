# Contract: POST /auth/login

**Endpoint**: `POST {PST_API_URL}/auth/login`
**Auth required**: No
**Spec refs**: FR-006, FR-007

## Request

```
POST /auth/login
Content-Type: application/json

{
  "username": "<PST_API_USERNAME>",
  "password": "<PST_API_PASSWORD>"
}
```

Credentials MUST be sourced from environment variables. Hard-coded values are
forbidden per Constitution Principle V.

## Success Response

**Status**: `200 OK`
**Condition**: `username` and `password` match a registered account.

```json
{
  "access_token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

## Error Response

**Status**: `401 Unauthorized` or `422 Unprocessable Entity`
**Condition**: Credentials do not match any account.

The spec accepts either 401 or 422 as valid rejection codes.

## Assertions (test contract)

### Valid credentials (FR-006)

| Field | Required | Type | Rule |
|-------|----------|------|------|
| `status` | ✅ | — | `=== 200` |
| `access_token` | ✅ | `string` | Non-empty; `typeof === 'string'` |
| `token_type` | — | `string` | Not asserted (informational) |
| `expires_in` | — | `number` | Not asserted (informational) |

### Invalid credentials (FR-007)

| Field | Required | Rule |
|-------|----------|------|
| `status` | ✅ | `=== 401` or `=== 422` |
| `access_token` | ✅ | NOT present in response body |

## Notes

- The `access_token` from a successful login is consumed by the US4 bearer
  token test within the same test body. It is never stored as shared state
  across test functions.
- Invalid credentials used in the failure test: any non-existent email address
  with any password. These are also injected as env vars or constructed as
  clearly-invalid constants (e.g., `invalid@example.com` / `wrongpassword`).
  Since these are not real credentials, they do not constitute a secrets risk.
