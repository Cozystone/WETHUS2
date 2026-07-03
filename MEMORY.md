# MEMORY.md

## User Context
- User prefers Korean conversation and practical progress.
- Always create a backup branch before edits.
- Do not edit `WETHUS_backup_project_platform_*` unless explicitly asked.
- Do not guess production state. Mark assumptions and verify from current evidence.
- Keep changes revertible, documented, tested, committed, and pushed.

## Product Context
- WETHUS is moving toward a student-startup support platform.
- Important product direction:
  - signup interest selection,
  - interest-based Explore recommendations,
  - founder idea submission,
  - internal similar-idea matching,
  - AI/browser research for similar external items,
  - consistent WETHUS UI/UX.
- Project submission must be moderated by local/server LLM first, then either publish or enter manual admin review.

## Current Repo Baseline
- Repo: `Cozystone/WETHUS2.git`
- Branch: `main`
- Baseline commit: `fba053e chore: expose backend health build info`
- Latest confirmed checks: GitHub Static checks success, GitHub Production smoke success.
- Local worktree should be clean before starting new work.

## Recent Security/Operations Work
- Removed client-exposed secrets and plaintext local auth storage.
- Hardened backend auth, admin bootstrap, JWT secret requirements, cookies, and password hashing.
- Added XSS escaping across major static surfaces.
- Added security headers, rate limits, SSRF guard, backend security smoke, and production smoke drift warnings.
- Added optional guards:
  - `CLOUD_STATE_REQUIRE_SESSION`
  - `INTEGRATIONS_REQUIRE_ACTOR`
  - `INTEGRATIONS_REQUIRE_SESSION`
- Added `/health` build/security metadata for drift diagnosis.

## Production Health
- Render backend drift was resolved.
- Latest verified on 2026-07-03 KST: `https://wethus-api.onrender.com/health` returns `service: "wethus-backend"`, build commit `39f522d5b69a`, `ref: "main"`, and the expected security flags including `dmRequireSession: true` and `tokenEncryptionConfigured: true`.
- Continue verifying production from live endpoints before making deployment assumptions.

## High-Priority Next Moves
- Bootstrap admin with a strong temporary password, then rotate/remove it.
- Browser-test founder submit to manual review and admin approve/reject.
- Enable security flags gradually after browser confirmation.
- Plan DB-backed sessions/projects/review queue/memberships for real authorization.
