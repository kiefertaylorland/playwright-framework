import fs from 'node:fs/promises';
import path from 'node:path';

import {
  appendSecurityReport,
  createFinding,
  redactSensitive,
  type SecurityFinding,
} from '../utils/security-report.ts';
import {
  createDefaultSecurityTargets,
  createSecurityCheck,
  OWASP,
} from '../utils/security-targets.ts';

type SecretPattern = {
  id: string;
  label: string;
  pattern: RegExp;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
};

const EXCLUDED_NAMES = new Set([
  '.git',
  'node_modules',
  'reports',
  'test-results',
  'playwright-report',
  '.auth',
  '.env',
]);
const SECRET_PATTERNS: SecretPattern[] = [
  {
    id: 'private-key',
    label: 'Private key block',
    pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
    severity: 'HIGH',
  },
  {
    id: 'bearer-literal',
    label: 'Bearer token literal',
    pattern: /authorization\s*[:=]\s*bearer\s+[a-z0-9._~+/=-]{12,}/i,
    severity: 'HIGH',
  },
  {
    id: 'secret-assignment',
    label: 'Secret-like assignment',
    pattern: /\b(password|passwd|secret|api[_-]?key|token)\b\s*[:=]\s*["'][^"']{8,}["']/i,
    severity: 'MEDIUM',
  },
];

async function main(): Promise<void> {
  if (process.argv.includes('--self-check')) {
    runSelfCheck();
  }

  const root = process.cwd();
  const files = await collectFiles(root);
  const check = createSecurityCheck({
    id: 'repository-secret-scan',
    targetId: 'repository',
    category: 'secret-scan',
    owaspCategory: OWASP.SOFTWARE_DATA_INTEGRITY,
  });
  const findings: SecurityFinding[] = [];

  for (const file of files) {
    const content = await fs.readFile(file, 'utf8');
    const lines = content.split(/\r?\n/);
    lines.forEach((line, index) => {
      for (const secretPattern of SECRET_PATTERNS) {
        if (!secretPattern.pattern.test(line)) {
          continue;
        }
        const relativePath = path.relative(root, file);
        findings.push(
          createFinding({
            id: `repo-secret-${sanitizeId(relativePath)}-${String(index + 1)}-${secretPattern.id}`,
            severity: secretPattern.severity,
            targetId: 'repository',
            checkId: check.id,
            title: `Candidate ${secretPattern.label}`,
            status: 'review-needed',
            owaspCategory: OWASP.SOFTWARE_DATA_INTEGRITY,
            evidence: `${relativePath}:${String(index + 1)} ${redactSensitive(line.trim()).value}`,
            nextAction: 'Review whether this is a real secret and rotate/remove if confirmed',
          }),
        );
      }
    });
  }

  if (findings.length === 0) {
    findings.push(
      createFinding({
        id: 'repo-secret-scan-clean',
        severity: 'INFO',
        targetId: 'repository',
        checkId: check.id,
        title: 'No candidate secrets found',
        status: 'observed',
        owaspCategory: OWASP.SOFTWARE_DATA_INTEGRITY,
        evidence: `scannedFiles=${String(files.length)}; excluded=${Array.from(EXCLUDED_NAMES).join(',')}`,
        nextAction: 'Keep scanner patterns under review as the repo grows',
      }),
    );
  }

  await appendSecurityReport({
    targets: createDefaultSecurityTargets(),
    checks: [check],
    findings,
  });
}

async function collectFiles(root: string): Promise<string[]> {
  const files: string[] = [];

  async function visit(currentPath: string): Promise<void> {
    const name = path.basename(currentPath);
    if (EXCLUDED_NAMES.has(name)) {
      return;
    }

    const stat = await fs.stat(currentPath);
    if (stat.isDirectory()) {
      const children = await fs.readdir(currentPath);
      for (const child of children) {
        await visit(path.join(currentPath, child));
      }
      return;
    }

    if (stat.isFile() && isScannableFile(currentPath)) {
      files.push(currentPath);
    }
  }

  await visit(root);
  return files;
}

function isScannableFile(filePath: string): boolean {
  const extension = path.extname(filePath).toLowerCase();
  return [
    '.json',
    '.md',
    '.ts',
    '.js',
    '.yml',
    '.yaml',
    '.env',
    '.txt',
  ].includes(extension);
}

function runSelfCheck(): void {
  const redacted = redactSensitive('password="super-secret-value"').value;
  if (redacted.includes('super-secret-value')) {
    throw new Error('Secret scanner self-check failed: redaction did not apply');
  }
  if (!EXCLUDED_NAMES.has('node_modules') || !EXCLUDED_NAMES.has('reports')) {
    throw new Error('Secret scanner self-check failed: required exclusions missing');
  }
}

function sanitizeId(value: string): string {
  return value.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Unknown secret scan error');
  process.exitCode = 1;
});
