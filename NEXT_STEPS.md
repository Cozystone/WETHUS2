# NEXT_STEPS.md

## Start Checklist
- [ ] Read `VISION.md`, `STATUS.md`, `NEXT_STEPS.md`, `MEMORY.md`, and `USER.md`.
- [ ] Run `git status --short --branch`, `git log --oneline -8`, and `git fetch origin`.
- [ ] Create a backup branch before edits: `backup/pre-<task>-YYYYMMDD-HHMMSS`.
- [ ] Do not modify `WETHUS_backup_project_platform_*`.
- [ ] After changes, run the relevant checks: `node scripts/validate-static.js`, `node scripts/smoke-backend-security.js`, and/or `node scripts/smoke-production.js`.
- [ ] Before expecting production to match local, run `node scripts/check-deploy-source-readiness.js` to confirm `HEAD`, `origin/main`, and worktree state are aligned.
- [ ] Use `node scripts/describe-commercialization-bundle.js` to see the current dirty worktree grouped by release area before deciding the commit/deploy bundle.
- [ ] Use `node scripts/plan-commercialization-release.js` to print the recommended commit → deploy → verify → rollout order for the current commercialization bundle.
- [ ] Use `node scripts/suggest-commercialization-commits.js` to see a pragmatic 1차/2차/3차 commit split before staging files.
- [ ] Use `node scripts/print-commercialization-staging-plan.js` to print exact `git add ...` commands for each recommended commit group.
- [ ] Use `node scripts/print-production-rollout-status.js` to print the current live backend flags and the next Render env changes before rollout.
- [ ] Before deploy, run `node scripts/run-commercial-gate.js`. For launch-grade verification, use `WETHUS_GATE_STRICT_PRODUCTION=true`, which now also requires deploy-source cleanliness plus live frontend and backend contract parity.

## P1. Production Security Flag Rollout
- Goal: turn the current hardened backend into actual production behavior.
- Evidence now: production `/health` already exposes `service`, `build`, and `security`, but the optional security flags are still disabled and some hardened contract keys are still missing from the live backend.
- Tasks:
  - Confirm Render service settings still match root `render.yaml`.
  - Redeploy backend from the latest `main` once the current local hardening bundle is committed.
  - Enable flags in this order:
    - `CLOUD_STATE_REQUIRE_SESSION=true`
    - `INTEGRATIONS_REQUIRE_ACTOR=true`
    - `INTEGRATIONS_REQUIRE_SESSION=true`
    - `INTEGRATIONS_ENFORCE_LAUNCH_SCOPE=true`
    - `PROJECT_INTERACTIONS_REQUIRE_SESSION=true`
    - `PROJECT_ACCESS_REQUIRE_MEMBERSHIP=true`
  - After each flag, run browser E2E on login, cloud sync, explore interactions, project hub integrations, and application review.
  - Run `node scripts/audit-commercial-readiness.js`.
  - Run `node scripts/print-production-rollout-status.js`.
  - Run strict production smoke with:
  - `REQUIRE_WETHUS_API_SECURITY_HEADERS=true`
  - `REQUIRE_WETHUS_API_HEALTH_METADATA=true`
  - `REQUIRE_WETHUS_API_SECURITY_FLAGS=true`
  - `REQUIRE_WETHUS_BACKEND_CONTRACTS=true`
  - `REQUIRE_WETHUS_FRONTEND_HUB_CONTRACTS=true`
- DoD:
  - Production audit has no blockers.
  - Strict production smoke passes with security flags required and the live `index.html`, `login.html`, `project-hub.html`, `profile.html`, and `explore_theme.html` contracts aligned.
  - `node scripts/check-live-backend-contract-drift.js` passes after backend redeploy.
  - Browser E2E still works for founder, leader, member, and outside applicant flows.

## P2. Admin Bootstrap And Manual Review E2E
- Goal: verify founder submission review flow end to end with real production admin.
- Tasks:
  - Set strong temporary `ADMIN_BOOTSTRAP_PASSWORD` and `ADMIN_EMAIL` in Render.
  - Log in once to create the admin account.
  - Rotate or remove the bootstrap password.
  - Submit projects with disposable user cases: allow, manual review, AI fallback.
  - Confirm admin page shows `manual_review` queue and approve/reject actions work.
- DoD:
  - Browser E2E is documented in `docs/change-log/`.
  - Weak `0904` admin password is not reintroduced.

## P3. Enable Security Switches Gradually
- Goal: turn optional guards into production behavior once browser flows prove compatible.
- Order:
  - `CLOUD_STATE_REQUIRE_SESSION=true`
  - `INTEGRATIONS_REQUIRE_ACTOR=true`
  - `INTEGRATIONS_REQUIRE_SESSION=true`
  - `INTEGRATIONS_ENFORCE_LAUNCH_SCOPE=true`
  - `PROJECT_INTERACTIONS_REQUIRE_SESSION=true`
  - `PROJECT_ACCESS_REQUIRE_MEMBERSHIP=true`
  - `REQUIRE_WETHUS_API_SECURITY_HEADERS=true`, `REQUIRE_WETHUS_API_SECURITY_FLAGS=true`, and `REQUIRE_WETHUS_FRONTEND_HUB_CONTRACTS=true` in production smoke
- DoD:
  - Login, cloud sync, project hub integrations, and manual review still work in browser.
  - GitHub Actions remain green after each switch.

## P4. Product Direction
- Goal: continue the student-startup vision without losing operational safety.
- Tasks:
  - Refine signup interest selection and recommendation scoring.
  - Improve Explore idea recommendations from selected interests.
  - Connect founder submission to similar platform ideas and AI/browser research.
  - Keep UI consistent with the current WETHUS product surface.
- DoD:
  - New user can choose interests and see recommendations.
  - Submitted idea shows similar internal ideas and external/AI analysis in one coherent UI.

## Immediate References
- Current baseline: `fba053e`
- Production: `https://www.wethus.co.kr`
- Production API: `https://wethus-api.onrender.com/health`
- Key checks:
  - `node scripts/validate-static.js`
  - `node scripts/smoke-backend-security.js`
  - `node scripts/smoke-production.js`
  - `node scripts/audit-commercial-readiness.js`
  - `node scripts/check-live-frontend-drift.js`
  - `node scripts/print-production-rollout-status.js`
  - `node scripts/check-deploy-source-readiness.js`
  - `node scripts/describe-commercialization-bundle.js`
  - `node scripts/plan-commercialization-release.js`
  - `node scripts/suggest-commercialization-commits.js`
  - `node scripts/print-commercialization-staging-plan.js`
  - `node scripts/run-commercial-gate.js`
- Key docs:
  - `WETHUS2/docs/change-log/2026-05-27-backend-health-build-info.md`
  - `WETHUS2/docs/change-log/2026-05-27-integration-api-actor-guard.md`
  - `WETHUS2/docs/change-log/2026-05-27-cloud-state-access-guard.md`
  - `WETHUS2/docs/ops/vercel-frontend-redeploy.md`
