# 2026-06-25 Commercialization Staging Plan

## Summary
- Added `scripts/print-commercialization-staging-plan.js`.
- The script prints exact `git add ...` commands for each recommended commercialization commit group.

## Why
- The repo now has a practical commit split, but operators still had to manually turn that into staging commands.
- This helper removes that friction and makes it easier to stage the intended release slices consistently.

## Verification
- `node scripts/print-commercialization-staging-plan.js`
