## 2026-06-26 - Liked Project Sync

- Added `GET /me/liked-projects` so the backend can return the current actor's authoritative liked-project list.
- Added `mergeServerLikedProjects()` and `refreshServerLikes()` to `app.js` so liked state is re-synced after login/session restore, cloud sync, and like toggles.
- This closes a commercialization gap where likes could look correct only in the current tab/session while profile liked tabs or reloaded pages lagged behind the real backend state.
- Extended `scripts/smoke-project-interactions.js` so the like lifecycle now also verifies the new liked-project endpoint after add/remove.
- Extended `scripts/validate-static.js` so the frontend interaction contract now requires the liked-project sync helpers alongside bookmark sync.

## Verification

- `node scripts/smoke-project-interactions.js`
- `node scripts/validate-static.js`
- `node scripts/run-commercial-gate.js`
