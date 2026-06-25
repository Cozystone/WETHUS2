# 2026-06-25 Guest Interaction Auth Return Fix

## What changed
- Fixed a bad guest-like branch in `WETHUS2/app.js` where apply-draft return context had been mistakenly attached to `toggleLike()`.
- `toggleLike()` now preserves only the project modal context it actually needs.
- `toggleBookmark()` now preserves `modalProjectId` when login is required, so bookmarking from a modal can return to the same project.
- `applyToProject()` now correctly preserves:
  - `modalProjectId`
  - `reopenApplyModal`
  - `pendingApplyMotivation`

## Why
- The previous patch risked a runtime error in guest like flows because `motivation` was not in scope there.
- Commercialization hardening should reduce friction, not introduce new interaction regressions.

## Verification
- `node scripts/validate-static.js`
- `node --check WETHUS2/app.js`
