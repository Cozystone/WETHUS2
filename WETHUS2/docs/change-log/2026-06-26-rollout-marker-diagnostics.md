## 2026-06-26 - Rollout Marker Diagnostics

- Updated `scripts/check-live-frontend-drift.js` to print the local and live `wethus-frontend-contract` marker values for each checked page.
- Updated `scripts/print-production-rollout-status.js` so frontend drift rows now also show `contract marker local=... live=...` when the rollout mismatch is marker-driven.
- This makes frontend non-deploys immediately understandable from the terminal output instead of requiring operators to infer them from a generic snippet drift line.

## Verification

- `node scripts/check-live-frontend-drift.js`
- `node scripts/print-production-rollout-status.js`
