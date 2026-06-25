## 2026-06-26 Google Relay Package

- Added a production-ready Google Apps Script relay starter package for WETHUS activity-log ingestion:
  - `WETHUS2/integrations/google-apps-script-relay/Code.js`
  - `WETHUS2/integrations/google-apps-script-relay/appsscript.json`
- Added an operator runbook:
  - `WETHUS2/docs/ops/google-apps-script-relay.md`
- Covered the real product constraint that Google Sheets supports richer installable triggers while Google Docs still needs open/manual/heartbeat-style relay coverage.
- Added `scripts/smoke-google-relay-template.js` and wired it into:
  - `scripts/run-commercial-gate.js`
  - `.github/workflows/static-checks.yml`
  - `scripts/validate-static.js`
