# 2026-06-25 Production Smoke Backend Deps And Login Contract Copy

## What changed
- Updated `.github/workflows/production-smoke.yml` to install `WETHUS2/backend` dependencies before running the commercialization gate runner.
- Updated the workflow-dispatch description for `require_frontend_hub_contracts` so it reflects the current contract surface:
  - `index.html`
  - `login.html`
  - `project-hub.html`
  - `profile.html`
  - `explore_theme.html`

## Why
- The commercialization gate runner executes local backend smoke tests, so the production-smoke workflow should not rely on backend dependencies being present implicitly.
- The workflow input copy previously implied a narrower frontend contract surface than the current launch gate actually enforces.

## Verification
- `node scripts/run-commercial-gate.js`
- `node scripts/smoke-production.js`
