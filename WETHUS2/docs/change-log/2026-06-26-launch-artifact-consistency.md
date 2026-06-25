# 2026-06-26 launch artifact consistency

## What changed

- Updated `scripts/print-launch-readiness-snapshot.js` so it can reuse already-generated:
  - `commercialization-readiness-summary.json`
  - `production-rollout-status.json`
- Updated `scripts/generate-launch-readiness-artifacts.js` so snapshot generation now passes `LAUNCH_READINESS_USE_GENERATED_ARTIFACTS=true`, making the snapshot consume the exact JSON artifacts created earlier in the same bundle run instead of re-querying live state again.

## Why it matters

- Launch-readiness artifacts were vulnerable to timing drift because summary, rollout, and snapshot files could be generated from slightly different moments during active deploys.
- Reusing the already-generated JSON files makes the artifact bundle internally consistent and reduces false blocker noise right after push/deploy operations.

## Verification

- `node scripts/smoke-launch-readiness-artifacts.js`
- `node scripts/run-commercial-gate.js`
