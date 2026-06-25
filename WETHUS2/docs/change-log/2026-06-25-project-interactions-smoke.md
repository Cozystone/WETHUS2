# 2026-06-25 Project Interactions Smoke

## What changed
- Added `scripts/smoke-project-interactions.js` to verify server-backed interaction durability for:
  - likes
  - comments
  - bookmarks
- The smoke checks both API responses and persistence side effects in the backend JSON state files.
- It also verifies that interaction audit events are recorded for add/remove flows.

## Why it matters
- Commercial readiness requires more than access guards. Core engagement actions need to survive beyond one browser tab and remain consistent for later views.
- This smoke complements `smoke-backend-security.js` by testing state consistency, not just authorization.

## Acceptance signal
- `node scripts/smoke-project-interactions.js` passes.
- `node scripts/run-commercial-gate.js` now includes the interaction consistency smoke.
