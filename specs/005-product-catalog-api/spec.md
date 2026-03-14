# Feature Specification: Product Catalog API

**Feature Branch**: `005-product-catalog-api`
**Created**: 2026-03-13
**Status**: Draft
**Input**: User description: "Product catalog API for Practice Software Testing"

## Clarifications

### Session 2026-03-14

- Q: What must US4 bearer-token validation assert for `GET /products` under FR-008? →
  A: Assert full response-shape parity with US1, not status-only:
  1. HTTP `200`
  2. Response body contains a non-empty `data` array
  3. Response body contains a `meta` object with at least a `total` field
  4. Response body contains a `links` object
  The test MUST reuse `PaginatedResponse<Product>` from `utils/api-types.ts`
  for both unauthenticated and bearer-token product-list assertions.
  Rationale: FR-008 requires identical behavior/shape to unauthenticated access.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Product List Retrieval (Priority: P1)

An API consumer can retrieve the full product catalogue as a paginated collection.
The response confirms success and returns a structured list where every product
entry contains the minimum required fields: a unique identifier, a name, a
numeric price, and at least one product image. This is the core data access
capability from which all product-related features are built.

**Why this priority**: The product listing endpoint is the most foundational
API surface in the catalogue. All downstream consumer features — browsing,
filtering, display — depend on this contract being stable and correctly shaped.

**Independent Test**: Can be fully tested without authentication by requesting
the product list and asserting the response shape, status, and the required
fields on each product in the returned data array.

**Acceptance Scenarios**:

1. **Given** an unauthenticated consumer, **When** they request the product
   list, **Then** the API responds with a success status (HTTP 200) and a
   paginated response object containing a `data` array.
2. **Given** the product list response is received, **When** the consumer
   inspects each item in the `data` array, **Then** every product has an `id`
   (UUID), a `name` string, a numeric `price`, and at least one associated
   product image.

---

### User Story 2 — Product Detail Retrieval (Priority: P2)

An API consumer can retrieve the full detail record for a single product by
its unique identifier. The API returns the complete product data when a valid
identifier is provided, and clearly signals failure with an appropriate error
status when the identifier does not correspond to any product.

**Why this priority**: Single-product lookup is the contract that powers product
detail pages and any feature that deep-links to individual products. Both the
success case (valid ID) and the failure case (invalid ID) define the contract's
error-handling behaviour for all consumers.

**Independent Test**: Can be fully tested by obtaining a valid product UUID from
the product list response and requesting its detail record, then separately
requesting a detail record using a well-formed but non-existent UUID.

**Acceptance Scenarios**:

1. **Given** an unauthenticated consumer has a valid product UUID, **When**
   they request the detail for that product, **Then** the API responds with
   HTTP 200 and the full product record including all documented fields.
2. **Given** an unauthenticated consumer provides a UUID that does not correspond
   to any product, **When** they request that product's detail, **Then** the
   API responds with HTTP 404.

---

### User Story 3 — Authentication (Priority: P3)

An API consumer can exchange valid credentials for an access token that can be
used to authorise subsequent requests. The API rejects invalid credentials with
an appropriate error status that distinguishes authentication failure from
server error. Successful authentication returns a token in a predictable,
consumable shape.

**Why this priority**: Authentication is the gateway to any protected API surface.
Validating both the success path (token issued) and the failure path (credentials
rejected) ensures the authentication contract is reliable for all consumers
that need to make authorised requests.

**Independent Test**: Can be fully tested by submitting valid credentials and
asserting the token response, then separately submitting invalid credentials
and asserting the rejection status. No prior state is required.

**Acceptance Scenarios**:

1. **Given** a consumer submits valid credentials to the login endpoint,
   **When** the request is processed, **Then** the API responds with HTTP 200
   and a response body that includes an `access_token` string field.
2. **Given** a consumer submits invalid or unrecognised credentials to the
   login endpoint, **When** the request is processed, **Then** the API
   responds with a client error status (HTTP 401 or HTTP 422) and does not
   return an access token.

---

### User Story 4 — Category Listing and Authorised Access (Priority: P4)

An API consumer can retrieve the complete list of product categories without
authentication. Separately, a consumer holding a valid access token can request
the product list using that token as authorisation and receives the same
successful response as an unauthenticated request — confirming that bearer token
inclusion does not disrupt access to public endpoints.

**Why this priority**: Categories are foundational reference data for navigation
and filtering. The authorised-access check validates that adding authentication
headers to public endpoints does not introduce regressions — a critical
compatibility guarantee for client code that always attaches tokens.

**Independent Test**: Category listing can be tested independently with no prior
state. Authorised access to the product list requires a valid token from the
authentication endpoint (US3) as a prerequisite.

**Acceptance Scenarios**:

1. **Given** an unauthenticated consumer requests the categories endpoint,
   **When** the response is received, **Then** the API responds with HTTP 200
   and a non-empty array of category objects.
2. **Given** a consumer holds a valid access token obtained from the login
   endpoint, **When** they request the product list with that token as a
   bearer credential, **Then** the API responds with HTTP 200 and the same
   paginated response shape as an unauthenticated request (`data` non-empty,
   `meta.total` present, and `links` present).

---

### Edge Cases

- What happens when the product list is requested with an out-of-range page
  number? The response should either return an empty `data` array or an
  appropriate error — the exact behaviour is treated as observable, not
  prescribed, and is not asserted in these tests.
- What happens when `/products/{id}` is called with a value that is not a
  valid UUID format? The API may return HTTP 404 or HTTP 422; both are
  acceptable error responses. Tests use well-formed but non-existent UUIDs
  to isolate "not found" from "malformed input".
- What happens when an expired or malformed token is sent to the product list
  endpoint? The spec covers only a freshly issued valid token; expired/malformed
  token handling is out of scope.
- What happens when the API is unreachable or returns a server error? Network
  failures and HTTP 5xx responses are infrastructure concerns outside the
  contract scope of this spec.
- What if the product list returns zero items? The spec requires a non-empty
  `data` array is present in the response structure; content is asserted only
  when data is present.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The product list endpoint MUST respond with HTTP 200 for
  unauthenticated requests.
- **FR-002**: The product list response MUST include a paginated structure
  containing a `data` array of product objects.
- **FR-003**: Every product object in the `data` array MUST contain an `id`
  (UUID format), a `name` string, a numeric `price`, and at least one product
  image reference.
- **FR-004**: The product detail endpoint MUST respond with HTTP 200 and the
  complete product record when called with a valid product UUID.
- **FR-005**: The product detail endpoint MUST respond with HTTP 404 when
  called with a UUID that does not correspond to any product.
- **FR-006**: The login endpoint MUST respond with HTTP 200 and an
  `access_token` string field when called with valid credentials.
- **FR-007**: The login endpoint MUST respond with a client error status
  (HTTP 401 or HTTP 422) when called with invalid credentials, and MUST NOT
  return an access token in the response.
- **FR-008**: The product list endpoint MUST respond with HTTP 200 when called
  with a valid bearer token, returning the same structure as an unauthenticated
  request.
- **FR-009**: The categories endpoint MUST respond with HTTP 200 and a non-empty
  array for unauthenticated requests.

### Key Entities

- **Product**: The primary catalogue item. Has a UUID identifier, name,
  description, price (numeric), category association, brand association, and
  one or more product images.
- **Paginated Product List**: The collection returned by the product list
  endpoint. Wraps the `data` array in a pagination envelope (total count,
  current page, per-page limit, and navigation links).
- **Category**: A classification grouping for products. Has an identifier and
  a name. Returned as a flat array by the categories endpoint.
- **Access Token**: A credential issued upon successful authentication. Used
  as a bearer token in the Authorization header of subsequent requests.
  Has a type and an expiry duration.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The product list endpoint returns HTTP 200 with a correctly
  structured paginated response in 100% of test executions.
- **SC-002**: 100% of products in the list response contain all four required
  fields (id, name, price, image) with the correct types.
- **SC-003**: The product detail endpoint returns the correct full record for
  a valid UUID and HTTP 404 for an invalid UUID in 100% of test executions.
- **SC-004**: The login endpoint returns HTTP 200 with an `access_token` for
  valid credentials and a client error for invalid credentials in 100% of
  test executions.
- **SC-005**: The product list endpoint returns HTTP 200 and the same paginated
  response shape as US1 (`data` non-empty, `meta.total`, `links`) when
  requested with a valid bearer token in 100% of test executions.
- **SC-006**: The categories endpoint returns HTTP 200 with a non-empty array
  in 100% of test executions.

## Assumptions

- The API base URL is `https://api.practicesoftwaretesting.com`. This is a
  public test API; no environment provisioning is required.
- Tests for this feature MUST NOT use a browser. Per Constitution Principle VIII,
  API tests use only the request fixture and do not import the page object.
- The login credentials used in tests are public test credentials for this
  platform. They MUST be injected via environment variables, not hard-coded
  in test files, per Constitution Principle V.
- A valid product UUID for the detail endpoint test is obtained dynamically
  by first calling the product list endpoint and extracting an `id` from the
  response — tests do not hard-code specific UUIDs.
- The "invalid UUID" used for the 404 test is a well-formed UUID (correct
  format) that does not correspond to any real product, e.g., a fabricated
  all-zeros or all-f UUID, to distinguish "not found" from "malformed input".
- HTTP 401 and HTTP 422 are both acceptable rejection codes for invalid login
  credentials; the spec does not prescribe which one the API uses.
- Response field type assertions (e.g., `price` is numeric, `id` is a UUID
  string) are contract checks, not value checks. Specific product names or
  prices are not asserted.
