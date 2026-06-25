# 2026-06-25 Frontend Contract Build Marker

## Summary
- Added a shared frontend contract marker to:
  - `WETHUS2/project-hub.html`
  - `WETHUS2/profile.html`
  - `WETHUS2/explore_theme.html`
- Marker:
  - `<meta name="wethus-frontend-contract" content="2026-06-25-commercial-hardening-v1" />`
- Updated `scripts/validate-static.js` so the local commercialization baseline requires that marker on those critical pages.
- Updated `scripts/check-live-frontend-drift.js` so live drift output now reports marker parity alongside functional snippet parity.

## Why
- Page-level frontend drift was already detectable by behavior snippets, but the local baseline itself still lacked one simple deployment identity marker.
- A shared marker makes it easier to tell whether the live page is serving the intended commercialization baseline, even before reading deeper page logic.

## Verification
- `node scripts/validate-static.js`
- `node scripts/check-live-frontend-drift.js`
