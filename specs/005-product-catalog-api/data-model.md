# Data Model: Product Catalog API

**Feature**: 005-product-catalog-api
**Date**: 2026-03-13

All types below represent the API response contract as TypeScript interfaces.
These drive both the type declarations in `utils/api-types.ts` and the assertion
logic in the test files.

---

## Core Entities

### Product

The primary item in the catalogue. Returned inside paginated lists and as a
standalone detail record.

```typescript
interface Product {
  id: string;           // UUID v4 format — "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
  name: string;         // Non-empty display name
  description: string;  // May be empty string; presence required, content unchecked
  price: number;        // Positive numeric value (float); cents represented as decimal
  category_id: string;  // UUID reference to a Category
  brand_id: string;     // UUID reference to a Brand
  product_image: ProductImage[];  // At least one image required (FR-003)
}
```

**Validation rules derived from spec:**
- `id` MUST match UUID v4 pattern
- `name` MUST be a non-empty string
- `price` MUST be a JavaScript `number` (not a string, not null)
- `product_image` MUST be a non-empty array

---

### ProductImage

Image record associated with a product. Internal structure is not under contract;
only presence (at least one) is asserted.

```typescript
interface ProductImage {
  id?: string;
  by_name?: string;
  file_name?: string;
  title?: string;
  original_file_name?: string;
}
```

---

### Category

Flat classification record returned by `GET /categories`.

```typescript
interface Category {
  id: string;            // UUID
  name: string;          // Display name
  slug?: string;         // URL-safe identifier
  parent_id?: string | null;  // null for top-level categories
}
```

**Validation rules:**
- Response MUST be a non-empty array (FR-009)
- Each entry MUST have `id` and `name`

---

### PaginationMeta

Envelope metadata returned alongside paginated list responses.

```typescript
interface PaginationMeta {
  current_page: number;
  from: number;
  last_page: number;
  path: string;
  per_page: number;
  to: number;
  total: number;
}
```

---

### PaginationLinks

Navigation links within a paginated response.

```typescript
interface PaginationLinks {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
}
```

---

### PaginatedResponse\<T\>

Generic wrapper for all paginated endpoints.

```typescript
interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
  links: PaginationLinks;
}
```

**Validation rules:**
- `data` MUST be an array (may be empty on last pages)
- For `GET /products`, `data` MUST be non-empty on the first/default page

---

## Authentication Entities

### AuthRequest

Request body for `POST /auth/login`.

```typescript
interface AuthRequest {
  username: string;  // Email address
  password: string;
}
```

---

### AuthResponse

Response body returned on successful authentication.

```typescript
interface AuthResponse {
  access_token: string;   // Bearer token; non-empty string
  token_type: string;     // Expected: "Bearer"
  expires_in: number;     // Seconds until expiry (positive integer)
}
```

**Validation rules derived from spec:**
- `access_token` MUST be a non-empty string (FR-006)
- Presence of `access_token` is sufficient; JWT structure is not parsed in tests

---

## Type Assertion Strategy

Tests assert the minimum contract required by each FR:

| Assertion | What is checked | What is NOT checked |
|-----------|----------------|---------------------|
| Product list shape (US1 + US4) | Parsed as `PaginatedResponse<Product>`; `data` is non-empty array; `meta.total` exists; `links` exists; each item has `id`, `name`, `price` (number), `product_image.length >= 1` | Specific names, prices, image URLs |
| Product detail fields | All fields from `Product` interface are present | Field values beyond type |
| Auth success | `access_token` is non-empty string | JWT claims, expiry value |
| Auth failure | No `access_token` in response body | Specific error message text |
| Categories | Response is non-empty array; each item has `id`, `name` | Category count, specific names |

---

## UUID Validation Helper

Tests that assert UUID format use this regex (RFC 4122):

```typescript
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
```

Used to validate `product.id` in the list and detail responses.

---

## Known-Invalid UUID Constant

```typescript
const NIL_UUID = '00000000-0000-0000-0000-000000000000';
```

Used in the 404 test for `GET /products/{id}`. This is the only hard-coded UUID
in the test suite — it is not a credential or product ID, so it does not violate
Principle V.
