import { expect, test } from '@fixtures';
import type { AuthRequest } from '@utils/api-types';

import {
  assertAuthFailureResponse,
  assertAuthSuccessResponse,
  getApiBaseUrl,
  getValidAuthRequestBody,
  postAuthLogin,
} from './helpers';

const INVALID_CREDENTIALS: AuthRequest = {
  username: 'invalid@example.com',
  password: 'wrongpassword',
};

test.describe('Product Catalog API - Authentication', () => {
  test('Auth Login — valid credentials return access_token', async ({ request }) => {
    const apiBaseUrl = getApiBaseUrl();
    const validCredentials = getValidAuthRequestBody();

    const response = await postAuthLogin(request, apiBaseUrl, validCredentials);

    expect(response.status()).toBe(200);

    const body: unknown = await response.json();
    assertAuthSuccessResponse(body);
  });

  test('Auth Login — invalid credentials return 401 or 422', async ({ request }) => {
    const apiBaseUrl = getApiBaseUrl();
    const response = await postAuthLogin(request, apiBaseUrl, INVALID_CREDENTIALS);

    expect([401, 422]).toContain(response.status());

    const body: unknown = await response.json();
    assertAuthFailureResponse(body);
  });
});
