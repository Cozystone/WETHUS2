# 2026-06-25 Commercialization Commit Split

## Summary
- Added `scripts/suggest-commercialization-commits.js`.
- The script proposes three practical commit groups for the current commercialization bundle:
  - core backend + frontend hardening
  - commercialization gates + CI
  - ops docs + change logs

## Why
- The dirty worktree is now well-understood, but still large enough that a single undifferentiated commit would be hard to review and risky to ship.
- This helper gives an operator-friendly answer to “what should go in commit 1 vs commit 2?” without guessing from memory.

## Verification
- `node scripts/suggest-commercialization-commits.js`
