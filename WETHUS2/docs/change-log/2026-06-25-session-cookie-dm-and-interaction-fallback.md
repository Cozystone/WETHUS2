# 2026-06-25 Session Cookie DM And Interaction Fallback

## What changed
- Added `credentials: 'include'` to the frontend DM fetch helper so browser session cookies reach the backend.
- Preserved the latest restored server session actor id in `app.js`.
- Updated `currentActorId()` to fall back to the restored session actor when local state has not fully rehydrated yet.

## Why
- Commercialization hardening is moving toward session-first authorization.
- Some frontend interaction paths still depended on local `currentUserId` being restored first.
- Without cookie forwarding, DM endpoints could fail once stricter session-based rules are enabled.

## Impact
- Session-backed interactions stay more stable after refresh and during initial app shell restoration.
- DM flows are more compatible with production session guards.
