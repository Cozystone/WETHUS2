# Render backend blueprint

## Change
- Added root-level `render.yaml` for the WETHUS backend service.
- The blueprint pins the service name, runtime, root directory, build command, start command, health check path, and non-secret production defaults.
- Secret environment variables are declared with `sync: false` so they must be supplied in Render and are not committed.

## Reason
- Production API drift is the current top operational risk.
- The live API still returns only `{ "ok": true }` from `/health`, while the repository baseline now exposes backend service/build/security metadata and security headers.
- Without a repo-level Render blueprint, the backend can easily be deployed from the wrong monorepo root or with stale commands.

## Expected effect
- Render can be configured or reconciled from the repository root with a deterministic backend service definition.
- The service should build from `WETHUS2/backend` using `npm ci` and start with `npm start`.
- Once Render runs this baseline, `/health` should identify `service: "wethus-backend"` and include security flag state.

## Risks
- Applying a blueprint to an existing service may update service settings. Review plan, region, environment variables, and custom domains before syncing.
- `plan: free` matches a conservative default but may need adjustment if the existing service uses another plan.
- Optional security flags remain `false` until browser flows prove compatible.

## Rollback criteria
- Revert `render.yaml` if it conflicts with the existing manually managed Render service.
- Do not roll back backend security code because of blueprint mismatch; fix the Render settings instead.
