# NEXT_STEPS.md

## Start Checklist
- [ ] Read `VISION.md`, `STATUS.md`, `NEXT_STEPS.md`, `MEMORY.md`, and `USER.md`.
- [ ] Run `git status --short --branch`, `git log --oneline -8`, and `git fetch origin`.
- [ ] Create a backup branch before edits: `backup/pre-<task>-YYYYMMDD-HHMMSS`.
- [ ] Do not modify `WETHUS_backup_project_platform_*`.
- [ ] After changes, run the relevant checks: `node scripts/validate-static.js`, `node scripts/smoke-backend-security.js`, and/or `node scripts/smoke-production.js`.

## P1. Render Backend Deployment Drift
- Goal: make production API run the current hardened backend.
- Evidence now: production `/health` returns only `{ "ok": true }`; current repo `/health` should return `service`, `build`, and `security`.
- Tasks:
  - Confirm Render service source repo, branch, root directory, build command, and start command.
  - Redeploy backend from `main`, root `WETHUS2/backend`, start `npm start`.
  - Confirm `https://wethus-api.onrender.com/health` exposes `service: "wethus-backend"`.
  - Re-run `node scripts/smoke-production.js`.
  - Then run with `REQUIRE_WETHUS_API_SECURITY_HEADERS=true`.
- DoD:
  - Production API exposes health metadata and security headers.
  - Production smoke strict mode passes.
  - Drift note is updated in `docs/change-log/`.

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
  - `REQUIRE_WETHUS_API_SECURITY_HEADERS=true` in production smoke
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
- Key docs:
  - `WETHUS2/docs/change-log/2026-05-27-backend-health-build-info.md`
  - `WETHUS2/docs/change-log/2026-05-27-integration-api-actor-guard.md`
  - `WETHUS2/docs/change-log/2026-05-27-cloud-state-access-guard.md`
