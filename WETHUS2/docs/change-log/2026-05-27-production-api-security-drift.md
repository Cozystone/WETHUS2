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
- Set `REQUIRE_WETHUS_API_SECURITY_HEADERS=true` in CI or a manual run after Render is confirmed to deploy the hardened backend, then the same smoke will fail on drift.

## Risk
- Until production is redeployed, live API responses do not include the new browser-facing security headers.
- Rate limiting and SSRF hardening are also not proven live by the observed `/health` response.

## Next action
- Confirm Render deploy source/root and trigger a backend redeploy from `main`.
- Re-run `node scripts/smoke-production.js` with `REQUIRE_WETHUS_API_SECURITY_HEADERS=true`.
- Once it passes, enable the env flag in the production smoke workflow.
