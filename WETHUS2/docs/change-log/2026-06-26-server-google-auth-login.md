# 2026-06-26 - Server Google Auth Login

## What changed

- Added backend-driven Google login start/callback routes:
  - `GET /auth/google/start`
  - `GET /auth/google/callback`
- These routes now handle:
  - Google OAuth redirect construction
  - code exchange
  - ID token verification
  - session cookie issuance
  - redirecting the user back to onboarding or their intended page
- Replaced the login page's Google Sign-In widget bootstrap with a simpler server OAuth entry button.

## Why

- The previous login page depended on Google Identity Services widget rendering in the browser.
- That made the auth page more fragile and harder to reason about in commercialization QA.
- Moving the core Google login entry flow to the backend makes the auth surface more stable and keeps session issuance server-owned.

## Verification

- `node scripts/validate-static.js`
- `node scripts/run-commercial-gate.js`
- backend boot smoke with `PORT=0`

## Follow-up

- After deployment, verify live `login.html` matches local and the new `/auth/google/start` route returns a Google OAuth redirect instead of `404`.
