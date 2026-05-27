# Production API security drift

## Observation
- Local backend code now emits baseline security headers and has a CI-backed backend security smoke.
- Production API `https://wethus-api.onrender.com/health` still returns `200 {"ok":true}` without the new security headers:
  - `content-security-policy`
  - `x-content-type-options`
  - `x-frame-options`
  - `referrer-policy`

## Assessment
- This is an operational drift between the repository baseline and the live Render API.
- Assumption: the Render service has not redeployed the latest backend commit, or it is deployed from a path/configuration not visible in this repository.
- The frontend production smoke still passes because the API remains reachable, but the hardening is not yet live.

## Action taken
- Added a production smoke check for API security headers in warning mode.
- Set `REQUIRE_WETHUS_API_SECURITY_HEADERS=true` and `REQUIRE_WETHUS_API_HEALTH_METADATA=true` in CI or a manual run after Render is confirmed to deploy the hardened backend, then the same smoke will fail on drift.
- Added a `Production smoke` workflow dispatch input named `require_hardened_api`; run it with `true` after a Render redeploy to prove the live API matches the hardened repository baseline.

## Risk
- Until production is redeployed, live API responses do not include the new browser-facing security headers.
- Rate limiting and SSRF hardening are also not proven live by the observed `/health` response.

## Next action
- Confirm Render deploy source/root and trigger a backend redeploy from `main`.
- Re-run `node scripts/smoke-production.js` with `REQUIRE_WETHUS_API_SECURITY_HEADERS=true` and `REQUIRE_WETHUS_API_HEALTH_METADATA=true`, or manually dispatch `Production smoke` with `require_hardened_api=true`.
- Once it passes, make the hardened API requirement the default for the production smoke workflow.
