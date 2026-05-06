import fs from 'node:fs/promises';

import { test, expect } from '@fixtures';
import {
  createDefaultSecurityTargets,
  createSecurityCheck,
  OWASP,
} from '@utils/security-targets';
import {
  createFinding,
  createSecurityRun,
  writeSecurityReport,
} from '@utils/security-report';

test.use({ storageState: undefined });

test.describe('Security Discovery Report', () => {
  test('writes required Discovery Mode report sections', async ({ page }, testInfo) => {
    expect(page).toBeDefined();
    const targets = createDefaultSecurityTargets();
    const checks = [
      createSecurityCheck({
        id: 'report-integrity',
        targetId: 'repository',
        category: 'report-integrity',
        owaspCategory: 'N/A',
      }),
    ];
    const findings = [
      createFinding({
        id: 'report-sample-observed',
        severity: 'INFO',
        targetId: 'repository',
        checkId: 'report-integrity',
        title: 'Sample observed finding',
        status: 'observed',
        owaspCategory: OWASP.SOFTWARE_DATA_INTEGRITY,
        evidence: 'Sample evidence for report generation',
        nextAction: 'Use this row to validate report rendering',
      }),
      createFinding({
        id: 'report-sample-skipped',
        severity: 'INFO',
        targetId: 'practice-software-testing',
        checkId: 'report-integrity',
        title: 'Sample skipped coverage',
        status: 'skipped',
        evidence: 'PST credentials were not configured for sample run',
        nextAction: 'Configure optional credentials to expand coverage',
      }),
    ];

    const reportPath = testInfo.outputPath('security-summary.md');

    await writeSecurityReport(createSecurityRun({ targets, checks, findings }), {
      reportPath,
    });

    const report = await fs.readFile(reportPath, 'utf8');

    expect(report).toContain('# Security Summary');
    expect(report).toContain('**Mode**: DISCOVERY');
    expect(report).toContain('**Gating policy**: non-gating Discovery Mode findings');
    expect(report).toContain('## Target Configuration');
    expect(report).toContain('## Findings Summary');
    expect(report).toContain('## Detailed Findings');
    expect(report).toContain('## Skipped Coverage');
    expect(report).toContain('## Graduation Path To Enforcement Mode');
    expect(report).toContain('A08:2021 Software and Data Integrity Failures');
  });

  test('redacts sensitive values before writing the report', async ({ page }, testInfo) => {
    expect(page).toBeDefined();
    const checks = [
      createSecurityCheck({
        id: 'report-redaction',
        targetId: 'repository',
        category: 'report-integrity',
        owaspCategory: 'N/A',
      }),
    ];
    const findings = [
      createFinding({
        id: 'report-redaction-sample',
        severity: 'LOW',
        targetId: 'repository',
        checkId: 'report-redaction',
        title: 'Sample sensitive evidence',
        status: 'review-needed',
        evidence:
          'password=super-secret Authorization: Bearer abc.def.ghi "access_token":"token-value" sessionId=session-value',
        nextAction: 'Verify redaction before publishing',
      }),
    ];

    const reportPath = testInfo.outputPath('security-summary.md');

    await writeSecurityReport(createSecurityRun({ checks, findings }), {
      reportPath,
    });

    const report = await fs.readFile(reportPath, 'utf8');

    expect(report).not.toContain('super-secret');
    expect(report).not.toContain('abc.def.ghi');
    expect(report).not.toContain('token-value');
    expect(report).not.toContain('session-value');
    expect(report).toContain('[REDACTED]');
  });
});
