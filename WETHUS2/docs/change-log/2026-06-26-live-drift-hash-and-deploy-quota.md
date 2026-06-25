# 2026-06-26 live drift hash and deploy quota handling

- Tightened `scripts/check-live-frontend-drift.js` so a full normalized content hash mismatch now counts as real live drift even when the tracked snippet contracts still match.
- Extended `scripts/print-production-rollout-status.js --json` to include `hashMatch`, `localHash`, and `liveHash` for each frontend page, and to treat a hash mismatch as frontend drift.
- Improved `scripts/deploy-vercel-frontend-production.js` so Vercel daily free-plan deploy quota failures are recognized explicitly and followed by a live drift verification pass with clearer operator messaging.

## Why

- Earlier drift tooling could report a clean state when only the shared snippet contract matched, even if the live page content was still behind local edits.
- For commercialization work, that is too weak: operators need to know whether the full deployed page actually matches the local release candidate.
