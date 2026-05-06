import { spawnSync } from 'node:child_process';

import {
  appendSecurityReport,
  createFinding,
  type SecurityFinding,
} from '../utils/security-report.ts';
import {
  createDefaultSecurityTargets,
  createSecurityCheck,
  OWASP,
} from '../utils/security-targets.ts';

type AuditAdvisory = {
  name: string;
  severity: 'high' | 'critical';
  title: string;
  fixAvailable: string;
};

async function main(): Promise<void> {
  if (process.argv.includes('--self-check')) {
    runSelfCheck();
  }

  const check = createSecurityCheck({
    id: 'repository-npm-audit',
    targetId: 'repository',
    category: 'dependency-audit',
    owaspCategory: OWASP.VULNERABLE_COMPONENTS,
  });
  const auditOutput = spawnSync('npm', ['audit', '--audit-level=high', '--json'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
  const findings = mapAuditOutputToFindings(
    auditOutput.stdout,
    auditOutput.stderr,
    check.id,
  );

  await appendSecurityReport({
    targets: createDefaultSecurityTargets(),
    checks: [check],
    findings,
  });
}

function mapAuditOutputToFindings(
  stdout: string,
  stderr: string,
  checkId: string,
): SecurityFinding[] {
  const parsed = parseJson(stdout);

  if (!parsed) {
    return [
      createFinding({
        id: 'npm-audit-infrastructure-uncertain',
        severity: 'INFO',
        targetId: 'repository',
        checkId,
        title: 'npm audit output could not be parsed',
        status: 'infrastructure-uncertain',
        owaspCategory: OWASP.VULNERABLE_COMPONENTS,
        evidence: `stderr=${stderr.slice(0, 240)}`,
        nextAction: 'Review npm audit execution and package manager output',
      }),
    ];
  }

  if (!isRecord(parsed.vulnerabilities) && (parsed.error || parsed.message)) {
    return [
      createFinding({
        id: 'npm-audit-infrastructure-uncertain',
        severity: 'INFO',
        targetId: 'repository',
        checkId,
        title: 'npm audit could not reach advisory data',
        status: 'infrastructure-uncertain',
        owaspCategory: OWASP.VULNERABLE_COMPONENTS,
        evidence: `message=${formatUnknown(parsed.message)}; stderr=${stderr.slice(0, 240)}`,
        nextAction: 'Rerun dependency audit when registry access is available',
      }),
    ];
  }

  const advisories = extractHighRiskAdvisories(parsed);
  if (advisories.length === 0) {
    return [
      createFinding({
        id: 'npm-audit-no-high-critical',
        severity: 'INFO',
        targetId: 'repository',
        checkId,
        title: 'No high or critical npm advisories reported',
        status: 'observed',
        owaspCategory: OWASP.VULNERABLE_COMPONENTS,
        evidence: 'npm audit returned no high or critical advisory entries',
        nextAction: 'Continue dependency monitoring in Discovery Mode',
      }),
    ];
  }

  return advisories.map((advisory) =>
    createFinding({
      id: `npm-audit-${sanitizeId(advisory.name)}-${advisory.severity}`,
      severity: advisory.severity === 'critical' ? 'CRITICAL' : 'HIGH',
      targetId: 'repository',
      checkId,
      title: `npm ${advisory.severity} advisory: ${advisory.name}`,
      status: 'review-needed',
      owaspCategory: OWASP.VULNERABLE_COMPONENTS,
      evidence: `package=${advisory.name}; title=${advisory.title}; fixAvailable=${advisory.fixAvailable}`,
      nextAction: 'Review advisory and apply package update or documented exception',
    }),
  );
}

function extractHighRiskAdvisories(parsed: unknown): AuditAdvisory[] {
  if (!isRecord(parsed) || !isRecord(parsed.vulnerabilities)) {
    return [];
  }

  const advisories: AuditAdvisory[] = [];
  for (const [name, value] of Object.entries(parsed.vulnerabilities)) {
    if (!isRecord(value)) {
      continue;
    }
    const severity = value.severity;
    if (severity !== 'high' && severity !== 'critical') {
      continue;
    }
    advisories.push({
      name,
      severity,
      title: typeof value.name === 'string' ? value.name : name,
      fixAvailable: formatFixAvailable(value.fixAvailable),
    });
  }

  return advisories;
}

function formatFixAvailable(value: unknown): string {
  if (typeof value === 'boolean') {
    return String(value);
  }
  if (isRecord(value) && typeof value.name === 'string') {
    return value.name;
  }
  return 'unknown';
}

function formatUnknown(value: unknown): string {
  return typeof value === 'string' ? value.slice(0, 240) : 'N/A';
}

function parseJson(value: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(value);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function runSelfCheck(): void {
  const emptyFindings = mapAuditOutputToFindings(
    '{"vulnerabilities":{}}',
    '',
    'self-check',
  );
  const highFindings = mapAuditOutputToFindings(
    '{"vulnerabilities":{"demo":{"severity":"high","name":"demo","fixAvailable":true}}}',
    '',
    'self-check',
  );
  const criticalFindings = mapAuditOutputToFindings(
    '{"vulnerabilities":{"demo":{"severity":"critical","name":"demo","fixAvailable":false}}}',
    '',
    'self-check',
  );
  const errorFindings = mapAuditOutputToFindings(
    '{"message":"registry unavailable","error":{"summary":"","detail":""}}',
    '',
    'self-check',
  );

  if (
    emptyFindings.length !== 1 ||
    highFindings[0]?.severity !== 'HIGH' ||
    criticalFindings[0]?.severity !== 'CRITICAL' ||
    errorFindings[0]?.status !== 'infrastructure-uncertain'
  ) {
    throw new Error('npm audit parser self-check failed');
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function sanitizeId(value: string): string {
  return value.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Unknown npm audit script error');
  process.exitCode = 1;
});
