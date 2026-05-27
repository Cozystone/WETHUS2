# Production Smoke Strict Dispatch

Date: 2026-05-27

## Change

- Added `REQUIRE_WETHUS_API_HEALTH_METADATA` to `scripts/smoke-production.js`.
- When strict API metadata is required, the production smoke fails if `/health` lacks `service`, `security`, or `build` metadata.
- Added a manual GitHub Actions input, `require_hardened_api`, to the `Production smoke` workflow.

## Reason

The live API still returns only `{ "ok": true }`, so the scheduled production smoke can confirm uptime but cannot prove that the hardened backend is deployed. The repository needed an operator-friendly strict mode that can be run immediately after a Render redeploy.

## Expected Effect

- Normal push/scheduled smoke remains non-blocking while the known Render drift exists.
- Manual strict smoke can fail loudly until the live API exposes security headers and health metadata.
- After Render is confirmed healthy, the strict setting can become the default workflow behavior.

## Risk

- Turning strict mode on before Render is redeployed will fail the workflow by design.
- Health metadata should stay non-secret; do not add absolute data paths, secrets, or tokens to `/health`.

## Rollback Criteria

- Roll back if workflow dispatch inputs break scheduled or push-triggered production smoke.
- Roll back if an external uptime check cannot tolerate stricter manual smoke behavior.
