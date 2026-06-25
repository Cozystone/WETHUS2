# 2026-06-25 Provider Launch-Scope Enforcement

## What changed
- Added backend launch-scope enforcement support with `INTEGRATIONS_ENFORCE_LAUNCH_SCOPE`.
- When enabled, deferred providers are blocked at the server level for:
  - `/oauth/:provider/start`
  - `/integrations/resources`
- Added `scripts/smoke-provider-launch-scope-enforcement.js`.
- Wired the enforcement smoke into:
  - `scripts/run-commercial-gate.js`
  - `.github/workflows/static-checks.yml`
  - `scripts/plan-commercialization-release.js`

## Why
- UI-only launch-scope handling is not enough for commercial launch readiness.
- This makes backend behavior match the launch policy, so deferred roadmap providers cannot be accidentally presented as usable just because a caller bypasses the browser UI.

## Verification
- `node scripts/smoke-provider-launch-scope-enforcement.js`
- `node scripts/run-commercial-gate.js`
