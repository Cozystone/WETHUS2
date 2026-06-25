# 2026-06-26 profile idea recommendations

## What changed

- Added a new personalized module to `WETHUS2/profile.html`:
  - `관심사 기반 다음 아이디어`
- The module uses the existing `WETHUS.getStartupIdeaRecommendations(...)` output and turns it into visible product cards with:
  - interest tag
  - target category
  - summary
  - first-step guidance
  - direct CTA into `founder.html`
- Added an empty-state CTA so users without saved interests are prompted to update their profile first.
- Updated the profile page to use the newer `app.js` versioned asset so the personalized idea logic is not hidden behind stale script caching.

## Why it matters

- Personalized recommendation logic is more valuable when users can immediately act on it.
- This closes the loop from signup/onboarding interests to profile intent and then into project creation.

## Verification

- `node scripts/validate-static.js`
- `node scripts/run-commercial-gate.js`
