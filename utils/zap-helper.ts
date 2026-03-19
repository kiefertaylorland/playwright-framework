/**
 * OWASP ZAP API Helper Utilities
 * Used for parsing ZAP REST API responses and validating alert severity
 */

/**
 * ZAP Alert Severity Levels
 * 0 = Informational, 1 = Low, 2 = Medium, 3 = High, 4 = Critical
 */
export enum ZapRiskLevel {
  Informational = 0,
  Low = 1,
  Medium = 2,
  High = 3,
  Critical = 4,
}

/**
 * ZAP Alert Interface
 * Represents a single security alert from ZAP
 */
export interface ZapAlert {
  pluginId: string;
  alertId: string;
  alert: string;
  description: string;
  instances: Array<{
    uri: string;
    method: string;
    evidence: string;
  }>;
  riskId: string;
  riskDesc: string;
  confidence: string;
  confidenceId: string;
  cweid: string;
  wascid: string;
  sourceId: string;
}

/**
 * ZAP Alerts Response
 * Structure returned by ZAP REST API /JSON/core/view/alerts/
 */
export interface ZapAlertsResponse {
  alerts: ZapAlert[];
}

/**
 * Parse and validate ZAP REST API response
 * @param response - Raw response from ZAP API
 * @returns Parsed alerts with severity filtering capability
 */
export function parseZapResponse(response: unknown): ZapAlertsResponse {
  if (typeof response !== 'object' || response === null) {
    throw new Error('Invalid ZAP response: expected object');
  }

  const data = response as Record<string, unknown>;
  if (!Array.isArray(data.alerts)) {
    throw new Error('Invalid ZAP response: missing alerts array');
  }

  return {
    alerts: (data.alerts as unknown[]).map((alert) => {
      if (typeof alert !== 'object' || alert === null) {
        throw new Error('Invalid alert structure');
      }
      return alert as ZapAlert;
    }),
  };
}

/**
 * Filter alerts by minimum risk level
 * @param alerts - Array of ZAP alerts
 * @param minRiskLevel - Minimum risk level to include (e.g., ZapRiskLevel.High for Critical and High only)
 * @returns Filtered alerts
 */
export function filterAlertsByRisk(alerts: ZapAlert[], minRiskLevel: ZapRiskLevel): ZapAlert[] {
  return alerts.filter((alert) => {
    const alertRiskId = parseInt(alert.riskId, 10);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    return alertRiskId >= minRiskLevel;
  });
}

/**
 * Format alert details for error messages
 * @param alert - ZAP alert to format
 * @returns Formatted alert string
 */
export function formatAlertDetails(alert: ZapAlert): string {
  const instanceInfo =
    alert.instances && alert.instances.length > 0
      ? `\n  First Instance: ${alert.instances[0].uri}`
      : '';

  return `[${alert.riskDesc}] ${alert.alert}: ${alert.description}${instanceInfo}`;
}

/**
 * Generate summary of critical/high alerts for error reporting
 * @param alerts - Array of high/critical alerts
 * @returns Formatted summary string
 */
export function generateAlertSummary(alerts: ZapAlert[]): string {
  if (alerts.length === 0) {
    return 'No critical or high severity alerts found.';
  }

  const lines = [
    `Found ${alerts.length} critical/high severity alert(s):`,
    ...alerts.map((alert, index) => `\n${index + 1}. ${formatAlertDetails(alert)}`),
  ];

  return lines.join('');
}
