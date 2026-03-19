/**
 * OWASP A03 Injection Test Payloads
 * Used for XSS and SQL Injection security testing
 */

/**
 * XSS Payload List - Common cross-site scripting attack vectors
 * These are used to test HTML escaping and sanitization
 */
export const XSS_PAYLOADS = [
  '<script>alert("XSS")</script>',
  '<img src=x onerror="alert(\'XSS\')">',
  '"><script>alert("XSS")</script>',
  '<svg onload=alert("XSS")>',
  'javascript:alert("XSS")',
] as const;

/**
 * SQL Injection Payload List - Common SQL injection attack vectors
 * These are used to test input sanitization and prepared statements
 */
export const SQLI_PAYLOADS = [
  "' OR '1'='1",
  "'; DROP TABLE users; --",
  "1' UNION SELECT NULL,NULL,NULL--",
  "admin' --",
  "' OR 1=1 --",
] as const;

/**
 * Security Header Values - Expected values for security headers
 */
export const SECURITY_HEADERS = {
  CONTENT_TYPE_OPTIONS: 'nosniff',
  CACHE_CONTROL: 'no-store, no-cache, must-revalidate, proxy-revalidate',
  X_FRAME_OPTIONS: 'DENY',
  CONTENT_SECURITY_POLICY: "default-src 'self'",
} as const;
