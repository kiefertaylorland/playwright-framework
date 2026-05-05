import fs from 'node:fs/promises';
import path from 'node:path';

import { NON_GATING, SECURITY_REPORT_PATH } from './security-targets.ts';

export type SecuritySeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type SecurityMode = 'DISCOVERY' | 'ENFORCEMENT' | 'PRODUCTION_GATE';
export type FindingStatus =
  | 'observed'
  | 'review-needed'
  | 'skipped'
  | 'infrastructure-uncertain';
export type GatingStatus = 'non-gating' | 'gating';
export type AuthorizationStatus =
  | 'public-training-target'
  | 'configured-credentials'
  | 'credentials-missing'
  | 'local-repository'
  | 'unreachable';
export type CredentialSource = 'public-default' | 'environment' | 'none';

export interface SecurityTarget {
  id: string;
  displayName: string;
  baseUrl?: string;
  authorizationStatus: AuthorizationStatus;
  credentialSource: CredentialSource;
}

export interface SecurityCheck {
  id: string;
  targetId: string;
  category:
    | 'authentication-session'
    | 'input-sanitization'
    | 'access-control'
    | 'rate-limit-observation'
    | 'dependency-audit'
    | 'secret-scan'
    | 'report-integrity';
  mode: SecurityMode;
  owaspCategory: string;
  safeLimit?: number;
}

export interface SecurityFinding {
  id: string;
  severity: SecuritySeverity;
  targetId: string;
  checkId: string;
  title: string;
  status: FindingStatus;
  owaspCategory: string;
  evidence: string;
  redactionApplied: boolean;
  gating: GatingStatus;
  nextAction: string;
}

export interface SecurityRun {
  timestamp: string;
  mode: SecurityMode;
  reportPath: string;
  targets: SecurityTarget[];
  checks: SecurityCheck[];
  findings: SecurityFinding[];
}

type AnnotationSink = {
  annotations: Array<{
    type: string;
    description?: string;
  }>;
};

const REPORT_PATH = path.resolve(process.cwd(), SECURITY_REPORT_PATH);
const REPORT_STATE_PATH = path.resolve(
  process.cwd(),
  'reports/security/security-summary.json',
);
const REPORT_LOCK_PATH = path.resolve(
  process.cwd(),
  'reports/security/.security-report.lock',
);
const SEVERITIES: SecuritySeverity[] = ['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const STATUSES: FindingStatus[] = [
  'observed',
  'review-needed',
  'skipped',
  'infrastructure-uncertain',
];

export function createSecurityRun(input: {
  targets?: SecurityTarget[];
  checks?: SecurityCheck[];
  findings?: SecurityFinding[];
}): SecurityRun {
  return {
    timestamp: new Date().toISOString(),
    mode: 'DISCOVERY',
    reportPath: SECURITY_REPORT_PATH,
    targets: input.targets ?? [],
    checks: input.checks ?? [],
    findings: sanitizeFindings(input.findings ?? []),
  };
}

export function createFinding(input: {
  id: string;
  severity: SecuritySeverity;
  targetId: string;
  checkId: string;
  title: string;
  status: FindingStatus;
  owaspCategory?: string;
  evidence: string;
  nextAction: string;
}): SecurityFinding {
  const redactedEvidence = redactSensitive(input.evidence);

  return {
    id: input.id,
    severity: input.severity,
    targetId: input.targetId,
    checkId: input.checkId,
    title: input.title,
    status: input.status,
    owaspCategory: input.owaspCategory ?? 'N/A',
    evidence: redactedEvidence.value,
    redactionApplied: redactedEvidence.redactionApplied,
    gating: NON_GATING,
    nextAction: input.nextAction,
  };
}

export function redactSensitive(value: string): {
  value: string;
  redactionApplied: boolean;
} {
  const replacements: Array<[RegExp, string]> = [
    [/(authorization\s*:\s*bearer\s+)[a-z0-9._~+/=-]+/gi, '$1[REDACTED]'],
    [/(bearer\s+)[a-z0-9._~+/=-]+/gi, '$1[REDACTED]'],
    [/("access_token"\s*:\s*")[^"]+(")/gi, '$1[REDACTED]$2'],
    [/(access_token\s*[=:]\s*)[^\s,;&]+/gi, '$1[REDACTED]'],
    [/(password\s*[=:]\s*)[^\s,;&]+/gi, '$1[REDACTED]'],
    [/(session(?:id)?\s*[=:]\s*)[^\s,;&]+/gi, '$1[REDACTED]'],
    [/(cookie\s*[=:]\s*)[^\n]+/gi, '$1[REDACTED]'],
  ];

  let nextValue = value;
  for (const [pattern, replacement] of replacements) {
    nextValue = nextValue.replace(pattern, replacement);
  }

  return {
    value: nextValue,
    redactionApplied: nextValue !== value,
  };
}

export function escapeMarkdownTable(value: string): string {
  return value.replaceAll('|', '\\|').replaceAll('\n', '<br>');
}

export async function writeSecurityReport(
  run: SecurityRun,
  options?: { reportPath?: string; statePath?: string },
): Promise<void> {
  if (options?.reportPath) {
    await writeSecurityReportUnlocked(
      run,
      path.resolve(process.cwd(), options.reportPath),
      options.statePath
        ? path.resolve(process.cwd(), options.statePath)
        : `${path.resolve(process.cwd(), options.reportPath)}.json`,
    );
    return;
  }

  await withReportLock(async () => {
    await writeSecurityReportUnlocked(run, REPORT_PATH, REPORT_STATE_PATH);
  });
}

export async function appendSecurityReport(input: {
  targets?: SecurityTarget[];
  checks?: SecurityCheck[];
  findings?: SecurityFinding[];
}): Promise<SecurityRun> {
  return withReportLock(async () => {
    const existing = await readSecurityStateUnlocked();
    const merged = createSecurityRun({
      targets: mergeById(existing.targets, input.targets ?? []),
      checks: mergeById(existing.checks, input.checks ?? []),
      findings: mergeById(existing.findings, sanitizeFindings(input.findings ?? [])),
    });

    await writeSecurityReportUnlocked(merged, REPORT_PATH, REPORT_STATE_PATH);
    return merged;
  });
}

export function annotateFindings(
  testInfo: AnnotationSink,
  findings: SecurityFinding[],
): void {
  for (const finding of findings) {
    testInfo.annotations.push({
      type: `security:${finding.severity}`,
      description: `${finding.id} ${finding.title} (${finding.gating})`,
    });
  }
}

async function writeSecurityReportUnlocked(
  run: SecurityRun,
  reportPath: string,
  statePath: string,
): Promise<void> {
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(statePath, `${JSON.stringify(run, null, 2)}\n`, 'utf8');
  await fs.writeFile(reportPath, renderSecurityReport(run), 'utf8');
}

async function readSecurityStateUnlocked(): Promise<SecurityRun> {
  try {
    const content = await fs.readFile(REPORT_STATE_PATH, 'utf8');
    const parsed: unknown = JSON.parse(content);
    if (isSecurityRun(parsed)) {
      return parsed;
    }
  } catch {
    // A missing or malformed generated state file should not block a fresh report.
  }

  return createSecurityRun({});
}

async function withReportLock<T>(callback: () => Promise<T>): Promise<T> {
  await fs.mkdir(path.dirname(REPORT_LOCK_PATH), { recursive: true });

  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      await fs.mkdir(REPORT_LOCK_PATH);
      try {
        return await callback();
      } finally {
        await fs.rm(REPORT_LOCK_PATH, { recursive: true, force: true });
      }
    } catch (error) {
      if (!isNodeErrorWithCode(error, 'EEXIST')) {
        throw error;
      }
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });
    }
  }

  throw new Error('Timed out waiting for security report lock');
}

function renderSecurityReport(run: SecurityRun): string {
  const lines: string[] = [];
  const summary = buildSummary(run.findings);

  lines.push('# Security Summary');
  lines.push('');
  lines.push(`**Generated**: ${run.timestamp}`);
  lines.push(`**Mode**: ${run.mode}`);
  lines.push(`**Gating policy**: ${NON_GATING} Discovery Mode findings`);
  lines.push(`**Report path**: ${run.reportPath}`);
  lines.push('');
  lines.push('## Target Configuration');
  lines.push('');
  lines.push('| Target | Base URL | Authorization | Credential Source |');
  lines.push('|--------|----------|---------------|-------------------|');
  for (const target of run.targets) {
    lines.push(
      `| ${escapeMarkdownTable(target.displayName)} | ${escapeMarkdownTable(target.baseUrl ?? 'N/A')} | ${target.authorizationStatus} | ${target.credentialSource} |`,
    );
  }
  lines.push('');
  lines.push('## Check Coverage');
  lines.push('');
  lines.push('| Check | Target | Category | OWASP | Safe Limit |');
  lines.push('|-------|--------|----------|-------|------------|');
  for (const check of run.checks) {
    lines.push(
      `| ${escapeMarkdownTable(check.id)} | ${escapeMarkdownTable(check.targetId)} | ${check.category} | ${escapeMarkdownTable(check.owaspCategory)} | ${check.safeLimit ?? 'N/A'} |`,
    );
  }
  lines.push('');
  lines.push('## Findings Summary');
  lines.push('');
  lines.push('| Severity | Count |');
  lines.push('|----------|-------|');
  for (const severity of SEVERITIES) {
    lines.push(`| ${severity} | ${summary.bySeverity.get(severity) ?? 0} |`);
  }
  lines.push('');
  lines.push('| Status | Count |');
  lines.push('|--------|-------|');
  for (const status of STATUSES) {
    lines.push(`| ${status} | ${summary.byStatus.get(status) ?? 0} |`);
  }
  lines.push('');
  lines.push('## Detailed Findings');
  lines.push('');
  lines.push('| ID | Severity | Target | Category | OWASP | Status | Gating | Evidence | Next Action |');
  lines.push('|----|----------|--------|----------|-------|--------|--------|----------|-------------|');
  for (const finding of run.findings) {
    const check = run.checks.find((candidate) => candidate.id === finding.checkId);
    lines.push(
      `| ${escapeMarkdownTable(finding.id)} | ${finding.severity} | ${escapeMarkdownTable(finding.targetId)} | ${check?.category ?? 'unknown'} | ${escapeMarkdownTable(finding.owaspCategory)} | ${finding.status} | ${finding.gating} | ${escapeMarkdownTable(finding.evidence)} | ${escapeMarkdownTable(finding.nextAction)} |`,
    );
  }
  lines.push('');
  lines.push('## Skipped Coverage');
  lines.push('');
  const skipped = run.findings.filter((finding) => finding.status === 'skipped');
  if (skipped.length === 0) {
    lines.push('No skipped coverage recorded.');
  } else {
    for (const finding of skipped) {
      lines.push(`- **${finding.id}**: ${finding.evidence}`);
    }
  }
  lines.push('');
  lines.push('## Redaction Statement');
  lines.push('');
  lines.push(
    'Credentials, access tokens, session identifiers, cookies, and secret-like values are redacted before report output.',
  );
  lines.push('');
  lines.push('## Graduation Path To Enforcement Mode');
  lines.push('');
  lines.push('1. Complete at least two stable CI runs of this Discovery suite.');
  lines.push('2. Triage false positives and document known-review findings.');
  lines.push('3. Approve a severity policy for confirmed Critical/High findings.');
  lines.push('4. Confirm target authorization for scanner or active checks.');
  lines.push('5. Confirm report evidence is sufficient for remediation without raw logs.');
  lines.push('6. Create owners or follow-up tasks for skipped coverage.');
  lines.push('');

  return `${lines.join('\n')}\n`;
}

function buildSummary(findings: SecurityFinding[]): {
  bySeverity: Map<SecuritySeverity, number>;
  byStatus: Map<FindingStatus, number>;
} {
  const bySeverity = new Map<SecuritySeverity, number>();
  const byStatus = new Map<FindingStatus, number>();

  for (const finding of findings) {
    bySeverity.set(finding.severity, (bySeverity.get(finding.severity) ?? 0) + 1);
    byStatus.set(finding.status, (byStatus.get(finding.status) ?? 0) + 1);
  }

  return { bySeverity, byStatus };
}

function sanitizeFindings(findings: SecurityFinding[]): SecurityFinding[] {
  return findings.map((finding) => {
    const redacted = redactSensitive(finding.evidence);
    return {
      ...finding,
      evidence: redacted.value,
      redactionApplied: finding.redactionApplied || redacted.redactionApplied,
      gating: NON_GATING,
    };
  });
}

function mergeById<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
  const merged = new Map<string, T>();

  for (const item of existing) {
    merged.set(item.id, item);
  }
  for (const item of incoming) {
    merged.set(item.id, item);
  }

  return Array.from(merged.values());
}

function isSecurityRun(value: unknown): value is SecurityRun {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.timestamp === 'string' &&
    value.mode === 'DISCOVERY' &&
    typeof value.reportPath === 'string' &&
    Array.isArray(value.targets) &&
    Array.isArray(value.checks) &&
    Array.isArray(value.findings)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNodeErrorWithCode(error: unknown, code: string): boolean {
  return isRecord(error) && error.code === code;
}
