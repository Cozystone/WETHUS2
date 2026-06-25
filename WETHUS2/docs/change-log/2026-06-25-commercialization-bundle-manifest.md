# 2026-06-25 Commercialization Bundle Manifest

## Summary
- Added `scripts/describe-commercialization-bundle.js`.
- The script groups the current dirty worktree into commercialization release areas:
  - backend security and sessions
  - frontend interactions and hub
  - commercialization gates and CI
  - ops docs and release notes
- Each group also prints the most relevant verification commands for that area.

## Why
- The current commercialization hardening bundle spans backend, frontend, CI, smoke tests, and ops docs.
- Before commit/deploy, operators need a quick way to understand what the current local release bundle actually contains.
- This reduces the chance of partial commits or vague “ship everything” deployments.

## Verification
- `node scripts/describe-commercialization-bundle.js`
