# Contract: GET /products

**Endpoint**: `GET {PST_API_URL}/products`
**Auth required**: No (public endpoint; also tested with bearer token in US4)
**Spec refs**: FR-001, FR-002, FR-003, FR-008

## Request

```
GET /products
Authorization: (none) | Bearer <access_token>
```

No required query parameters. Default page returns the first page of results.

## Success Response

**Status**: `200 OK`

```json
{
  "data": [
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
  ],
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 3,
    "path": "https://api.practicesoftwaretesting.com/products",
    "per_page": 9,
    "to": 9,
    "total": 27
  },
  "links": {
    "first": "string | null",
    "last": "string | null",
    "prev": "null",
    "next": "string | null"
  }
}
```

## Assertions (test contract)

| Field | Required | Type | Rule |
|-------|----------|------|------|
| `status` | ✅ | — | `=== 200` |
| `data` | ✅ | `array` | Non-empty on first/default page |
| `data[n].id` | ✅ | `string` | Matches UUID v4 pattern |
| `data[n].name` | ✅ | `string` | Non-empty |
| `data[n].price` | ✅ | `number` | `typeof === 'number'` |
| `data[n].product_image` | ✅ | `array` | `length >= 1` |
| `meta` | ✅ | `object` | Present |
| `meta.total` | ✅ | `number` | Present (minimum pagination total field) |
| `links` | ✅ | `object` | Present |

## Notes

- When called with a valid bearer token (US4), the response MUST satisfy the
  same assertions as unauthenticated US1 using the same typed contract
  (`PaginatedResponse<Product>`): `200`, non-empty `data`, `meta.total`, and `links`.
- Pagination parameters (`page`, `per_page`) are not tested in this spec.
