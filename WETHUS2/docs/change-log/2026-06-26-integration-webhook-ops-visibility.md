# 2026-06-26 - Integration Webhook Ops Visibility

## What changed

- Added project-hub visibility for external integration activity-log readiness.
- Added a webhook management modal so founders/leaders can issue or re-issue integration webhook endpoints from the hub.
- Surfaced per-integration event summaries and webhook readiness in the hub integration cards and summary list.
- Sanitized backend `/integrations` responses so demo tokens and stored webhook secrets no longer leak to the client list payload.

## Why

- The backend already supported webhook ingestion and activity-event storage, but the project hub did not expose whether an integration was actually ready to collect external push events.
- That made commercialization reviews weaker because operators could not verify the difference between:
  - basic connect/sync logging only
  - webhook-ready event collection

## Verification

- `node scripts/validate-static.js`
- `node scripts/run-commercial-gate.js`
- local backend import/boot smoke with `PORT=0`

## Notes

- The hub only shows a masked `webhook_secret_preview` on ordinary integration reads.
- A full webhook secret is only shown immediately after issuing/re-issuing it through the dedicated backend endpoint.
