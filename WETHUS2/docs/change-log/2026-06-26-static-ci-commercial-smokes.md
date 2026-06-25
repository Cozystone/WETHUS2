# 2026-06-26 - Static CI Commercial Smokes

- Added `Integration activity log smoke` and `Google OAuth login smoke` to `.github/workflows/static-checks.yml`.
- These checks were already part of the local/commercial gate, but PR and push CI could still go green without exercising:
  - project-hub activity-log webhook ingestion
  - backend-owned Google OAuth login contract
- This makes CI catch high-value commercialization regressions earlier, before they survive into `main` or require a separate manual gate run.

## Verification

- `node scripts/smoke-integration-activity-log.js`
- `node scripts/smoke-google-oauth-login.js`
- `node scripts/run-commercial-gate.js`
