# 2026-06-25 Provider Launch-Scope Contract

## What changed
- Added launch-scope metadata to the backend `/integrations/providers` response.
- The provider payload now includes launch-contract fields such as:
  - `launchPhase`
  - `launchIncluded`
  - `launchNote`
- Updated the project hub UI to prefer backend launch-scope metadata over local assumptions when deciding whether a provider is a live launch integration or a deferred roadmap integration.

## Why
- Commercial launch scope is narrower than the full roadmap.
- Without a backend-driven contract, the project hub can drift into showing roadmap providers as if they are launch-ready.
- This change makes the UI follow a single source of truth for launch-vs-deferred provider status.

## Verification
- `node --check WETHUS2/backend/server.js`
- `node scripts/validate-static.js`
- `node scripts/run-commercial-gate.js`

## Notes
- This improves backend/frontend consistency but does not remove the remaining production blockers:
  - live frontend drift on Vercel
  - disabled production security/session/membership flags on Render
