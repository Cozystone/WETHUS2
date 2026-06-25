# 2026-06-25 Post-Deploy Verification Helper

## What changed

- added `scripts/print-post-deploy-verification.js` to print the exact post-deploy verification order for frontend deploys, backend deploys, and strict launch-grade rollout checks
- linked the helper from `scripts/plan-commercialization-release.js` and `scripts/print-production-rollout-status.js`
- updated the Render and Vercel redeploy runbooks so they explicitly include backend contract parity and the strict commercialization gate

## Why

- the repo already had strong drift and smoke checks, but the deploy follow-up sequence still depended too much on manual operator memory
- commercialization rollout now depends on both frontend parity and backend contract parity, so the verification instructions need to be explicit and consistent

## Validation

- `node scripts/print-post-deploy-verification.js`
- `node scripts/plan-commercialization-release.js`
- `node scripts/print-production-rollout-status.js`
