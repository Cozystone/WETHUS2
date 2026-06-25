# 2026-06-25 Commercial Gate Live Frontend Drift Step

## What changed
- Added `scripts/check-live-frontend-drift.js` as an explicit step in `scripts/run-commercial-gate.js`.
- In non-strict mode the step is optional, so it surfaces actionable Vercel drift without blocking every local hardening run.
- In strict mode the same drift step becomes a required gate, aligning with launch-grade expectations.

## Why
- The main remaining frontend commercialization blocker is live page drift rather than local file correctness.
- Putting drift detection directly in the gate reduces the chance of calling the platform launch-ready while Vercel is still serving older hub/profile/explore assets.

## Validation
- `node scripts/run-commercial-gate.js`
- `WETHUS_GATE_STRICT_PRODUCTION=true node scripts/run-commercial-gate.js` once deploy-source cleanliness and production flags are ready
