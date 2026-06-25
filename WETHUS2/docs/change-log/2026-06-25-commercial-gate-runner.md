# 2026-06-25 Commercial Gate Runner

## What changed
- Added `scripts/run-commercial-gate.js` as a single entry point for commercialization checks.
- Default run executes:
  - `scripts/validate-static.js`
  - `scripts/smoke-backend-security.js`
  - `scripts/audit-commercial-readiness.js`
- With `WETHUS_GATE_STRICT_PRODUCTION=true`, it also runs strict production smoke with required API health/security flags.

## Why
- Commercialization readiness was already being tested, but the checks were spread across multiple scripts.
- A single gate command lowers operator error and makes pre-deploy validation more repeatable.

## Validation
- `node scripts/run-commercial-gate.js`
- `WETHUS_GATE_STRICT_PRODUCTION=true node scripts/run-commercial-gate.js`
