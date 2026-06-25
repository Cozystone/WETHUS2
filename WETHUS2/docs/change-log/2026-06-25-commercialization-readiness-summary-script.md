# 2026-06-25 Commercialization Readiness Summary Script

## What changed
- Added `scripts/print-commercialization-readiness-summary.js`.
- The script summarizes in one place:
  - local source readiness
  - production backend flag state
  - provider scope readiness
  - live frontend contract drift
  - current launch blockers
  - next actions
- Added `--json` output mode so the same readiness snapshot can be consumed by CI, dashboards, or later automation without scraping text output.

## Why
- The repo already had detailed diagnostics, but launch decisions still required reading several separate outputs.
- This script compresses the real commercialization state into one operator-friendly summary.

## Validation
- `node scripts/print-commercialization-readiness-summary.js`
- `node scripts/print-commercialization-readiness-summary.js --json`
- `node scripts/print-production-rollout-status.js`
- `node scripts/run-commercial-gate.js`
