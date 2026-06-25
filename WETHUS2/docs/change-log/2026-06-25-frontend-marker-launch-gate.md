# 2026-06-25 Frontend Marker Launch Gate

## Summary
- Updated `scripts/smoke-production.js` so frontend contract checks on:
  - `project-hub.html`
  - `profile.html`
  - `explore_theme.html`
  now also require the shared frontend contract marker.
- Updated `scripts/audit-commercial-readiness.js` so commercialization audit frontend checks use the same marker.
- Updated ops documentation so the Vercel frontend redeploy runbook explicitly treats marker parity as part of the launch-grade frontend baseline.

## Why
- The local baseline already required the marker, but launch-grade production checks were still only validating deeper functional snippets.
- That left a small gap where a page could technically pass behavior snippets while still not advertising the intended commercialization baseline marker.

## Verification
- `node scripts/validate-static.js`
- `node scripts/check-live-frontend-drift.js`
- `node scripts/smoke-production.js`
- `node scripts/audit-commercial-readiness.js`
