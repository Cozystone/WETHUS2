# STATUS.md

## Current Baseline
- Active product: WETHUS, a student-startup platform for early idea discovery, validation, team/project launch, and execution support.
- Current local hardening work is ahead of the last fully deployed production guard settings.
- Production site smoke passes for `https://www.wethus.co.kr`.
- Production API now exposes backend health metadata at `https://wethus-api.onrender.com/health`.
- Current production blockers now include three separate drift classes:
  - optional security flags are still disabled in production
  - the live frontend is still missing the latest commercialization contracts
  - the live backend is still missing parts of the hardened `/health` and `/integrations/providers` contract

## Completed Work
- Opportunity data rationale documented in `WETHUS2/docs/change-log/2026-05-27-opportunity-data-rationale.md`.
- Founder submission flow fixed so AI allow publishes as `approved`, and review/fallback saves as `manual_review`.
- Client-exposed secret removal, auth hardening, local password hashing, XSS escape passes, and deploy-root backup cleanup are complete.
- Backend security hardening added: security headers, rate limits, SSRF guard for `/tools/fetch-meta`, and CI-backed backend security smoke.
- `/cloud/state` now has optional `CLOUD_STATE_REQUIRE_SESSION` protection.
- Integration/activity/status/external identity APIs now have optional `INTEGRATIONS_REQUIRE_ACTOR` and `INTEGRATIONS_REQUIRE_SESSION` protection.
- Project-scoped integration/activity/status APIs now have optional `PROJECT_ACCESS_REQUIRE_MEMBERSHIP` protection.
- `/health` now exposes non-secret service/build/security-flag metadata in the repository baseline.
- Root `render.yaml` now defines the intended Render backend service settings for `wethus-api`.
- GitHub Actions now run static validation, backend syntax check, backend security smoke, and production smoke.
- `scripts/audit-commercial-readiness.js` now audits current production blockers for commercialization.
- `scripts/run-commercial-gate.js` now includes live frontend drift detection, so launch checks surface page-level Vercel drift before strict rollout claims.

## Operational Switches
- `ADMIN_BOOTSTRAP_PASSWORD`: set a strong temporary value only for first admin creation, then rotate or remove.
- `CLOUD_STATE_REQUIRE_SESSION=true`: enable after browser login/session cookies are verified in production.
- `INTEGRATIONS_REQUIRE_ACTOR=true`: enable after project hub requests are verified to send `x-user-id`.
- `INTEGRATIONS_REQUIRE_SESSION=true`: enable after session cookies are verified; it requires session `sub` to match `x-user-id`.
- `INTEGRATIONS_ENFORCE_LAUNCH_SCOPE=true`: enable when deferred roadmap providers must be hard-blocked at the backend level in production.
- `PROJECT_INTERACTIONS_REQUIRE_SESSION=true`: enable after likes/comments/applications are browser-verified against the session cookie.
- `PROJECT_ACCESS_REQUIRE_MEMBERSHIP=true`: enable after project hub integrations/activity/status APIs are browser-verified for founder, leader, member, and outsider roles.
- `REQUIRE_WETHUS_API_SECURITY_HEADERS=true`: enable in production smoke after Render is confirmed to run the hardened backend.
- `REQUIRE_WETHUS_API_SECURITY_FLAGS=true`: enable in production smoke when all session/membership guards are intentionally active in production.
- `REQUIRE_WETHUS_FRONTEND_HUB_CONTRACTS=true`: enable in strict launch-grade checks when the live `index.html`, `login.html`, `project-hub.html`, `profile.html`, and `explore_theme.html` match the current local interaction contracts.
  - This now includes the shared frontend contract marker `2026-06-25-commercial-hardening-v1`.
- `REQUIRE_WETHUS_BACKEND_CONTRACTS=true`: enable in strict launch-grade checks when the live Render backend exposes the hardened `/health` and `/integrations/providers` contract surface expected by the current local source.
- `WETHUS_DEPLOY_SOURCE_STRICT=true`: enable when the local worktree must be clean and aligned with `origin/main` before treating the run as launch-grade.

## Remaining Risks
- Manual review E2E still requires a real admin account. The weak legacy password `0904` is intentionally rejected.
- Current guards are MVP safety rails. Full protection still needs DB-backed sessions, projects, memberships, review queue, audit logs, and per-project authorization.
- `x-user-id` is still present in current frontend requests, but the backend can now derive the actor from the session subject when the header is omitted.
- Production security and launch-scope enforcement flags are still disabled and are the primary commercialization blocker found by `scripts/audit-commercial-readiness.js`.
- Live `project-hub.html` is still missing the latest stable render/activity/status contract snippets, and live `login.html` is also missing the current auth-return contract, so strict production smoke should keep treating frontend drift as a launch blocker.
- `scripts/check-live-frontend-drift.js` is now part of the commercialization gate, even in non-strict mode as an optional warning step, so live page drift is harder to miss before deploy.
- `scripts/check-live-backend-contract-drift.js` is now part of the commercialization gate, even in non-strict mode as an optional warning step, so Render contract lag is harder to miss before deploy.
- Live response headers show `www.wethus.co.kr` is currently served by Vercel, and the drift pattern is page-level: `index.html`, `login.html`, `project-hub.html`, `profile.html`, and `explore_theme.html` are still behind the current local commercialization bundle.
- Live Render responses also show backend contract lag: `/health` still misses some hardened security keys, and `/integrations/providers` still misses launch-scope metadata fields.
- Vercel production for `wethus-2` currently serves commit `560e541`, which matches `origin/main`; the remaining repo-vs-live drift is therefore primarily due to the current local uncommitted commercialization work not being deployed yet.
- Notion, Slack, and Figma integrations are still `setup_required` in production.

## Working Rules
- Do not edit `WETHUS_backup_project_platform_*`; use them only as references.
- Create a `backup/pre-*` branch before edits.
- Do not guess production state. Record assumptions and verify with current command/web evidence.
- Keep security/operations changes paired with tests, change-log notes, and commits.
