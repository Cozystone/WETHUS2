# 2026-06-26 webhook health staleness

## What changed

- Added derived webhook health metadata to integration client payloads:
  - `webhook_health`
  - `webhook_verified`
  - `webhook_verified_age_hours`
  - `webhook_stale_after_hours`
- Health now distinguishes:
  - `disabled`
  - `pending`
  - `healthy`
  - `stale`
- Updated `project-hub.html` so old webhook verifications are no longer shown the same as fresh ones.
  - fresh deliveries render as `외부 푸시 확인됨`
  - old deliveries render as `외부 푸시 오래됨`
  - pending setups mention the first-verification expectation window
- Extended `scripts/smoke-integration-activity-log.js` so commercialization verification now proves both:
  - a recent webhook event reports `webhook_health=healthy`
  - an old `occurred_at` event reports `webhook_health=stale`

## Why it matters

- In commercialization ops, “verified once at some point” is weaker than “verified recently enough to trust.”
- Surfacing stale verification helps operators notice dead relays or inactive provider pushes before they assume the integration is healthy.

## Verification

- `node scripts/smoke-integration-activity-log.js`
- `node scripts/validate-static.js`
