# 2026-06-26 explore theme personalized mix

## What changed

- Updated `WETHUS2/explore_theme.html` so the default `추천 믹스` sort no longer alternates only by newest / popular / oldest.
- The themed explore feed now:
  - pulls the current personalized recommendation pool from `WETHUS.getRecommendedProjects(...)`
  - keeps only projects inside the current theme
  - prioritizes items by their personalized recommendation rank
  - falls back to likes and recency for the rest
- Added a short `추천 이유` line to both list and album explore cards when recommendation metadata is available.

## Why it matters

- Homepage personalization and explore personalization should not feel disconnected.
- Users who selected interests during signup/onboarding now get a more consistent discovery experience when they move from home into category exploration.

## Verification

- `node scripts/validate-static.js`
- `node scripts/run-commercial-gate.js`
