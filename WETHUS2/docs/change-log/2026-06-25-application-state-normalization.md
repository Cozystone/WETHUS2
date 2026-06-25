# 2026-06-25 Application State Normalization

## What changed
- Added shared application status normalization in `app.js` so legacy `pending` and current `applied` data resolve to one active-review meaning.
- Added `isActiveApplicationStatus(...)` to keep recommendation, participation, and apply-button logic aligned across screens.
- Added `mergeProjectApplications(...)` so project-hub reads from the backend can refresh local application state without waiting for a full cloud sync.
- Updated local apply/cancel guards to use the normalized status logic, reducing duplicate application and stale-button risk.
- Added matching normalization in `backend/server.js` so project application APIs return normalized status values and legacy `pending` rows still behave correctly for duplicate detection and cancellation.

## Why
- The product was moving toward backend-driven application review states, but some frontend surfaces still assumed older local-only status values.
- The backend could still store or return legacy status strings, which risked reintroducing inconsistent behavior after refresh or cross-device use.
- Commercialization readiness requires the same project-application truth to appear consistently in home, explore, project hub, and participation flows.

## Validation
- `node scripts/validate-static.js`
- `node scripts/smoke-backend-security.js`
- `node scripts/run-commercial-gate.js`
- `project-hub.html` inline script parse check via `new Function(...)`
