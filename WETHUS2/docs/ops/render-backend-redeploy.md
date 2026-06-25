# Render Backend Redeploy Runbook

Date: 2026-05-27

## Current Symptom

The frontend deploy can be current while the live backend is not yet running the intended commercialization-safe guard settings. The old stale signal was:

```bash
node -e "fetch('https://wethus-api.onrender.com/health').then(async r => console.log(r.status, await r.text()))"
```

Old stale output:

```text
200 {"ok":true}
```

Current expected hardened output includes:

- `service: "wethus-backend"`
- `security` flags
- `build` metadata
- API response headers including `content-security-policy`, `x-content-type-options`, `x-frame-options`, and `referrer-policy`

As of the current repo state, production already exposes health metadata. The active rollout gap is whether these flags are set to `true`:

- `cloudStateRequireSession`
- `integrationsRequireActor`
- `integrationsRequireSession`
- `integrationsEnforceLaunchScope`
- `projectInteractionsRequireSession`
- `projectAccessRequireMembership`

## Render Service Settings To Confirm

Use the Render service for `wethus-api` and reconcile it with root `render.yaml`.

- Service name: `wethus-api`
- Runtime: Node
- Root directory: `WETHUS2/backend`
- Build command: `npm ci`
- Start command: `npm start`
- Health check path: `/health`
- Auto deploy: enabled from `main`
- Allowed origins: `https://wethus.co.kr,https://www.wethus.co.kr`

Required secret environment variables in Render:

- `JWT_SECRET`
- `ADMIN_BOOTSTRAP_PASSWORD`
- `GOOGLE_CLIENT_ID`
- `OPENAI_API_KEY` when `AI_PROVIDER=openai`

Optional local LLM configuration:

- `AI_PROVIDER=ollama`
- `OLLAMA_BASE_URL=http://127.0.0.1:11434`
- `OLLAMA_MODEL=llama3.2:3b`

Assumption: a hosted Render service cannot reach a developer laptop's `127.0.0.1`; use Ollama only when the model server is reachable from the backend runtime.

## Redeploy Procedure

1. Confirm the latest GitHub `main` commit has green `Static checks` and `Production smoke`.
2. In Render, open the `wethus-api` service.
3. Confirm the service deploy source is `Cozystone/WETHUS2`, branch `main`.
4. Confirm root/build/start settings match `render.yaml`.
5. Confirm required secret env vars exist and no committed placeholder secret is used.
6. Trigger a manual deploy from the latest `main` commit.
7. Wait for Render health checks to pass.

## Post-Deploy Verification

Run the post-deploy helper first:

```powershell
node scripts\print-post-deploy-verification.js
```

Then run the strict production smoke locally:

```bash
REQUIRE_WETHUS_API_SECURITY_HEADERS=true REQUIRE_WETHUS_API_HEALTH_METADATA=true REQUIRE_WETHUS_API_SECURITY_FLAGS=true REQUIRE_WETHUS_BACKEND_CONTRACTS=true REQUIRE_WETHUS_FRONTEND_HUB_CONTRACTS=true node scripts/smoke-production.js
```

On Windows PowerShell:

```powershell
$env:REQUIRE_WETHUS_API_SECURITY_HEADERS='true'
$env:REQUIRE_WETHUS_API_HEALTH_METADATA='true'
$env:REQUIRE_WETHUS_API_SECURITY_FLAGS='true'
$env:REQUIRE_WETHUS_BACKEND_CONTRACTS='true'
$env:REQUIRE_WETHUS_FRONTEND_HUB_CONTRACTS='true'
node scripts\smoke-production.js
```

Run the commercialization audit too:

```powershell
node scripts\audit-commercial-readiness.js
```

Or manually dispatch the GitHub Actions workflow:

- Workflow: `Production smoke`
- Inputs:
  - `require_hardened_api=true`
  - `require_security_flags=true`
  - `require_frontend_hub_contracts=true`
  - `run_commercial_gate=true`

The strict run and commercialization audit must pass before treating the backend as commercialization-ready. This now includes the live `project-hub.html`, `profile.html`, and `explore_theme.html` matching the local interaction contracts.
It also includes live `/health` and `/integrations/providers` matching the local backend contract.

## If Strict Smoke Still Fails

- If `/health` still returns only `{ "ok": true }`, Render is not running the current `WETHUS2/backend/server.js`.
- If security headers are missing but `service` is present, inspect backend middleware order and verify the deployed commit.
- If strict smoke fails on frontend contract snippets, redeploy the static frontend or verify the production domain is serving the latest `WETHUS2/*.html`.
- If the service fails to boot in production, check `JWT_SECRET`; production intentionally refuses weak or missing values.
- If admin bootstrap fails with password `0904`, that is expected. Use a strong `ADMIN_BOOTSTRAP_PASSWORD`, create the admin account once, then rotate or remove the bootstrap secret.

## Rollback

If the redeploy breaks production:

1. Roll back to the previous successful Render deploy.
2. Keep the GitHub commit in place unless code is proven to be the cause.
3. Re-run normal `Production smoke`.
4. Record the failed deploy reason in `WETHUS2/docs/change-log/`.
