# Cloud state access guard

## Change
- Added `CLOUD_STATE_REQUIRE_SESSION` to the backend.
- When enabled, `/cloud/state` reads and writes require a valid session whose email matches the requested account email.
- Password register/login and Google password-link responses now set the same HTTP-only session cookie used by Google login.
- Frontend auth and cloud sync requests now use `credentials: 'include'` so browsers can carry the session cookie.
- Backend security smoke now verifies that `/cloud/state` rejects unauthenticated reads and writes when the guard is enabled.

## Reason
- `/cloud/state` is the MVP cross-device account/project sync endpoint.
- Before this change, knowing an email address was enough to read or overwrite that account's stored state and influence the global project projection.
- A full DB-backed authorization model is still needed, but this creates an operational switch that can close the largest public data access gap after session behavior is verified in production.

## Expected effect
- Default behavior remains compatible until `CLOUD_STATE_REQUIRE_SESSION=true` is enabled.
- Once enabled, anonymous requests to `/cloud/state` fail with `401`, and mismatched session/email requests fail with `403`.
- CI covers the guarded mode so regressions are caught before deploy.

## Risks
- Cross-site cookie handling depends on production browser behavior and Render/Vercel origins.
- If third-party cookies are blocked, `CLOUD_STATE_REQUIRE_SESSION=true` may prevent cloud sync until the frontend/backend share a first-party auth path or token transport.

## Rollback criteria
- Disable `CLOUD_STATE_REQUIRE_SESSION` if production users cannot sync after deploy.
- Keep the session-cookie code and CI coverage unless they directly break login.
