# 2026-06-26 - Launch Artifact Smoke Cleanup

- Updated `scripts/smoke-launch-readiness-artifacts.js` so it removes the generated launch-readiness evidence files after verification.
- This keeps local worktrees clean when developers or CI-adjacent checks run the smoke directly.

## Verification

- `node scripts/smoke-launch-readiness-artifacts.js`
- `git status --short`
