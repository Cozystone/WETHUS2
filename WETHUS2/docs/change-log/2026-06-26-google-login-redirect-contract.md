## 2026-06-26 - Google login redirect contract

- Made the login OAuth fallback explicit in backend source:
  - `GOOGLE_LOGIN_REDIRECT_URI` now defaults to `${INTEGRATION_APP_URL}/auth/google/callback`
  - `GOOGLE_LOGIN_REDIRECT_URIS` always includes the login callback path
- Added `GOOGLE_LOGIN_REDIRECT_URI` and `GOOGLE_LOGIN_REDIRECT_URIS` to:
  - `WETHUS2/backend/.env.example`
  - `render.yaml`
  - `scripts/check-deploy-config-parity.js`
- Expanded live verification:
  - `scripts/smoke-production.js` now checks the live `/auth/google/start` redirect contract
  - `scripts/check-live-backend-contract-drift.js` now prints the live Google OAuth start redirect details
- Current note: source is corrected, but the live Render backend still reports build `33f99ca...`, so a backend redeploy is still required before the production redirect path fully matches the new login-specific fallback contract.
