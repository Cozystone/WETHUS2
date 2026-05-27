# Backend health build info

## Change
- Expanded `/health` from `{ ok: true }` to include non-secret backend identity, startup time, build metadata, and security-flag status.
- Production smoke now warns when the live API does not expose this metadata.
- Backend security smoke verifies the local guarded-mode `/health` payload.

## Reason
- Production API drift was observed: `https://wethus-api.onrender.com/health` returned only `{ ok: true }` and no security headers after the repository baseline had moved forward.
- Without a build or feature-flag hint, it is hard to tell whether Render is running an old commit, a different deploy root, or an unconfigured service.

## Expected effect
- Once the hardened backend is deployed, `/health` will show `service: wethus-backend`, a short commit/ref when the platform exposes it, and the status of key security switches.
- Until then, production smoke can surface that the live API is likely older than the repository baseline without failing the whole site smoke.

## Risks
- The payload must stay non-secret. It intentionally exposes only commit/ref and boolean security-flag states.
- Commit metadata may be empty if the hosting platform does not provide a recognized environment variable.

## Rollback criteria
- Roll back if any external health-check integration requires an exact `{ ok: true }` shape and cannot tolerate extra JSON fields.
