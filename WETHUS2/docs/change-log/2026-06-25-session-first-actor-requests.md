# 2026-06-25 Session-First Actor Requests

## What changed
- Frontend project interaction requests now default to session-first actor resolution instead of always sending `x-user-id`.
- Project hub API requests also default to session-first mode.
- Explicit actor headers can still be re-enabled with `window.WETHUS_SEND_EXPLICIT_ACTOR = true` for debugging or staged rollback.

## Why
- The backend now supports deriving the actor from the authenticated session subject.
- Keeping `x-user-id` on every request as the default weakens the benefit of the new backend model and makes the production hardening rollout noisier than necessary.
- This change moves the product closer to a commercialization-safe request model without requiring a full frontend rewrite.

## Validation
- `node scripts/validate-static.js`
- `node scripts/smoke-backend-security.js`
- `project-hub.html` inline script parse check via `new Function(...)`
