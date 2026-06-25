# 2026-06-25 Project Hub Launch-Scope UI

## What changed
- Updated the project hub external-tools cards to reflect the commercial launch scope instead of treating every provider as equally ready.
- Marked `Google Docs` and `Google Sheets` as launch-scope integrations.
- Marked `Notion`, `Slack`, and `Figma` as deferred roadmap integrations in the project hub UI.
- Disabled connect/disconnect actions for deferred providers and added a roadmap message so the live UI no longer over-promises unavailable launch integrations.

## Why
- Commercial launch readiness currently includes only Google Docs and Google Sheets.
- Deferred providers are valid future integrations, but showing them as active connection targets in the same way as launch providers creates false expectations and weakens trust in the product surface.

## Verification
- `node scripts/validate-static.js`
- `node scripts/run-commercial-gate.js`

## Notes
- This is a UI contract correction, not a production deploy. Live frontend drift and disabled production security flags still remain launch blockers until the current local bundle is deployed and Render/Vercel are updated.
