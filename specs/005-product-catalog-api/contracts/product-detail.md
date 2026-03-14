# Contract: GET /products/{id}

**Endpoint**: `GET {PST_API_URL}/products/{id}`
**Auth required**: No (public endpoint)
**Spec refs**: FR-004, FR-005

## Request

```
GET /products/{id}
```

`{id}` is a UUID v4 string.

## Success Response

**Status**: `200 OK`
**Condition**: `{id}` matches an existing product.

```json
{
  "id": "UUID-v4",
  "name": "string",
  "description": "string",
  "price": 12.99,
  "category_id": "UUID-v4",
  "brand_id": "UUID-v4",
  "product_image": [
    { "id": "UUID-v4", "file_name": "string" }
  ]
}
```

## Error Response

**Status**: `404 Not Found`
**Condition**: `{id}` is a well-formed UUID that does not match any product.

## Assertions (test contract)

### Valid ID (FR-004)

| Field | Required | Type | Rule |
|-------|----------|------|------|
| `status` | ✅ | — | `=== 200` |
| `id` | ✅ | `string` | Matches UUID v4 pattern; `=== requested id` |
| `name` | ✅ | `string` | Non-empty |
| `description` | ✅ | `string` | Present (may be empty) |
| `price` | ✅ | `number` | `typeof === 'number'` |
| `category_id` | ✅ | `string` | UUID v4 format |
| `brand_id` | ✅ | `string` | UUID v4 format |
| `product_image` | ✅ | `array` | Present |

### Invalid ID (FR-005)

| Field | Required | Rule |
|-------|----------|------|
| `status` | ✅ | `=== 404` |

## Notes

- The valid UUID is obtained dynamically from `GET /products data[0].id`.
  No UUID is hard-coded in tests.
- The invalid UUID constant is `00000000-0000-0000-0000-000000000000` (nil UUID).
