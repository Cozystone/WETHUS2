# Security Flag Rollout Runbook

Date: 2026-06-25

## Purpose

This runbook describes how to turn the current optional backend guards into real production behavior without breaking the live WETHUS user flows.

Use this after the current hardening bundle is deployed to Render.
The repository blueprint in `render.yaml` now declares all six launch-grade guards as `true`; if the live service still shows `false`, the Render service has not yet synced the latest blueprint env values.

## Target Production Flags

These backend environment variables are now intended to be `true` in production:

- `CLOUD_STATE_REQUIRE_SESSION`
- `INTEGRATIONS_REQUIRE_ACTOR`
- `INTEGRATIONS_REQUIRE_SESSION`
- `INTEGRATIONS_ENFORCE_LAUNCH_SCOPE`
- `PROJECT_INTERACTIONS_REQUIRE_SESSION`
- `PROJECT_ACCESS_REQUIRE_MEMBERSHIP`

These verification variables should be used for strict launch-grade checks:

- `REQUIRE_WETHUS_API_SECURITY_HEADERS=true`
- `REQUIRE_WETHUS_API_HEALTH_METADATA=true`
- `REQUIRE_WETHUS_API_SECURITY_FLAGS=true`
- `REQUIRE_WETHUS_BACKEND_CONTRACTS=true`
- `REQUIRE_WETHUS_FRONTEND_HUB_CONTRACTS=true`

## Before You Start

1. Confirm the latest backend deploy contains the current hardening work.
2. Confirm the Render service has synced the latest `render.yaml` env values instead of older saved service values.
3. Run:
   - `node scripts/validate-static.js`
   - `node scripts/smoke-backend-security.js`
   - `node scripts/run-commercial-gate.js`
4. Confirm production `/health` returns:
   - `service: "wethus-backend"`
   - `build`
   - `security`
5. Prepare at least these browser test identities:
   - founder account
   - leader account
   - member account
   - outside applicant account
   - admin account

## Rollout Order

If the service is still carrying older saved env values, apply the latest blueprint settings first. After that, treat the rollout order below as the verification sequence for the now-enabled flags.

### Phase 1. `CLOUD_STATE_REQUIRE_SESSION=true`

Expected impact:

- `/cloud/state` reads and writes require a valid session email.

Browser checks:

- login still works
- page refresh restores session
- profile/project state sync still works
- founder submission still completes

Command checks:

- `node scripts/run-commercial-gate.js`
- `node scripts/audit-commercial-readiness.js`

Rollback:

- set `CLOUD_STATE_REQUIRE_SESSION=false`

### Phase 2. `INTEGRATIONS_REQUIRE_ACTOR=true`

Expected impact:

- integration/activity/status endpoints require an actor source
- backend can now derive actor from session when the client omits `x-user-id`

Browser checks:

- project hub opens
- integration list loads
- connected resources still render
- activity/status widgets still load

Command checks:

- `node scripts/run-commercial-gate.js`

Rollback:

- set `INTEGRATIONS_REQUIRE_ACTOR=false`

### Phase 3. `INTEGRATIONS_REQUIRE_SESSION=true`

Expected impact:

- integration actor must match the authenticated session when `x-user-id` is sent
- session-only actor fallback should continue to work

Browser checks:

- founder can open project hub integrations
- leader can open project hub integrations
- outsider cannot access project-scoped integration surfaces
- OAuth completion still returns to the hub correctly

Command checks:

- `node scripts/run-commercial-gate.js`

Rollback:

- set `INTEGRATIONS_REQUIRE_SESSION=false`

### Phase 4. `INTEGRATIONS_ENFORCE_LAUNCH_SCOPE=true`

Expected impact:

- deferred roadmap providers are blocked at the backend level
- `/oauth/:provider/start` and `/integrations/resources` reject deferred providers
- launch-scope providers such as Google Docs and Google Sheets continue to work

Browser checks:

- Google Docs/Sheets connection still opens normally
- deferred providers show roadmap/deferred messaging
- direct deferred OAuth starts are blocked

Command checks:

- `node scripts/smoke-provider-launch-scope.js`
- `node scripts/smoke-provider-launch-scope-enforcement.js`
- `node scripts/run-commercial-gate.js`

Rollback:

- set `INTEGRATIONS_ENFORCE_LAUNCH_SCOPE=false`

### Phase 5. `PROJECT_INTERACTIONS_REQUIRE_SESSION=true`

Expected impact:

- likes, comments, and project applications require a valid session

Browser checks:

- like works for signed-in user
- comment works for signed-in user
- outside applicant can submit application
- applicant can cancel application
- project hub reflects the change immediately

Command checks:

- `node scripts/run-commercial-gate.js`

Rollback:

- set `PROJECT_INTERACTIONS_REQUIRE_SESSION=false`

### Phase 6. `PROJECT_ACCESS_REQUIRE_MEMBERSHIP=true`

Expected impact:

- project-scoped integration/activity/insight/status APIs require membership
- founder and leader can manage project-scoped resources
- members can view but not manage
- outsiders are blocked

Browser checks:

- founder can review applications
- leader can review applications
- member can view allowed project hub surfaces but not manager actions
- outsider is blocked from project-scoped protected data

Command checks:

- `node scripts/run-commercial-gate.js`
- `REQUIRE_WETHUS_BACKEND_CONTRACTS=true WETHUS_GATE_STRICT_PRODUCTION=true node scripts/run-commercial-gate.js`

Rollback:

- set `PROJECT_ACCESS_REQUIRE_MEMBERSHIP=false`

## Launch Gate

Treat the platform as commercialization-ready only when all of the following are true:

1. All six production flags are enabled, whether through synced blueprint values or explicit service env overrides.
2. `REQUIRE_WETHUS_BACKEND_CONTRACTS=true WETHUS_GATE_STRICT_PRODUCTION=true node scripts/run-commercial-gate.js` passes.
3. Live `index.html`, `login.html`, `project-hub.html`, `profile.html`, and `explore_theme.html` match the current local interaction contracts.
4. Live Render backend `/health` and `/integrations/providers` expose the current hardened contract surface.
5. Browser E2E passes for founder, leader, member, outsider, and admin flows.
6. Founder submission moderation and admin manual review both work in production.
7. No blocking warnings remain in the commercialization audit except intentional provider setup gaps.

## GitHub Automation

Use `.github/workflows/launch-readiness.yml` as the recurring strict proof for launch state.

- `workflow_dispatch`: on-demand launch-grade verification before a release decision
- daily schedule: catches silent production drift without waiting for a manual check
- uploaded artifact: preserves the latest commercialization summary and rollout status outputs for ops review
- JSON artifacts: allow future dashboards or monitors to consume the latest launch-readiness evidence without parsing prose
- GitHub step summary: shows the latest launch verdict and main blockers directly in the Actions UI
- launch snapshot artifact: gives operators one shareable markdown/JSON snapshot instead of piecing together multiple raw outputs
- summary artifact: preserves the same launch summary shown in the Actions UI for later sharing or audit trails
- local export bundle: lets operators create a timestamped launch evidence folder from the current machine without relying on GitHub Actions artifacts

If this workflow fails, treat it as a launch blocker until:

1. `node scripts/print-commercialization-readiness-summary.js` is clean
2. `node scripts/print-production-rollout-status.js` is clean
3. `REQUIRE_WETHUS_BACKEND_CONTRACTS=true WETHUS_GATE_STRICT_PRODUCTION=true node scripts/run-commercial-gate.js` passes again

## Known Non-Blocking Warnings

These can remain warnings if they are intentionally not part of the current launch scope:

- Notion OAuth still `setup_required`
- Slack OAuth still `setup_required`
- Figma OAuth still `setup_required`

If any of those are marketed as live features, treat them as blockers instead.

## If Something Breaks

1. Roll back only the most recently enabled flag.
2. Re-run:
   - `node scripts/run-commercial-gate.js`
3. Capture:
   - exact flag values
   - browser step that failed
   - API route and response
4. Write the failure into a new `WETHUS2/docs/change-log/YYYY-MM-DD-*.md` note before retrying.
