## 2026-06-26 - Google OAuth login smoke

- Added `scripts/smoke-google-oauth-login.js`.
- The smoke test boots the backend with fake Google OAuth configuration and verifies:
  - `GET /auth/google/config` returns the configured client id
  - `GET /auth/google/start` redirects to Google Accounts with the expected OAuth params
  - encoded state preserves `auth_flow=login`, `next_path`, `app_origin`, and `redirect_uri`
  - `GET /auth/google/callback` without `code` fails with the expected `400 code missing` guard
- Wired the smoke into `scripts/run-commercial-gate.js` so login OAuth contract drift is caught before release.
