# 2026-06-25 Project Hub Application Ops UI

## What changed
- Reconciled project hub application UI with the backend's real status model (`applied`, `accepted`, `rejected`, `cancelled`).
- Added manager-aware application inbox behavior so founders and leaders can see queue counts and review cards consistently.
- Fixed applicant-side filtering to use the actual backend applicant identifier field.
- Added in-hub application cancellation for applicants while a submission is still under review.
- Added clearer role-based empty states for team members versus outside applicants.

## Why
- The previous UI expected `pending` and `applicantId`, while the backend returns `applied` and `userId`.
- That mismatch could hide a user's own application, disable review buttons incorrectly, and reduce trust in the project hub workflow.
- Commercialization readiness requires the project team and applicants to see a consistent, reliable application state.

## Validation
- `node scripts/validate-static.js`
- `project-hub.html` inline script parse check via `new Function(...)`
