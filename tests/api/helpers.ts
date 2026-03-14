import { expect } from '@fixtures';
import {
  ULID_PATTERN,
  UUID_PATTERN,
  type AuthRequest,
  type AuthResponse,
  type Category,
  type PaginationLinks,
  type PaginationMeta,
  type PaginatedResponse,
  type Product,
} from '@utils/api-types';

type JsonRecord = Record<string, unknown>;
type ApiResponseLike = {
  status: () => number;
  json: () => Promise<unknown>;
};
type ApiRequestLike = {
  post: (
    url: string,
    options?: {
      data?: unknown;
      headers?: Record<string, string>;
    },
  ) => Promise<ApiResponseLike>;
};

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null;
}

function getRequiredEnvVar(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }

  return value;
}

export function getApiBaseUrl(): string {
  return getRequiredEnvVar('PST_API_URL');
}

export function getValidAuthRequestBody(): AuthRequest {
  return {
    username: getRequiredEnvVar('PST_API_USERNAME'),
    password: getRequiredEnvVar('PST_API_PASSWORD'),
  };
}

function isSupportedResourceId(value: string): boolean {
  return UUID_PATTERN.test(value) || ULID_PATTERN.test(value);
}

export function assertProductContract(value: unknown): asserts value is Product {
  expect(isRecord(value)).toBe(true);
  if (!isRecord(value)) {
    throw new Error('Expected product payload to be an object');
  }

  expect(typeof value.id).toBe('string');
  if (typeof value.id !== 'string') {
    throw new Error('Expected product.id to be a string');
  }
  expect(isSupportedResourceId(value.id)).toBe(true);

  expect(typeof value.name).toBe('string');
  if (typeof value.name !== 'string') {
    throw new Error('Expected product.name to be a string');
  }
  expect(value.name.trim().length).toBeGreaterThan(0);

  expect(typeof value.description).toBe('string');
  expect(typeof value.price).toBe('number');

  const categoryId = typeof value.category_id === 'string'
    ? value.category_id
    : isRecord(value.category) && typeof value.category.id === 'string'
      ? value.category.id
      : null;
  expect(categoryId).not.toBeNull();
  if (categoryId === null) {
    throw new Error('Expected product.category_id or product.category.id to be present');
  }
  expect(isSupportedResourceId(categoryId)).toBe(true);

  const brandId = typeof value.brand_id === 'string'
    ? value.brand_id
    : isRecord(value.brand) && typeof value.brand.id === 'string'
      ? value.brand.id
      : null;
  expect(brandId).not.toBeNull();
  if (brandId === null) {
    throw new Error('Expected product.brand_id or product.brand.id to be present');
  }
  expect(isSupportedResourceId(brandId)).toBe(true);

  const productImage = value.product_image;
  const hasImageArray = Array.isArray(productImage) && productImage.length >= 1;
  const hasImageObject = isRecord(productImage);
  expect(hasImageArray || hasImageObject).toBe(true);
  if (!(hasImageArray || hasImageObject)) {
    throw new Error('Expected product.product_image to be a non-empty array or object');
  }
}

function isMetaShape(value: unknown): value is PaginationMeta {
  return isRecord(value) && typeof value.total === 'number';
}

function isLinksShape(value: unknown): value is PaginationLinks {
  return isRecord(value);
}

export function parsePaginatedProductsResponse(
  value: unknown,
  fallbackPath: string,
): PaginatedResponse<Product> {
  expect(isRecord(value)).toBe(true);
  if (!isRecord(value)) {
    throw new Error('Expected paginated response to be an object');
  }

  const data = value.data;
  expect(Array.isArray(data)).toBe(true);
  if (!Array.isArray(data)) {
    throw new Error('Expected response.data to be an array');
  }
  expect(data.length).toBeGreaterThan(0);

  if (isMetaShape(value.meta) && isLinksShape(value.links)) {
    const parsed: PaginatedResponse<Product> = {
      data: data as Product[],
      meta: value.meta,
      links: value.links,
    };
    return parsed;
  }

  // Legacy shape compatibility: pagination fields are at top-level.
  const currentPage = value.current_page;
  const from = value.from;
  const lastPage = value.last_page;
  const perPage = value.per_page;
  const to = value.to;
  const total = value.total;
  const hasLegacyPagination =
    typeof currentPage === 'number' &&
    typeof from === 'number' &&
    typeof lastPage === 'number' &&
    typeof perPage === 'number' &&
    typeof to === 'number' &&
    typeof total === 'number';

  expect(hasLegacyPagination).toBe(true);
  if (!hasLegacyPagination) {
    throw new Error('Expected response to have meta/links or legacy top-level pagination fields');
  }

  const meta: PaginationMeta = {
    current_page: currentPage,
    from,
    last_page: lastPage,
    path: fallbackPath,
    per_page: perPage,
    to,
    total,
  };

  const links: PaginationLinks = {
    first: null,
    last: null,
    prev: null,
    next: null,
  };

  return {
    data: data as Product[],
    meta,
    links,
  };
}

export function assertCategoryArrayResponse(value: unknown): asserts value is Category[] {
  expect(Array.isArray(value)).toBe(true);
  if (!Array.isArray(value)) {
    throw new Error('Expected categories response to be an array');
  }

  expect(value.length).toBeGreaterThan(0);
  for (const category of value) {
    expect(isRecord(category)).toBe(true);
    if (!isRecord(category)) {
      throw new Error('Expected each category entry to be an object');
    }

    expect(typeof category.id).toBe('string');
    expect(typeof category.name).toBe('string');
    if (typeof category.name === 'string') {
      expect(category.name.trim().length).toBeGreaterThan(0);
    }
  }
}

export function assertAuthSuccessResponse(value: unknown): asserts value is AuthResponse {
  expect(isRecord(value)).toBe(true);
  if (!isRecord(value)) {
    throw new Error('Expected auth response to be an object');
  }

  expect(typeof value.access_token).toBe('string');
  if (typeof value.access_token !== 'string') {
    throw new Error('Expected access_token to be a string');
  }
  expect(value.access_token.trim().length).toBeGreaterThan(0);
}

export function assertAuthFailureResponse(value: unknown): void {
  if (!isRecord(value)) {
    return;
  }

  expect(value.access_token).toBeUndefined();
}

export async function postAuthLogin(
  request: ApiRequestLike,
  baseUrl: string,
  credentials: AuthRequest,
): Promise<ApiResponseLike> {
  const primaryResponse = await request.post(`${baseUrl}/auth/login`, {
    data: credentials,
  });

  if (primaryResponse.status() !== 404) {
    return primaryResponse;
  }

  return request.post(`${baseUrl}/users/login`, {
    data: {
      email: credentials.username,
      password: credentials.password,
    },
  });
}
