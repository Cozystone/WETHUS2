# 2026-06-25 Commercialization Release Plan Script

## Summary
- Added `scripts/plan-commercialization-release.js`.
- The script prints a recommended release order for the current dirty commercialization bundle:
  - Phase 0: commit candidate scope
  - Phase 1: local validation
  - Phase 2: code deploy
  - Phase 3: live drift verification
  - Phase 4: production security rollout
- The release plan now also includes:
  - `scripts/print-production-rollout-status.js`
  - `scripts/smoke-project-applications.js`
  - current gate-file classification for `print-commercialization-staging-plan.js`, `print-production-rollout-status.js`, and `smoke-project-applications.js`

## Why
- `describe-commercialization-bundle.js` explains what changed, but operators still need a practical “what do we do next?” output.
- This script turns the current local bundle into an ordered release plan, which is especially useful while the repo is ahead of the live production deployment.

## Verification
- `node scripts/plan-commercialization-release.js`
