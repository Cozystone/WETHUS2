# 2026-06-26 interest personalized home recommendations

## What changed

- Updated `WETHUS2/app.js` so `getRecommendedProjects(...)` now uses the current user's `interestTags` in addition to recency, popularity, and prior interaction history.
- Added interest/category/keyword matching against project content so signup and onboarding interest choices now affect the actual homepage recommendation pool.
- Added `_recommendationReason` metadata to recommended projects so the UI can explain why a card was surfaced.
- Updated `WETHUS2/index.html` to show a short `추천 이유` line on home gallery cards when a recommendation reason is available.
- Extended `scripts/smoke-discovery-visibility.js` so commercialization verification now proves that:
  - approved projects still rank by freshness when all else is equal
  - an interest-matching project is promoted for a user with matching interest tags
  - the promoted project exposes an interest-linked recommendation reason

## Why it matters

- Before this change, interest selection existed in signup/profile but had weak influence on the main project discovery experience.
- This makes onboarding choices matter immediately and gives users a clearer reason to trust the homepage feed.

## Verification

- `node scripts/smoke-discovery-visibility.js`
- `node scripts/validate-static.js`
- `node scripts/run-commercial-gate.js`
