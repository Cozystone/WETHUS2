## Summary
- Added explicit opportunity-feed freshness visibility to the public opportunities surface.
- Added commercialization-audit warnings when the published opportunity feed is stale or missing freshness metadata.

## Why
- The public opportunity feed already hid expired rows by default, but users still had no visible clue about how old the underlying dataset was.
- That made the surface look more current than it really was and increased the risk of users trusting stale deadlines.

## What changed
- `WETHUS2/opportunities.html`
  - Added a feed-status card near the filters.
  - Shows the feed `updatedAt` time, active opportunity count, and a stale warning when the feed is older than 14 days.
  - Falls back to an operator-facing warning if `updatedAt` is missing.
- `scripts/audit-commercial-readiness.js`
  - Audits `https://www.wethus.co.kr/data/opportunity-published.json`.
  - Emits a warning and follow-up action when the feed is older than 14 days or `updatedAt` is invalid/missing.

## Validation
- `node scripts/validate-static.js`
- `node scripts/audit-commercial-readiness.js`
