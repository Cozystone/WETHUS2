# 2026-06-25 Login Contract Audit Alignment

## What changed
- Promoted `login.html` to a first-class frontend contract page inside `scripts/audit-commercial-readiness.js`.
- Updated commercialization status docs so launch-grade frontend parity now explicitly includes:
  - `index.html`
  - `login.html`
  - `project-hub.html`
  - `profile.html`
  - `explore_theme.html`

## Why
- The readiness summary and rollout report already showed that the deployed login page was behind the local auth-return contract.
- The commercialization audit and status docs needed to express the same truth so release decisions are based on one consistent contract surface.

## Verification
- `node scripts/audit-commercial-readiness.js`
- `node scripts/print-commercialization-readiness-summary.js`
- `node scripts/print-production-rollout-status.js`
