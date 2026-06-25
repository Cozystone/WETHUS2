# 2026-06-25 Release Noise Cleanup

## What changed
- Added temporary backend smoke artifacts to `.gitignore`.
- Updated `scripts/check-deploy-source-readiness.js` so launch-readiness checks ignore known temporary validation artifacts instead of treating them as real deploy drift.
- Updated `scripts/describe-commercialization-bundle.js` so homepage/login/script/Vercel config files are grouped into the frontend commercialization bundle.

## Why
- Temporary smoke logs and pid files should not pollute commercialization readiness output or distract from real deploy blockers.
- The bundle manifest should reflect the full frontend surface that now matters for launch:
  - `index.html`
  - `login.html`
  - `script.js`
  - `vercel.json`

## Verification
- `git status --short`
- `node scripts/check-deploy-source-readiness.js`
- `node scripts/describe-commercialization-bundle.js`
