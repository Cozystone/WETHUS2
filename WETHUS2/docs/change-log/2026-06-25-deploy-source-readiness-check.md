# 2026-06-25 Deploy Source Readiness Check

## Summary
- Added `scripts/check-deploy-source-readiness.js`.
- The script checks:
  - current local `HEAD`
  - `origin/main`
  - whether the worktree is dirty
- It explains a common commercialization confusion: production cannot match the current local working state until the relevant changes are committed and pushed.

## Why
- Vercel inspection showed that the current production deployment already matches `origin/main` at commit `560e541`.
- That means the remaining live-vs-local drift is not primarily a domain alias bug; it is because the current commercialization hardening bundle still exists only in the local dirty worktree.
- Operators need an explicit pre-deploy check for source alignment before treating frontend drift as a platform issue.

## Verification
- `node scripts/check-deploy-source-readiness.js`
