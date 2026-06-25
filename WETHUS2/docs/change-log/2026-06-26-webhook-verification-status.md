# 2026-06-26 webhook verification status

## What changed

- Extended the integration API payload so project-hub clients receive the latest verified webhook event timestamp, event type, item name, delivery count, and a derived `webhook_verified` flag.
- Reset the stored verification fields whenever a webhook secret is newly issued or re-issued, so the UI does not imply that an old delivery is still valid for a new secret.
- Persisted the latest verified webhook delivery metadata when `POST /webhooks/:provider/:integrationId` accepts an event.
- Updated the project hub integration cards and webhook modal to distinguish three states:
  - webhook not configured
  - webhook configured but not yet verified
  - external push verified with last delivery details
- Tightened `scripts/smoke-integration-activity-log.js` so the commercialization smoke now proves that a delivered webhook event remains visible through the integration read model, not only in the raw activity-events list.

## Why it matters

- Operators can now confirm from the product UI whether activity-log collection is merely enabled or has actually received a real external push.
- This reduces false confidence during commercialization checks, especially for Google Docs and Google Sheets where a relay is still required for real document-change events.
- The smoke test now guards the operational contract that the hub depends on when showing webhook readiness and verification history.

## Verification

- `node scripts/smoke-integration-activity-log.js`
- `node scripts/validate-static.js`
- `node scripts/run-commercial-gate.js`
