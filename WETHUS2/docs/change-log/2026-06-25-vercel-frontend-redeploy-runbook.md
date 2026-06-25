# 2026-06-25 Vercel Frontend Redeploy Runbook

## Summary
- Added `WETHUS2/docs/ops/vercel-frontend-redeploy.md`.
- Enhanced `scripts/check-live-frontend-drift.js` to print live response headers (`server`, `date`, `last-modified`, `etag`, `cache-control`, `age`) alongside hash and snippet parity.
- Updated the `Production smoke` workflow so `require_frontend_hub_contracts=true` also makes the commercialization audit strict.

## Why
- Live evidence showed the frontend is served by Vercel and the drift is page-level, not site-wide.
- `project-hub.html` was stale while `profile.html` and `explore_theme.html` already matched local, so operators needed a frontend-specific redeploy runbook rather than only backend rollout docs.
- Workflow strictness needed to stay consistent when frontend-contract launch checks are explicitly requested.

## Verification
- `node --check scripts/check-live-frontend-drift.js`
- `node scripts/check-live-frontend-drift.js`
