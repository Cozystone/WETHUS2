# 2026-06-25 Project Hub Session Actor Alignment

## What changed
- Exported `currentActorId` through `window.WETHUS` so page-level surfaces can reuse the same actor resolution logic as `app.js`.
- Updated `project-hub.html` to use a shared `currentHubActorId()` helper for:
  - logout link visibility
  - persisted project selection key
  - optional explicit actor header injection
  - leader/member/application ownership checks

## Why
- The app shell already had a session-restored actor fallback, but the project hub still read `currentUserId` directly in several places.
- That mismatch could make the hub temporarily behave like a guest right after refresh, even while the browser session cookie was valid.
- Commercialization hardening needs the same actor identity across app state, hub permissions, and guarded API calls.

## Validation
- `node scripts/validate-static.js`
- `node scripts/smoke-backend-security.js`
- `node scripts/run-commercial-gate.js`
