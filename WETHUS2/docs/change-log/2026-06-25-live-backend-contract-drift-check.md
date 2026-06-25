# 2026-06-25 Live Backend Contract Drift Check

## What changed
- Added `scripts/check-live-backend-contract-drift.js`.
- The new check audits deployed backend contract parity for:
  - `/health`
  - `/integrations/providers`
- It verifies live exposure of:
  - backend service/build/security contract fields
  - provider launch-scope contract fields such as `launchPhase`, `launchIncluded`, and `launchNote`
- Wired the new check into:
  - `scripts/run-commercial-gate.js`
  - `scripts/print-commercialization-readiness-summary.js`
  - `scripts/print-production-rollout-status.js`
  - commercialization release-planning helpers

## Why
- Commercial readiness was already strong at the local code level, but it was still too easy to blur together:
  - “the code is wrong”
  - “the live backend is simply behind deploy”
- A dedicated backend drift check makes Render lag much more obvious and shortens the path from detection to rollout action.

## Verification
- `node scripts/check-live-backend-contract-drift.js`
- `node scripts/print-commercialization-readiness-summary.js`
- `node scripts/print-production-rollout-status.js`
