# 2026-06-26 - Launch Readiness Artifact Noise Cleanup

- Updated `scripts/write-launch-readiness-step-summary.js` to tolerate a UTF-8 BOM in local JSON files.
- Updated `scripts/check-deploy-source-readiness.js` to ignore generated launch-readiness evidence artifacts:
  - `commercialization-readiness-summary.json|txt`
  - `production-rollout-status.json|txt`
  - `launch-readiness-step-summary.md`
- This prevents local verification artifacts from falsely appearing as deployment drift while keeping the real source-state checks intact.

## Verification

- `GITHUB_STEP_SUMMARY=launch-readiness-step-summary.md node scripts/write-launch-readiness-step-summary.js`
- `node scripts/check-deploy-source-readiness.js`
