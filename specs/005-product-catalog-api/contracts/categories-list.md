# Contract: GET /categories

**Endpoint**: `GET {PST_API_URL}/categories`
**Auth required**: No (public endpoint)
**Spec refs**: FR-009

## Request

```
GET /categories
```

No required parameters or headers.

## Success Response

**Status**: `200 OK`

```json
[
  {
    "id": "UUID-v4",
    "name": "string",
    "slug": "string",
    "parent_id": "UUID-v4 | null"
  }
]
```

Note: The response is a **flat array** (not a paginated envelope).
Top-level categories have `parent_id: null`.

## Assertions (test contract)

| Field | Required | Type | Rule |
|-------|----------|------|------|
| `status` | ✅ | — | `=== 200` |
| response body | ✅ | `array` | `Array.isArray(body) === true` |
| `body.length` | ✅ | `number` | `>= 1` (non-empty) |
| `body[n].id` | ✅ | `string` | Present |
| `body[n].name` | ✅ | `string` | Non-empty |

## Notes

- Unlike the products endpoint, categories are returned as a plain array,
  not wrapped in a pagination envelope.
- Category count and specific names are not asserted (contract check only).
