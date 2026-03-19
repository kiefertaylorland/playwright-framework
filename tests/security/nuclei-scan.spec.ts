/**
 * OWASP Security Testing with Nuclei Scanning
 * US8: Perform Nuclei vulnerability scanning and report findings
 *
 * This test reads Nuclei results from reports/nuclei-results.json
 * Skip if NUCLEI_SKIP environment variable is set
 */

import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@fixtures';
import {
  readNucleiResults,
  filterFindingsBySeverity,
  generateFindingsSummary,
  NucleiSeverity,
} from '@utils/nuclei-helper';

/**
 * US8: Nuclei Scanning
 * Tests that security scanning with Nuclei captures findings and reports no critical/high results
 */
test.describe('Security Testing - Nuclei Vulnerability Scanning (US8)', () => {
  // Skip entire suite if NUCLEI_SKIP is set
  test.skip(!!process.env.NUCLEI_SKIP, 'Nuclei scanning tests skipped (NUCLEI_SKIP=1)');

  const RESULTS_FILE = path.resolve(process.cwd(), 'reports/nuclei-results.json');

  test('Nuclei results file exists and is non-empty', () => {
    // Verify file exists
    expect(fs.existsSync(RESULTS_FILE)).toBe(true);

    // Verify file has content
    const stats = fs.statSync(RESULTS_FILE);
    expect(stats.size).toBeGreaterThan(0);
  });

  test('Nuclei results file is valid JSONL with expected structure', () => {
    // Parse the JSONL file
    const findings = readNucleiResults(RESULTS_FILE);

    // Verify findings array is valid (may be empty if no issues found)
    expect(Array.isArray(findings)).toBe(true);

    // If findings exist, verify each has required fields
    for (const finding of findings) {
      expect(finding['template-id']).toBeTruthy();
      expect(finding['matched-at']).toBeTruthy();
      expect(finding.info).toBeTruthy();
      expect(finding.info.name).toBeTruthy();
      expect(finding.info.severity).toBeTruthy();
    }
  });

  test('Nuclei has no Critical or High severity findings', () => {
    // Read and parse Nuclei results
    const findings = readNucleiResults(RESULTS_FILE);

    // Filter for Critical and High severity findings
    const criticalHighFindings = filterFindingsBySeverity(findings, NucleiSeverity.High);

    // Generate error message if critical/high findings found
    if (criticalHighFindings.length > 0) {
      const summary = generateFindingsSummary(criticalHighFindings);
      throw new Error(`Security findings detected:\n${summary}`);
    }

    // Verify no critical or high severity findings
    expect(criticalHighFindings).toHaveLength(0);
  });
});
