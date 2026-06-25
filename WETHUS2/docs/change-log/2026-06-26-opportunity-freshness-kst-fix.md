## 2026-06-26 - Opportunity freshness KST fix

- Updated the opportunity publish script to write `updatedAt` using an explicit `Asia/Seoul` (`+09:00`) timestamp.
- Clamped opportunity freshness age calculations to `0` or greater in both:
  - `scripts/audit-commercial-readiness.js`
  - `WETHUS2/opportunities.html`
- This avoids confusing negative-day freshness output when the feed timestamp is slightly ahead of UTC-based audit timing.
