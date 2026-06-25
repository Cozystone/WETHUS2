# 2026-06-25 Production Smoke Workflow Commercial Gate

## What changed
- Expanded `.github/workflows/production-smoke.yml` workflow-dispatch inputs to include:
  - `require_security_flags`
  - `require_provider_readiness`
  - `run_commercial_gate`
- The workflow can now run `scripts/audit-commercial-readiness.js` in addition to `scripts/smoke-production.js`.
- The workflow now also runs `scripts/run-commercial-gate.js`, so hosted smoke checks use the same gate runner as local release validation.
- The commercialization audit now runs non-strict on push/schedule by default, and strict only when launch-grade workflow-dispatch inputs demand it.
- `require_provider_readiness` now propagates consistently through:
  - `scripts/smoke-production.js`
  - `scripts/audit-commercial-readiness.js`
  - `scripts/run-commercial-gate.js`
- Added `scripts/check-deploy-config-parity.js` to `.github/workflows/static-checks.yml`.
- Updated the Render redeploy runbook to document the new manual workflow inputs.

## Why
- Local scripts already supported stricter commercialization checks, but the GitHub workflow lagged behind the current release gate.
- This makes the hosted smoke workflow a closer match to the real launch-readiness criteria, including live frontend drift and the local project-application smoke coverage.

## Validation
- reviewed against `.github/workflows/production-smoke.yml`
- `node scripts/validate-static.js`
