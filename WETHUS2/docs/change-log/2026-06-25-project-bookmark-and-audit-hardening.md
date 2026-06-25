# 2026-06-25 - Project bookmark and audit hardening

## What changed
- Added backend-backed bookmark persistence with:
  - `GET /me/bookmarks`
  - `POST /projects/:projectId/bookmarks/toggle`
- Added lightweight project audit-event recording for:
  - like add/remove
  - bookmark add/remove
  - comment create
  - application create/cancel
  - application accept/reject
- Updated frontend bookmark behavior so the local bookmark list rehydrates from the backend session and reconciles after toggle requests.
- Expanded backend security smoke coverage to verify bookmark session protection and founder-visible audit events.

## Why
- Bookmark state was still effectively local-first, which made profile activity and cross-device consistency weaker than the rest of the interaction model.
- Commercial readiness needs a server-side source of truth for saved items and an operator-visible trace of meaningful project interactions.
- Founders and leaders also need better visibility into what changed around a project without relying only on transient UI state.

## Impact
- Logged-in users can recover bookmark state more reliably after refresh or session restore.
- Founder/leader project timelines can now surface core product interactions alongside external integration activity.
- The security smoke suite now protects against silently regressing bookmark/session behavior while hardening continues.
