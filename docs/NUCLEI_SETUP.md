# Nuclei Vulnerability Scanning Setup Guide

The security test suite integrates [Nuclei](https://github.com/projectdiscovery/nuclei) for automated vulnerability scanning with 735+ OWASP Top 10 templates. This guide covers setup and running scans.

## Quick Start

### Option 1: Run Tests WITHOUT Nuclei Scanning (No Docker Required) ✅ RECOMMENDED FOR DEVELOPMENT

This is the baseline - all 19 security tests pass without Nuclei scanning:

```bash
npm run test:security
```

**Result**: 19 PASS, 3 SKIP (Nuclei tests skipped gracefully)

---

## Option 2: Run Tests WITH Nuclei Scanning (Docker Required)

### Prerequisites
- Docker installed and running
- Docker Hub access (for pulling `projectdiscovery/nuclei:latest` image)

### Steps

#### 1. Run Nuclei Scan

```bash
npm run nuclei:scan
```

This runs Nuclei in a Docker container and generates results at `reports/nuclei-results.json`.

**What it does:**
- Scans `https://www.saucedemo.com` with 735+ Nuclei templates
- Focuses on OWASP Top 10 vulnerabilities (medium, high, critical severity only)
- Outputs results as JSONL (one JSON object per line) to `reports/nuclei-results.json`
- Disables out-of-band interactions (`--no-interactsh`) for deterministic CI runs

**Output:**
```
[2026-03-19 14:32:15] scan - Starting scan...
[2026-03-19 14:32:45] scan - Found 3 vulnerabilities
[2026-03-19 14:32:46] scan - Results saved to /reports/nuclei-results.json
```

#### 2. Run Security Tests with Nuclei Validation

```bash
npm run test:security:with-nuclei
```

This runs all 22 tests:
- 19 baseline security tests (access control, cookies, injection, headers, auth)
- 3 Nuclei-specific validation tests:
  - Results file exists and is non-empty
  - Results are valid JSONL format
  - No Critical or High severity findings

**Result**: All 22 tests pass (or CI fails if Critical/High vulnerabilities found)

### Local Nuclei (Faster Alternative)

If you have `nuclei` installed via Homebrew:

```bash
brew install nuclei
npm run nuclei:scan:local
npm run test:security:with-nuclei
```

This is faster than Docker since it runs Nuclei directly on your machine.

---

## Architecture

### How Nuclei Integration Works

1. **Pre-scan step** — Nuclei Docker container runs once before tests
2. **Direct URL scanning** — Nuclei scans `https://www.saucedemo.com` with 735+ templates
3. **JSONL results** — Nuclei outputs results to `reports/nuclei-results.json` (one object per line)
4. **Result validation** — `tests/security/nuclei-scan.spec.ts` parses JSONL, filters by severity
5. **CI failure gate** — Tests fail if any Critical or High severity findings exist

### Configuration

**File**: `docker/docker-compose.nuclei.yml`

```yaml
services:
  nuclei:
    image: projectdiscovery/nuclei:latest
    volumes:
      - ./reports:/reports  # Mount reports directory
    command:
      - '-u'
      - 'https://www.saucedemo.com'
      - '-templates'
      - 'http/misconfiguration,http/exposures'  # OWASP A05, A02
      - '-severity'
      - 'medium,high,critical'  # Filter by severity
      - '-jsonl'  # Output JSONL format
      - '-o'
      - '/reports/nuclei-results.json'
      - '-no-interactsh'  # Disable OOB interactions for CI
```

---

## Test Files

### Nuclei Integration Tests

**File**: `tests/security/nuclei-scan.spec.ts`

Three tests:
1. **Results file exists** - Verifies `reports/nuclei-results.json` is created and non-empty
2. **Valid JSONL format** - Ensures each line is valid JSON
3. **No Critical/High findings** - Fails if any Critical or High severity vulnerabilities detected

### Graceful Fallback

Tests skip gracefully when Nuclei results are unavailable:

```typescript
test.skip(!!process.env.NUCLEI_SKIP, 'Nuclei validation tests skipped');
```

Tests are skipped (not failed) if `NUCLEI_SKIP=1` is set or results file is missing.

---

## Utilities

### Nuclei Result Parsing

**File**: `utils/nuclei-helper.ts`

- `readNucleiResults()` - Parses JSONL results file
- `filterFindingsBySeverity()` - Filters findings by severity level
- `formatFindingDetails()` - Creates human-readable finding reports
- `generateFindingsSummary()` - Generates summary statistics

**Usage**:
```typescript
import { readNucleiResults, filterFindingsBySeverity } from '@utils/nuclei-helper';

const findings = await readNucleiResults('reports/nuclei-results.json');
const critical = filterFindingsBySeverity(findings, 'critical');
```

---

## CI/CD Integration

See `.github/workflows/security.yml` for GitHub Actions setup.

The workflow:
1. Runs Nuclei Docker container to scan target URL
2. Generates `reports/nuclei-results.json` with vulnerability findings
3. Runs all 22 security tests (19 baseline + 3 Nuclei validation)
4. **Fails CI if any Critical or High severity vulnerabilities are found**
5. Publishes Allure and HTML reports as artifacts

---

## Troubleshooting

### Docker Daemon Not Running

```bash
# Start Docker Desktop or Docker daemon
# On macOS: open /Applications/Docker.app
# On Linux: sudo systemctl start docker
```

### Nuclei Scan Takes Too Long

Nuclei scans with 735+ templates can take 1-3 minutes depending on target response time.

```bash
# Check scan progress
docker logs <container_id>

# Alternative: Run local Nuclei (faster)
brew install nuclei
npm run nuclei:scan:local
```

### Results File Not Generated

```bash
# Check Docker container logs
docker logs nuclei

# Verify mount point is correct
docker run -v $(pwd)/reports:/reports projectdiscovery/nuclei:latest -u https://www.saucedemo.com -o /reports/test.json

# Check file permissions
ls -la reports/nuclei-results.json
```

### Tests Fail on Expected Vulnerabilities

If `npm run test:security:with-nuclei` fails with unexpected findings:

```bash
# Inspect the raw results
cat reports/nuclei-results.json | jq '.'

# Filter by severity
cat reports/nuclei-results.json | jq 'select(.severity == "critical" or .severity == "high")'
```

---

## Nuclei Documentation

- **Nuclei GitHub**: https://github.com/projectdiscovery/nuclei
- **Template Library**: https://nuclei.projectdiscovery.io/templating-guide/
- **CLI Documentation**: https://nuclei.projectdiscovery.io/nuclei/get-started/
- **OWASP Top 10 Templates**: Filter by category in the template registry

---

## Commands Reference

```bash
# Run Nuclei scan via Docker
npm run nuclei:scan

# Run Nuclei scan via local CLI (if installed)
npm run nuclei:scan:local

# Run security tests without Nuclei (baseline)
npm run test:security

# Run security tests with Nuclei validation (full suite)
npm run test:security:with-nuclei

# Skip Nuclei tests manually
NUCLEI_SKIP=1 npm run test:security:with-nuclei
```

---

## Key Differences: ZAP → Nuclei

| Aspect | ZAP | Nuclei |
|--------|-----|--------|
| **Scanning Model** | HTTP proxy (passive) | Direct URL scanner (one-shot) |
| **Integration** | Proxy config in Playwright | Docker step before tests |
| **Setup** | Requires Docker networking config | Simple Docker container |
| **Templates** | Built-in alerts | 735+ community templates |
| **Results** | REST API queries | JSONL file |
| **Installation** | Docker or standalone | Docker or `brew install nuclei` |
| **OS Support** | Requires Docker (networking issues on Apple Silicon) | Docker or native CLI (no networking issues) |

---

## Support

- **Nuclei Issues**: https://github.com/projectdiscovery/nuclei/issues
- **Project Issues**: GitHub Issues in this repo
