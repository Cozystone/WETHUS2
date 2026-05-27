# Render Redeploy Runbook

Date: 2026-05-27

## Change

- Added `WETHUS2/docs/ops/render-backend-redeploy.md`.
- Static validation now requires the Render redeploy runbook and checks for key strict-smoke commands.

## Reason

The live API still returns only `{ "ok": true }` from `/health`, while the repository backend exposes service identity, security flags, build metadata, and security headers. The response indicates an operational deployment drift, not a local code failure.

## Expected Effect

- Operators have one canonical backend redeploy checklist.
- The repo keeps the strict production smoke procedure close to the code.
- Future edits cannot accidentally remove the operational path for proving the backend is hardened.

## Risk

- The runbook documents manual Render steps; it does not trigger a Render deploy by itself.
- Strict smoke will fail until Render actually runs the current backend.

## Rollback Criteria

- Roll back if the runbook contradicts the actual Render service configuration.
- Roll back the static validation hook only if the repo moves operational docs to a different canonical path.
