# 2026-06-26 project hub webhook verification drift gate

## What changed

- Extended the shared commercialization frontend contract checks so `project-hub.html` must now keep the `integrationWebhookStatus(...)` helper in addition to the existing webhook modal and test-event controls.
- Updated:
  - `scripts/check-live-frontend-drift.js`
  - `scripts/print-production-rollout-status.js`
  - `scripts/print-commercialization-readiness-summary.js`
  - `scripts/audit-commercial-readiness.js`
  - `scripts/smoke-production.js`
  - `scripts/validate-static.js`

## Why it matters

- Local `project-hub.html` had already gained richer webhook verification UI, but the previous snippet contract was too shallow and could miss that specific live-vs-local drift.
- Operators now get a precise frontend drift signal whenever the deployed hub lacks the webhook verification state logic that the current product UX expects.

## Verification

- `node scripts/validate-static.js`
- `node scripts/check-live-frontend-drift.js`
