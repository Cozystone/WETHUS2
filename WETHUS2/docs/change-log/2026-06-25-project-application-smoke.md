# 2026-06-25 Project Application Smoke

## What changed
- Added `scripts/smoke-project-applications.js` to verify the guarded backend application lifecycle in a temporary data environment.
- Covered:
  - outsider application creation
  - applicant self-view filtering
  - leader/founder reviewer access
  - founder acceptance and `teamMembers` propagation
  - legacy `pending` normalization to `applied`
  - cancellation of legacy pending applications
- Added the new smoke to:
  - `scripts/run-commercial-gate.js`
  - `.github/workflows/static-checks.yml`

## Why
- Commercialization readiness depends on the participation funnel staying stable under the stricter session and membership guards.
- The backend already had unit-like guard coverage, but the application lifecycle still needed an end-to-end regression check.

## Validation
- `node scripts/smoke-project-applications.js`
- `node scripts/validate-static.js`
- `node scripts/smoke-backend-security.js`
- `node scripts/run-commercial-gate.js`
