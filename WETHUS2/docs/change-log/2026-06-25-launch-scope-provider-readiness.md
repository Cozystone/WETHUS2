# 2026-06-25 Launch Scope Provider Readiness

## What changed
- Added `WETHUS2/config/launch-scope.json` to explicitly define which external integrations are part of the current commercial launch scope.
- Added `scripts/lib/launch-scope.js` so commercialization scripts can share the same launch-scope interpretation.
- Updated readiness scripts to treat only launch-scope providers as readiness blockers by default.

## Current launch scope
- Launch providers:
  - `google_docs`
  - `google_sheets`
- Deferred providers:
  - `notion`
  - `slack`
  - `figma`

## Why it matters
- Commercialization signals were noisier than necessary when deferred connectors looked like launch blockers.
- This keeps the launch gate honest: blockers now reflect what is actually promised at launch, while deferred integrations remain visible as roadmap or ops follow-up items.

## Override mechanism
- `WETHUS_LAUNCH_PROVIDERS=...`
- `WETHUS_DEFERRED_PROVIDERS=...`

These env vars can temporarily override the JSON config for special rollout checks.
