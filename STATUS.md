# STATUS.md

## Current Baseline
- Active product: WETHUS, a student-startup platform for early idea discovery, validation, team/project launch, and execution support.
- Reliable repo baseline: `main` / `origin/main` at `fba053e chore: expose backend health build info`.
- Latest GitHub checks at this baseline: Static checks passed, Production smoke passed.
- Production site smoke passes for `https://www.wethus.co.kr`.
- Production API drift remains: `https://wethus-api.onrender.com/health` still returns only `{ "ok": true }`, with no security headers or build/security metadata.

## Completed Work
- Opportunity data rationale documented in `WETHUS2/docs/change-log/2026-05-27-opportunity-data-rationale.md`.
- Founder submission flow fixed so AI allow publishes as `approved`, and review/fallback saves as `manual_review`.
- Client-exposed secret removal, auth hardening, local password hashing, XSS escape passes, and deploy-root backup cleanup are complete.
- Backend security hardening added: security headers, rate limits, SSRF guard for `/tools/fetch-meta`, and CI-backed backend security smoke.
- `/cloud/state` now has optional `CLOUD_STATE_REQUIRE_SESSION` protection.
- Integration/activity/status/external identity APIs now have optional `INTEGRATIONS_REQUIRE_ACTOR` and `INTEGRATIONS_REQUIRE_SESSION` protection.
- `/health` now exposes non-secret service/build/security-flag metadata in the repository baseline.
- Root `render.yaml` now defines the intended Render backend service settings for `wethus-api`.
- GitHub Actions now run static validation, backend syntax check, backend security smoke, and production smoke.

## Operational Switches
- `ADMIN_BOOTSTRAP_PASSWORD`: set a strong temporary value only for first admin creation, then rotate or remove.
- `CLOUD_STATE_REQUIRE_SESSION=true`: enable after browser login/session cookies are verified in production.
- `INTEGRATIONS_REQUIRE_ACTOR=true`: enable after project hub requests are verified to send `x-user-id`.
- `INTEGRATIONS_REQUIRE_SESSION=true`: enable after session cookies are verified; it requires session `sub` to match `x-user-id`.
- `REQUIRE_WETHUS_API_SECURITY_HEADERS=true`: enable in production smoke after Render is confirmed to run the hardened backend.

## Remaining Risks
- Render backend appears stale or deployed from a different path. Latest repo `/health` should expose `service: "wethus-backend"` and security flags, but production does not yet.
- Manual review E2E still requires a real admin account. The weak legacy password `0904` is intentionally rejected.
- Current guards are MVP safety rails. Full protection still needs DB-backed sessions, projects, memberships, review queue, audit logs, and per-project authorization.
- `x-user-id` is still client-visible unless `INTEGRATIONS_REQUIRE_SESSION=true` is enabled.
- Production security flags should be enabled gradually after a browser smoke with a disposable user and admin.

## Working Rules
- Do not edit `WETHUS_backup_project_platform_*`; use them only as references.
- Create a `backup/pre-*` branch before edits.
- Do not guess production state. Record assumptions and verify with current command/web evidence.
- Keep security/operations changes paired with tests, change-log notes, and commits.
