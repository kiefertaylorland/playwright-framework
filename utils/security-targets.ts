import type { AuthRequest } from '@utils/api-types';

import type { SecurityCheck, SecurityTarget } from './security-report.ts';

export const SECURITY_REPORT_PATH = 'reports/security/security-summary.md';

export type PublicCredentialSource = 'public-default' | 'environment';

export interface SauceDemoSecurityCredentials {
  username: string;
  password: string;
  credentialSource: PublicCredentialSource;
}

export interface OptionalPstCredentials {
  credentials: AuthRequest | null;
  credentialSource: 'environment' | 'none';
}

export interface SecurityPayload {
  id: string;
  label: string;
  value: string;
  owaspCategory: string;
}

export const DISCOVERY_MODE = 'DISCOVERY';
export const NON_GATING = 'non-gating';
export const DEFAULT_SAUCE_BASE_URL = 'https://www.saucedemo.com';
export const DEFAULT_PST_API_URL = 'https://api.practicesoftwaretesting.com';
export const RATE_LIMIT_REQUEST_CAP = 10;
export const DEFAULT_RATE_LIMIT_ATTEMPTS = 5;

export const OWASP = {
  BROKEN_ACCESS_CONTROL: 'A01:2021 Broken Access Control',
  INJECTION: 'A03:2021 Injection',
  SECURITY_MISCONFIGURATION: 'A05:2021 Security Misconfiguration',
  VULNERABLE_COMPONENTS: 'A06:2021 Vulnerable and Outdated Components',
  AUTH_FAILURES: 'A07:2021 Identification and Authentication Failures',
  SOFTWARE_DATA_INTEGRITY: 'A08:2021 Software and Data Integrity Failures',
};

export const SECURITY_PAYLOADS: SecurityPayload[] = [
  {
    id: 'xss-script-tag',
    label: 'Harmless XSS-like string',
    value: '<script>alert("security-check")</script>',
    owaspCategory: OWASP.INJECTION,
  },
  {
    id: 'sqli-boolean',
    label: 'Harmless SQLi-like string',
    value: "' OR '1'='1",
    owaspCategory: OWASP.INJECTION,
  },
  {
    id: 'long-string',
    label: 'Long boundary string',
    value: 'SECURITY-CHECK-'.repeat(32),
    owaspCategory: OWASP.SECURITY_MISCONFIGURATION,
  },
];

export function getSauceDemoSecurityCredentials(): SauceDemoSecurityCredentials {
  const username = process.env.SAUCE_USERNAME;
  const password = process.env.SAUCE_PASSWORD;

  if (username && password) {
    return {
      username,
      password,
      credentialSource: 'environment',
    };
  }

  return {
    username: 'standard_user',
    password: 'secret_sauce',
    credentialSource: 'public-default',
  };
}

export function getPstApiBaseUrl(): string {
  return process.env.PST_API_URL ?? DEFAULT_PST_API_URL;
}

export function getOptionalPstCredentials(): OptionalPstCredentials {
  const username = process.env.PST_API_USERNAME;
  const password = process.env.PST_API_PASSWORD;

  if (!username || !password) {
    return {
      credentials: null,
      credentialSource: 'none',
    };
  }

  return {
    credentials: { username, password },
    credentialSource: 'environment',
  };
}

export function createDefaultSecurityTargets(): SecurityTarget[] {
  const sauceCredentials = getSauceDemoSecurityCredentials();
  const pstCredentials = getOptionalPstCredentials();

  return [
    {
      id: 'saucedemo',
      displayName: 'SauceDemo',
      baseUrl: DEFAULT_SAUCE_BASE_URL,
      authorizationStatus: 'public-training-target',
      credentialSource: sauceCredentials.credentialSource,
    },
    {
      id: 'practice-software-testing',
      displayName: 'Practice Software Testing',
      baseUrl: getPstApiBaseUrl(),
      authorizationStatus: pstCredentials.credentials
        ? 'configured-credentials'
        : 'credentials-missing',
      credentialSource: pstCredentials.credentialSource,
    },
    {
      id: 'repository',
      displayName: 'Local Repository',
      authorizationStatus: 'local-repository',
      credentialSource: 'none',
    },
  ];
}

export function createSecurityCheck(
  check: Omit<SecurityCheck, 'mode'>,
): SecurityCheck {
  return {
    ...check,
    mode: DISCOVERY_MODE,
  };
}
