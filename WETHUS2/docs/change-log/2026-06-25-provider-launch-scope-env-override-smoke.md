# 2026-06-25 Provider Launch-Scope Env Override Smoke

## What changed
- Added `scripts/smoke-provider-launch-scope-env-override.js`.
- The smoke boots the backend with:
  - `WETHUS_LAUNCH_PROVIDERS`
  - `WETHUS_DEFERRED_PROVIDERS`
- It verifies that `/integrations/providers` follows the env override instead of only the checked-in config file.
- Wired the smoke into:
  - `scripts/run-commercial-gate.js`
  - `.github/workflows/static-checks.yml`
  - `scripts/plan-commercialization-release.js`

## Why
- Commercial launch policy may need to change by environment or rollout phase.
- If env overrides drift from the checked-in config but the backend or smoke tests ignore that path, production can silently expose the wrong launch/deferred provider set.

## Verification
- `node scripts/smoke-provider-launch-scope-env-override.js`
- `node scripts/run-commercial-gate.js`
