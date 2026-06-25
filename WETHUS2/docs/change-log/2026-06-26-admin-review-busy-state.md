## 2026-06-26 Admin Review Busy State

- Added a live `opsActionStatus` message area to `admin.html` so operators see whether a project or plan review action is processing, completed, or failed.
- Added per-card busy-state handling for project moderation and plan-request review actions.
- Review buttons are now temporarily disabled while an approve/reject request is in flight, which prevents duplicate submissions from rapid repeated clicks.
- Added inline per-card status messages for processing and failure states to make retry behavior clearer during operations.
- Verified with:
  - `node scripts/validate-static.js`
  - `node scripts/smoke-admin-review-queue.js`
