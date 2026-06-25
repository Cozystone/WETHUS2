# 2026-06-25 Auth Return Validation Gate

## What changed
- Expanded `scripts/validate-static.js` so auth-return and onboarding-return contracts are now required in:
  - `WETHUS2/app.js`
  - `WETHUS2/login.html`
  - `WETHUS2/profile.html`
  - `WETHUS2/index.html`
  - `WETHUS2/explore_theme.html`
- Expanded `scripts/smoke-production.js` so production smoke also checks the deployed login/profile/explore surfaces for the critical auth-return snippets.

## Why
- Recent commercialization work added meaningful behavior around:
  - login return routing
  - onboarding return routing
  - comment/apply modal context recovery
- Those flows are easy to regress silently unless the gate treats them as first-class contracts.

## Verification
- `node scripts/validate-static.js`
- `node scripts/smoke-production.js`
