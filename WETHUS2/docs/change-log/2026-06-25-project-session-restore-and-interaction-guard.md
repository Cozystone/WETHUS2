# Project session restore and interaction guard

## Change
- Added `PROJECT_INTERACTIONS_REQUIRE_SESSION` to the backend.
- When enabled, likes, comments, and project application APIs now require both an actor and a matching session subject.
- `/auth/session` now returns the matched sanitized user together with the decoded session.
- Frontend boot now attempts session restore before building the authenticated navigation shell.
- Frontend logout now also clears the backend session cookie.
- Backend security smoke now checks the new health flag plus project interaction session enforcement.

## Reason
- The MVP already used session cookies for login, but several project interactions still trusted only client-supplied actor ids.
- Refreshing the page could leave the frontend and backend disagreeing about the logged-in user, which is risky for commercialization and confusing in real use.

## Expected effect
- Refreshing after login should restore the current user from the server session when the backend is reachable.
- Enabling `PROJECT_INTERACTIONS_REQUIRE_SESSION=true` blocks spoofed likes/comments/applications that do not match the active session.
- Default production behavior stays compatible until the new flag is explicitly enabled.

## Risks
- Local-only auth fallback flows can still exist during development if the backend is unavailable.
- This is still an interim hardening step; full commercialization requires DB-backed authorization and per-project membership checks.

## Rollback criteria
- If authenticated project interactions fail after enabling the flag, set `PROJECT_INTERACTIONS_REQUIRE_SESSION=false` and verify session restore plus `x-user-id` propagation before re-enabling.
