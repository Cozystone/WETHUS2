# 2026-06-25 Discovery Visibility Smoke

## What changed
- Added `WETHUS.listExploreProjects()` so explore visibility can intentionally include:
  - all approved projects
  - the current founder's own `manual_review` and `rejected` projects
- Updated `explore_theme.html` to use the new helper instead of starting from approved-only project data.
- Added `scripts/smoke-discovery-visibility.js` to verify:
  - approved projects remain visible
  - the founder can still see their own `manual_review` and `rejected` projects
  - other users' pending review projects stay hidden
  - recommendation ranking still prefers more recently approved projects when popularity is equal

## Why it matters
- The intended commercialization policy was "pending/rejected stay hidden from others, but the founder can still see their own status."
- Before this change, the explore page started from approved-only data, which could silently hide the founder's own moderation-status projects.

## Acceptance signal
- `node scripts/smoke-discovery-visibility.js` passes.
- `node scripts/run-commercial-gate.js` now includes the discovery visibility smoke.
