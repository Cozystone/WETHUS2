# 2026-06-25 Homepage Root Contract And Routing

## What changed
- Added the shared frontend contract marker to `WETHUS2/index.html`.
- Added an explicit Vercel root route in `WETHUS2/vercel.json` so `/` resolves to `index.html`.
- Expanded commercialization smoke and drift checks so the public homepage is audited alongside:
  - `project-hub.html`
  - `profile.html`
  - `explore_theme.html`

## Why
- The homepage is the first commercial touchpoint and should not silently drift into a login-first experience.
- Before this change, the launch-grade frontend contract mostly tracked hub/profile/explore surfaces, leaving `/` under-observed.
- Explicit root routing reduces ambiguity during Vercel deploys and makes homepage drift easier to detect quickly.

## Verification
- `node scripts/validate-static.js`
- `node scripts/print-commercialization-readiness-summary.js`
- `node scripts/print-production-rollout-status.js`
