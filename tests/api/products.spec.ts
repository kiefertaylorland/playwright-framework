import { expect, test } from '@fixtures';
import {
  NIL_UUID,
  type PaginatedResponse,
  type Product,
} from '@utils/api-types';

import {
  parsePaginatedProductsResponse,
  assertProductContract,
  getApiBaseUrl,
} from './helpers';

test.describe('Product Catalog API - Products', () => {
  test('Product List — returns 200 with paginated data', async ({ request }) => {
    const apiBaseUrl = getApiBaseUrl();
    const response = await request.get(`${apiBaseUrl}/products`);

    expect(response.status()).toBe(200);

    const body: unknown = await response.json();
    const paginatedProducts = parsePaginatedProductsResponse(body, `${apiBaseUrl}/products`);

    expect(paginatedProducts.data.length).toBeGreaterThan(0);
    expect(typeof paginatedProducts.meta.total).toBe('number');
    expect(typeof paginatedProducts.links).toBe('object');
  });

  test('Product List — every item has id, name, price, image', async ({ request }) => {
    const apiBaseUrl = getApiBaseUrl();
    const response = await request.get(`${apiBaseUrl}/products`);

    expect(response.status()).toBe(200);

    const body: unknown = await response.json();
    const paginatedProducts = parsePaginatedProductsResponse(body, `${apiBaseUrl}/products`);

    const typedPaginatedProducts: PaginatedResponse<Product> = paginatedProducts;

    for (const product of typedPaginatedProducts.data) {
      assertProductContract(product);
    }
  });

  test('Product Detail — valid UUID returns 200 with full record', async ({ request }) => {
    const apiBaseUrl = getApiBaseUrl();
    const listResponse = await request.get(`${apiBaseUrl}/products`);
    expect(listResponse.status()).toBe(200);

    const listBody: unknown = await listResponse.json();
    const paginatedProducts = parsePaginatedProductsResponse(listBody, `${apiBaseUrl}/products`);

    const typedPaginatedProducts: PaginatedResponse<Product> = paginatedProducts;
    const validId = typedPaginatedProducts.data[0].id;

    expect(validId.trim().length).toBeGreaterThan(0);

    const detailResponse = await request.get(`${apiBaseUrl}/products/${validId}`);
    expect(detailResponse.status()).toBe(200);

    const detailBody: unknown = await detailResponse.json();
    assertProductContract(detailBody);

    const product: Product = detailBody;
    expect(product.id).toBe(validId);
  });

  test('Product Detail — nil UUID returns 404', async ({ request }) => {
    const response = await request.get(`${getApiBaseUrl()}/products/${NIL_UUID}`);

    expect(response.status()).toBe(404);
  });
});
