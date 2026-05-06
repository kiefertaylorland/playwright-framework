import { test, expect } from '@fixtures';
import {
  createDefaultSecurityTargets,
  createSecurityCheck,
  DEFAULT_RATE_LIMIT_ATTEMPTS,
  getOptionalPstCredentials,
  getPstApiBaseUrl,
  OWASP,
  RATE_LIMIT_REQUEST_CAP,
  SECURITY_PAYLOADS,
} from '@utils/security-targets';
import {
  annotateFindings,
  appendSecurityReport,
  createFinding,
  type SecurityFinding,
} from '@utils/security-report';

type ApiObservation = {
  status: number;
  bodyPreview: string;
};

test.use({ storageState: undefined });

test.describe('Practice Software Testing API Security Discovery', () => {
  test('records public payload handling observations', async ({ request }, testInfo) => {
    const baseUrl = getPstApiBaseUrl();
    const check = createSecurityCheck({
      id: 'pst-public-payloads',
      targetId: 'practice-software-testing',
      category: 'input-sanitization',
      owaspCategory: OWASP.INJECTION,
    });
    const findings: SecurityFinding[] = [];

    for (const payload of SECURITY_PAYLOADS) {
      const observation = await observeGet(
        request,
        `${baseUrl}/products?search=${encodeURIComponent(payload.value)}`,
      );
      const reflected = observation.bodyPreview.includes(payload.value);
      const serverError = observation.status >= 500;

      findings.push(
        createFinding({
          id: `pst-public-payload-${payload.id}`,
          severity: reflected || serverError ? 'MEDIUM' : 'INFO',
          targetId: 'practice-software-testing',
          checkId: check.id,
          title: `PST public products query handled ${payload.label}`,
          status: reflected || serverError ? 'review-needed' : 'observed',
          owaspCategory: payload.owaspCategory,
          evidence: `status=${String(observation.status)}; reflected=${String(reflected)}; serverError=${String(serverError)}; bodyPreview=${observation.bodyPreview}`,
          nextAction: reflected || serverError
            ? 'Review public query input handling and response encoding'
            : 'Keep as Discovery Mode baseline observation',
        }),
      );
    }

    annotateFindings(testInfo, findings);
    await appendSecurityReport({
      targets: createDefaultSecurityTargets(),
      checks: [check],
      findings,
    });

    expect(findings).toHaveLength(SECURITY_PAYLOADS.length);
  });

  test('records unauthenticated protected-resource access observations', async ({
    request,
  }, testInfo) => {
    const baseUrl = getPstApiBaseUrl();
    const check = createSecurityCheck({
      id: 'pst-unauthenticated-access',
      targetId: 'practice-software-testing',
      category: 'access-control',
      owaspCategory: OWASP.BROKEN_ACCESS_CONTROL,
    });
    const protectedPaths = ['/users/me', '/user', '/favorites', '/orders'];
    const findings: SecurityFinding[] = [];

    for (const protectedPath of protectedPaths) {
      const observation = await observeGet(request, `${baseUrl}${protectedPath}`);
      const rejected = [401, 403, 404, 405].includes(observation.status);

      findings.push(
        createFinding({
          id: `pst-unauthenticated-${sanitizeId(protectedPath)}`,
          severity: rejected ? 'INFO' : 'HIGH',
          targetId: 'practice-software-testing',
          checkId: check.id,
          title: `PST unauthenticated access check for ${protectedPath}`,
          status: rejected ? 'observed' : 'review-needed',
          owaspCategory: OWASP.BROKEN_ACCESS_CONTROL,
          evidence: `path=${protectedPath}; status=${String(observation.status)}; rejected=${String(rejected)}; bodyPreview=${observation.bodyPreview}`,
          nextAction: rejected
            ? 'Keep as unauthenticated access-control baseline'
            : 'Review whether this endpoint should allow unauthenticated access',
        }),
      );
    }

    annotateFindings(testInfo, findings);
    await appendSecurityReport({
      targets: createDefaultSecurityTargets(),
      checks: [check],
      findings,
    });

    expect(findings.length).toBeGreaterThan(0);
  });

  test('records optional authenticated coverage or skipped credentials', async ({
    request,
  }, testInfo) => {
    const baseUrl = getPstApiBaseUrl();
    const optionalCredentials = getOptionalPstCredentials();
    const check = createSecurityCheck({
      id: 'pst-optional-authenticated',
      targetId: 'practice-software-testing',
      category: 'authentication-session',
      owaspCategory: OWASP.AUTH_FAILURES,
    });
    const findings: SecurityFinding[] = [];

    if (!optionalCredentials.credentials) {
      findings.push(
        createFinding({
          id: 'pst-authenticated-coverage-skipped',
          severity: 'INFO',
          targetId: 'practice-software-testing',
          checkId: check.id,
          title: 'PST authenticated checks skipped',
          status: 'skipped',
          owaspCategory: OWASP.AUTH_FAILURES,
          evidence: 'PST_API_USERNAME or PST_API_PASSWORD is not configured',
          nextAction: 'Configure optional PST credentials to enable authenticated checks',
        }),
      );
    } else {
      const loginObservation = await observePost(request, `${baseUrl}/auth/login`, {
        username: optionalCredentials.credentials.username,
        password: optionalCredentials.credentials.password,
      });
      findings.push(
        createFinding({
          id: 'pst-authenticated-login-observed',
          severity: loginObservation.status === 200 ? 'INFO' : 'MEDIUM',
          targetId: 'practice-software-testing',
          checkId: check.id,
          title: 'PST authenticated login behavior observed',
          status: loginObservation.status === 200 ? 'observed' : 'review-needed',
          owaspCategory: OWASP.AUTH_FAILURES,
          evidence: `status=${String(loginObservation.status)}; bodyPreview=${loginObservation.bodyPreview}`,
          nextAction: loginObservation.status === 200
            ? 'Use this as baseline for future authenticated input checks'
            : 'Review credential configuration or authentication behavior',
        }),
      );
    }

    annotateFindings(testInfo, findings);
    await appendSecurityReport({
      targets: createDefaultSecurityTargets(),
      checks: [check],
      findings,
    });

    expect(findings.length).toBeGreaterThan(0);
  });

  test('records conservative repeated-request observations', async ({
    request,
  }, testInfo) => {
    const baseUrl = getPstApiBaseUrl();
    const attempts = Math.min(DEFAULT_RATE_LIMIT_ATTEMPTS, RATE_LIMIT_REQUEST_CAP);
    const check = createSecurityCheck({
      id: 'pst-rate-limit-observation',
      targetId: 'practice-software-testing',
      category: 'rate-limit-observation',
      owaspCategory: OWASP.AUTH_FAILURES,
      safeLimit: RATE_LIMIT_REQUEST_CAP,
    });
    const statuses: number[] = [];

    for (let index = 0; index < attempts; index += 1) {
      const observation = await observePost(request, `${baseUrl}/auth/login`, {
        username: `invalid-security-${String(index)}@example.test`,
        password: 'invalid-security-password',
      });
      statuses.push(observation.status);
    }

    const throttlingObserved = statuses.some((status) => status === 429);
    const findings = [
      createFinding({
        id: 'pst-login-rate-limit-observation',
        severity: throttlingObserved ? 'INFO' : 'LOW',
        targetId: 'practice-software-testing',
        checkId: check.id,
        title: 'PST login repeated-request behavior observed',
        status: 'observed',
        owaspCategory: OWASP.AUTH_FAILURES,
        evidence: `attempts=${String(attempts)}; statuses=${statuses.join(',')}; throttlingObserved=${String(throttlingObserved)}`,
        nextAction: throttlingObserved
          ? 'Document observed throttling behavior for future enforcement criteria'
          : 'Review whether login throttling should be visible for repeated invalid attempts',
      }),
    ];

    annotateFindings(testInfo, findings);
    await appendSecurityReport({
      targets: createDefaultSecurityTargets(),
      checks: [check],
      findings,
    });

    expect(attempts).toBeLessThanOrEqual(RATE_LIMIT_REQUEST_CAP);
  });
});

async function observeGet(
  request: { get: (url: string) => Promise<{ status: () => number; text: () => Promise<string> }> },
  url: string,
): Promise<ApiObservation> {
  try {
    const response = await request.get(url);
    return {
      status: response.status(),
      bodyPreview: truncate(await response.text()),
    };
  } catch (error) {
    return {
      status: 0,
      bodyPreview: error instanceof Error ? error.message : 'Unknown request error',
    };
  }
}

async function observePost(
  request: {
    post: (
      url: string,
      options: { data: Record<string, string> },
    ) => Promise<{ status: () => number; text: () => Promise<string> }>;
  },
  url: string,
  data: Record<string, string>,
): Promise<ApiObservation> {
  try {
    const response = await request.post(url, { data });
    return {
      status: response.status(),
      bodyPreview: truncate(await response.text()),
    };
  } catch (error) {
    return {
      status: 0,
      bodyPreview: error instanceof Error ? error.message : 'Unknown request error',
    };
  }
}

function truncate(value: string): string {
  return value.replace(/\s+/g, ' ').slice(0, 240);
}

function sanitizeId(value: string): string {
  return value.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
}
