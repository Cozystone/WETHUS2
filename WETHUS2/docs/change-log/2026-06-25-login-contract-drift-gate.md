# 2026-06-25 Login Contract Drift Gate

## What changed
- Added the shared frontend contract marker to `WETHUS2/login.html`.
- Expanded frontend drift/readiness reporting so `login.html` is audited alongside:
  - `index.html`
  - `project-hub.html`
  - `profile.html`
  - `explore_theme.html`
- The commercialization summaries now treat the deployed login auth-return contract as part of launch readiness.

## Why
- `scripts/smoke-production.js` was already checking deployed login auth-return snippets, but the broader drift/readiness summaries still under-reported login page drift.
- That gap made commercialization reports look slightly healthier than the actual live state whenever login was behind deploy.
- `login.html` is a revenue-critical commercial surface because users can be forced through it during support, comment, apply, and founder flows.

## Verification
- `node scripts/validate-static.js`
- `node scripts/check-live-frontend-drift.js`
- `node scripts/print-commercialization-readiness-summary.js`
- `node scripts/print-production-rollout-status.js`
