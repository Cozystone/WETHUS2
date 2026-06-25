# 2026-06-25 Commercial Gate Deploy Source Step

## Summary
- Added `scripts/check-deploy-source-readiness.js` as the first step in `scripts/run-commercial-gate.js`.
- When `WETHUS_GATE_STRICT_PRODUCTION=true`, the gate now forwards `WETHUS_DEPLOY_SOURCE_STRICT=true`, so a dirty worktree or `HEAD != origin/main` becomes a hard failure.
- Updated status and next-step docs so launch-grade verification explicitly includes deploy-source cleanliness.

## Why
- Commercial readiness was already checking local quality, live drift, and production security posture.
- But a launch-grade run should also fail fast if the current local state is not actually deployable.
- This closes the gap between “validated locally” and “actually shippable from the current source state.”

## Verification
- `node scripts/check-deploy-source-readiness.js`
- `node scripts/run-commercial-gate.js`
- `WETHUS_GATE_STRICT_PRODUCTION=true node scripts/run-commercial-gate.js`
