# 2026-06-25 Live Frontend Drift Check

## Summary
- Added `scripts/check-live-frontend-drift.js`.
- The script compares critical live frontend pages against the local commercialization baseline:
  - `project-hub.html`
  - `profile.html`
  - `explore_theme.html`
- It prints normalized SHA-256 hashes and snippet-level parity so operators can quickly tell whether the production domain is serving the expected static files.
- Updated the `Production smoke` workflow so the commercialization audit also receives `REQUIRE_WETHUS_FRONTEND_HUB_CONTRACTS`.

## Why
- The repo already had strict smoke warnings for frontend drift, but operators still needed a clearer, page-by-page proof of what exactly differed on the live domain.
- The workflow audit step previously did not receive the frontend contract requirement env, so dispatch-level strictness could diverge between smoke and commercialization audit.

## Verification
- `node --check scripts/check-live-frontend-drift.js`
- `node scripts/check-live-frontend-drift.js`
