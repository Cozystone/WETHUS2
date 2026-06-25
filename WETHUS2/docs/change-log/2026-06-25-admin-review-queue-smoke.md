# 2026-06-25 Admin Review Queue Smoke

## What changed
- Added backend admin review routes:
  - `GET /admin/review-projects`
  - `POST /admin/review-projects/:projectId/decision`
- Added `scripts/smoke-admin-review-queue.js` to verify:
  - non-admin access is denied
  - manual-review queue returns only pending review projects
  - approve updates the project to `approved`
  - reject updates the project to `rejected`
  - audit events are recorded for both decisions
- Updated `admin.html` to prefer the backend review queue and review decision APIs, with local fallback only if the backend is unavailable.
- Wired the smoke into CI and the commercialization gate.

## Why it matters
- Founder moderation is not complete unless the operator path is also stable.
- Before this change, admin review behavior depended too heavily on local browser state, which is not sufficient for commercial operations.
- The backend review queue now acts as a shared source of truth for review decisions.

## Acceptance signal
- `node scripts/smoke-admin-review-queue.js` passes.
- `node scripts/run-commercial-gate.js` now includes the admin review queue smoke.
