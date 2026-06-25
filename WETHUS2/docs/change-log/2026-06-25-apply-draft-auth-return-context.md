# 2026-06-25 Apply Draft Auth Return Context

## What changed
- Support motivation drafts now survive auth redirects on both:
  - `WETHUS2/index.html`
  - `WETHUS2/explore_theme.html`
- Apply modal redirects now preserve:
  - `modalProjectId`
  - `reopenApplyModal`
  - `pendingApplyMotivation`
- `WETHUS2/app.js` now preserves apply-draft context even when `applyToProject()` is called without an authenticated actor.

## Why
- Losing a half-written support motivation right before login is a high-friction commercial UX failure.
- This change aligns the support flow with the improved comment-draft recovery behavior.

## Verification
- `node scripts/validate-static.js`
- Browser check on local apply-modal auth return flow
