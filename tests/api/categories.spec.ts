import { expect, test } from '@fixtures';
import type { PaginatedResponse, Product } from '@utils/api-types';

import {
  assertAuthSuccessResponse,
  assertCategoryArrayResponse,
  parsePaginatedProductsResponse,
  getApiBaseUrl,
  getValidAuthRequestBody,
  postAuthLogin,
} from './helpers';

test.describe('Product Catalog API - Categories and Authorised Access', () => {
  test('Categories — returns 200 with non-empty array', async ({ request }) => {
    const apiBaseUrl = getApiBaseUrl();
    const response = await request.get(`${apiBaseUrl}/categories`);

    expect(response.status()).toBe(200);

    const body: unknown = await response.json();
    assertCategoryArrayResponse(body);
  });

  test('Bearer Token — product list keeps unauthenticated paginated shape', async ({ request }) => {
    const apiBaseUrl = getApiBaseUrl();
    const loginResponse = await postAuthLogin(request, apiBaseUrl, getValidAuthRequestBody());
    expect(loginResponse.status()).toBe(200);

    const loginBody: unknown = await loginResponse.json();
    assertAuthSuccessResponse(loginBody);

    const token = loginBody.access_token;

    const productsResponse = await request.get(`${apiBaseUrl}/products`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    expect(productsResponse.status()).toBe(200);

    const productsBody: unknown = await productsResponse.json();
    const paginatedProducts = parsePaginatedProductsResponse(
      productsBody,
      `${apiBaseUrl}/products`,
    );

    // Explicitly typed with PaginatedResponse<Product> for US1/US4 contract parity.
    const typedPaginatedProducts: PaginatedResponse<Product> = paginatedProducts;
    expect(typedPaginatedProducts.data.length).toBeGreaterThan(0);
    expect(typeof typedPaginatedProducts.meta.total).toBe('number');
  });
});
