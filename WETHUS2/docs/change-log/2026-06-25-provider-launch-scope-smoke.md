# 2026-06-25 Provider Launch-Scope Smoke

## What changed
- Added `scripts/smoke-provider-launch-scope.js`.
- The smoke test boots the local backend and verifies the `/integrations/providers` contract for:
  - `launchScope.launchProviders`
  - `launchScope.deferredProviders`
  - provider-level `launchPhase`
  - provider-level `launchIncluded`
  - provider-level `launchNote`
- Wired the smoke into:
  - `scripts/run-commercial-gate.js`
  - `.github/workflows/static-checks.yml`
  - `scripts/plan-commercialization-release.js`

## Why
- Commercial launch readiness now depends on the provider launch-scope contract staying stable.
- This smoke prevents silent regressions where the backend or UI would again blur the line between launch-ready integrations and deferred roadmap integrations.

## Verification
- `node scripts/smoke-provider-launch-scope.js`
- `node scripts/run-commercial-gate.js`
