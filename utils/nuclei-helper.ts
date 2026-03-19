/**
 * Nuclei Security Scanning Helper Utilities
 * Used for parsing Nuclei JSONL results and validating finding severity
 */

import fs from 'node:fs';

/**
 * Nuclei Finding Severity Levels
 * 0 = Info, 1 = Low, 2 = Medium, 3 = High, 4 = Critical
 */
export enum NucleiSeverity {
  Info = 0,
  Low = 1,
  Medium = 2,
  High = 3,
  Critical = 4,
}

/**
 * Nuclei Raw Finding Interface
 * Represents a single security finding from Nuclei (with hyphenated keys from JSONL)
 */
export interface NucleiRawFinding {
  'template-id': string;
  'matched-at': string;
  type?: string;
  host?: string;
  info: {
    name: string;
    severity: string;
    tags?: string[];
    description?: string;
  };
}

/**
 * Read and parse Nuclei JSONL results file
 * JSONL format: one JSON object per line (not a JSON array)
 * @param filePath - Path to nuclei-results.json file
 * @returns Array of parsed findings
 */
export function readNucleiResults(filePath: string): NucleiRawFinding[] {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Nuclei results file not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf-8').trim();
  if (!content) {
    return [];
  }

  // Split on newlines and parse each line as JSON
  const findings: NucleiRawFinding[] = [];
  const lines = content.split('\n').filter((line: string) => line.trim());

  for (const line of lines) {
    try {
      const finding = JSON.parse(line) as NucleiRawFinding;
      findings.push(finding);
    } catch {
      throw new Error(`Invalid JSON in Nuclei results: ${line}`);
    }
  }

  return findings;
}

/**
 * Convert Nuclei severity string to enum level
 * @param severity - Severity string (e.g., "critical", "high", "medium", "low", "info")
 * @returns NucleiSeverity enum value
 */
function severityStringToLevel(severity: string): NucleiSeverity {
  const normalized = severity.toLowerCase();
  switch (normalized) {
    case 'critical':
      return NucleiSeverity.Critical;
    case 'high':
      return NucleiSeverity.High;
    case 'medium':
      return NucleiSeverity.Medium;
    case 'low':
      return NucleiSeverity.Low;
    case 'info':
      return NucleiSeverity.Info;
    default:
      return NucleiSeverity.Info;
  }
}

/**
 * Filter findings by minimum severity level
 * @param findings - Array of Nuclei findings
 * @param minSeverity - Minimum severity level to include
 * @returns Filtered findings
 */
export function filterFindingsBySeverity(
  findings: NucleiRawFinding[],
  minSeverity: NucleiSeverity
): NucleiRawFinding[] {
  return findings.filter((finding) => {
    const level = severityStringToLevel(finding.info.severity);
    return level >= minSeverity;
  });
}

/**
 * Format finding details for error messages
 * @param finding - Nuclei finding to format
 * @returns Formatted finding string
 */
export function formatFindingDetails(finding: NucleiRawFinding): string {
  const severity = finding.info.severity.toUpperCase();
  const name = finding.info.name;
  const templateId = finding['template-id'];
  const matchedAt = finding['matched-at'];

  return `[${severity}] ${name} (${templateId})\n  Found at: ${matchedAt}`;
}

/**
 * Generate summary of critical/high findings for error reporting
 * @param findings - Array of high/critical findings
 * @returns Formatted summary string
 */
export function generateFindingsSummary(findings: NucleiRawFinding[]): string {
  if (findings.length === 0) {
    return 'No critical or high severity findings detected.';
  }

  const lines = [
    `Found ${findings.length} critical/high severity finding(s):`,
    ...findings.map((finding, index) => `\n${index + 1}. ${formatFindingDetails(finding)}`),
  ];

  return lines.join('');
}
