# ZAP Alert REST API Contract

## Endpoint

```
GET http://localhost:8080/JSON/core/view/alerts/?zapapiformat=JSON
```

## Request

No query parameters required. Response returns all alerts accumulated during the scan session.

## Response Format

```json
{
  "alerts": [
    {
      "id": 1,
      "pluginId": 6,
      "alert": "Cross Site Scripting (Reflected)",
      "name": "Cross Site Scripting (Reflected)",
      "riskId": 3,
      "riskCode": "high",
      "confidence": 3,
      "confidenceText": "High",
      "description": "Cross-site Scripting (XSS) in parameter...",
      "instances": [
        {
          "uri": "https://www.saucedemo.com/login",
          "method": "POST",
          "evidence": "<script>alert(1)</script>"
        }
      ],
      "otherInfo": "None",
      "solution": "Implement input validation, output encoding...",
      "reference": "https://owasp.org/www-community/attacks/xss/",
      "cweid": "79",
      "wascid": "8"
    }
  ]
}
```

## Risk Level Mapping

| riskId | riskCode      | Severity | Action |
|--------|---------------|----------|--------|
| 0      | informational | Low      | Log only |
| 1      | low           | Low      | Log only |
| 2      | medium        | Medium   | Log + notify |
| 3      | high          | High     | **FAIL TEST** |
| 4      | critical      | Critical | **FAIL TEST** |

## Test Assertion Contract

**MUST FAIL** if any alert has `riskId >= 3` (High or Critical).

```typescript
function failOnHighOrCriticalAlerts(alerts: any[]): void {
  const highOrCritical = alerts.filter(a => a.riskId >= 3);
  if (highOrCritical.length > 0) {
    const summary = highOrCritical
      .map(a => `${a.alert} (${a.riskCode}): ${a.instances[0]?.uri}`)
      .join('\n  - ');
    throw new Error(`ZAP found ${highOrCritical.length} High/Critical alerts:\n  - ${summary}`);
  }
}
```

## Confidence Levels

| confidence | confidenceText | Meaning |
|------------|----------------|---------|
| 0          | False Positive | Likely not a real vulnerability |
| 1          | Low            | Might be a vulnerability |
| 2          | Medium         | Probably a vulnerability |
| 3          | High           | Definitely a vulnerability |

Confidence 0 (False Positive) can occur; tests MUST NOT filter by confidence — report all High/Critical findings regardless of confidence.

## Common Alert Types (by OWASP Category)

- **A01 Broken Access Control**: `Access Control Error`, `Insecure Direct Object References`
- **A02 Cryptographic Failures**: `Sensitive Data Exposure`, `Unencrypted Sensitive Data`
- **A03 Injection**: `SQL Injection`, `Cross Site Scripting (Reflected)`, `XML Injection`
- **A05 Security Misconfiguration**: `Missing Anti-CSRF Tokens`, `Missing HSTS Header`
- **A07 Authentication**: `Session Fixation`, `Username Enumeration`
