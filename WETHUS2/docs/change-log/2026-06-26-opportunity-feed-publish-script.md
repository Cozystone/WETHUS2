## 2026-06-26 - Opportunity feed publish script

- Added `scripts/publish-opportunity-feed.js` to rebuild the public opportunity feed from curated JSON rows.
- The script normalizes dates and fields, infers `open` / `closed` status from deadlines, removes duplicate `dedupe_key` rows, sorts by nearest deadline, and refreshes `updatedAt`.
- Added an operations note at `WETHUS2/docs/ops/opportunity-feed-publish.md` describing the editorial flow:
  - edit curated rows
  - run the publish script
  - run static/commercial gates
  - redeploy frontend if the live feed must update immediately
- Updated the repo handover README so the opportunity feed is treated as an editorial upkeep workflow instead of an unresolved freshness risk.
