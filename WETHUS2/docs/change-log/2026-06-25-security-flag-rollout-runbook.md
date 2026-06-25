# 2026-06-25 Security Flag Rollout Runbook

## What changed
- Added `WETHUS2/docs/ops/security-flag-rollout.md`.
- Documented the production rollout order for:
  - `CLOUD_STATE_REQUIRE_SESSION`
  - `INTEGRATIONS_REQUIRE_ACTOR`
  - `INTEGRATIONS_REQUIRE_SESSION`
  - `PROJECT_INTERACTIONS_REQUIRE_SESSION`
  - `PROJECT_ACCESS_REQUIRE_MEMBERSHIP`
- Added browser and command verification checkpoints for each phase.
- Added a launch gate definition using `scripts/run-commercial-gate.js`.

## Why
- The current main commercialization blocker is no longer missing code; it is safely enabling the existing hardening in production.
- A concrete rollout order reduces the chance of enabling multiple flags at once and losing track of which change broke a user flow.

## Validation
- `node scripts/validate-static.js`
- reviewed against `scripts/run-commercial-gate.js`
