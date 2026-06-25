# 2026-06-26 - Launch Readiness JSON Evidence

- Added `--json` output support to `scripts/print-production-rollout-status.js`.
- Expanded `.github/workflows/launch-readiness.yml` so it now uploads both text and JSON evidence for:
  - commercialization readiness summary
  - production rollout status
- This makes launch-readiness evidence easier to consume from future dashboards, monitors, or ops automation without scraping human-readable text output.

## Verification

- `node scripts/print-production-rollout-status.js`
- `node scripts/print-production-rollout-status.js --json`
- `REQUIRE_WETHUS_BACKEND_CONTRACTS=true WETHUS_GATE_STRICT_PRODUCTION=true node scripts/run-commercial-gate.js`
