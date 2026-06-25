## Summary
- Added a repo-root helper for manual Vercel frontend production deploys.
- Updated the Vercel frontend redeploy runbook and root README to point to the helper as the preferred recovery path when Git auto deploy lags.

## Why
- The live `www.wethus.co.kr` frontend can be production-stale even when `main` already contains the correct static files.
- During the activity-log UX rollout, Vercel Git integration did not pick up the latest `main` commit, but a repo-root CLI deploy succeeded immediately.
- Operators needed a repeatable command that uses the correct repo root and cleans the temporary `.vercel` link artifacts it creates.

## What changed
- Added `scripts/deploy-vercel-frontend-production.js`.
- The helper:
  - validates Vercel CLI access
  - inspects the expected Vercel project
  - links the repo root if needed
  - deploys production from the repo root
  - reruns `scripts/check-live-frontend-drift.js`
  - restores `.gitignore` and removes temporary `.vercel` directories when they were created by the helper
- Updated `WETHUS2/docs/ops/vercel-frontend-redeploy.md`.
- Updated the root `README.md`.

## Validation
- `node --check scripts/deploy-vercel-frontend-production.js`
- `WETHUS_VERCEL_DEPLOY_DRY_RUN=true node scripts/deploy-vercel-frontend-production.js`
- `node scripts/validate-static.js`
