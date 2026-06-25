# 2026-06-25 Render Blueprint Security Defaults

## What changed

- updated `render.yaml` so the production blueprint declares these launch-grade guards as `true`:
  - `CLOUD_STATE_REQUIRE_SESSION`
  - `INTEGRATIONS_REQUIRE_ACTOR`
  - `INTEGRATIONS_REQUIRE_SESSION`
  - `INTEGRATIONS_ENFORCE_LAUNCH_SCOPE`
  - `PROJECT_INTERACTIONS_REQUIRE_SESSION`
  - `PROJECT_ACCESS_REQUIRE_MEMBERSHIP`
- updated the Render/security rollout runbooks to clarify that a live service can still show `false` until Render syncs the latest blueprint env values

## Why

- the backend/runtime code and local smoke coverage already support these guards in the enabled state
- leaving the blueprint defaults at `false` kept production rollout dependent on manual operator memory and made commercialization drift easier to reintroduce

## Validation

- `node scripts/smoke-backend-security.js`
- `node scripts/check-live-backend-contract-drift.js`
- production `/health` confirms the backend contract is current, even though env sync may still be pending
