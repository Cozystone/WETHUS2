# 2026-06-25 Release Helper Backend Drift Alignment

## What changed
- Updated release helper scripts so backend drift verification is included consistently in:
  - `scripts/suggest-commercialization-commits.js`
  - `scripts/print-commercialization-staging-plan.js`
  - `scripts/plan-commercialization-release.js`
- The rollout phase now also keeps `INTEGRATIONS_ENFORCE_LAUNCH_SCOPE=true` in the explicit production flag order.

## Why
- The commercialization reports already proved that live Render lag is a first-order launch blocker.
- The release helpers should therefore recommend backend drift verification and the full flag rollout order everywhere, not only in the main gate.

## Verification
- `node scripts/suggest-commercialization-commits.js`
- `node scripts/print-commercialization-staging-plan.js`
- `node scripts/plan-commercialization-release.js`
