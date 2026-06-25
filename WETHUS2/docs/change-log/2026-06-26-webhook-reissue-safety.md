# 2026-06-26 webhook reissue safety

## What changed

- Added explicit reissue semantics to `POST /integrations/:id/webhook-config` via a `reissued` boolean in the response.
- Updated `project-hub.html` so webhook reissue is treated as a destructive ops action:
  - the modal warns that reissuing invalidates the current secret
  - leaders must confirm before a reissue proceeds
  - hub activity logs now distinguish initial issue vs reissue
- Tightened `scripts/smoke-integration-activity-log.js` so commercialization verification now proves:
  - first issue returns `reissued=false`
  - second issue returns `reissued=true`
  - the old secret is rejected after reissue
  - the new secret is accepted

## Why it matters

- In commercialization ops, reissuing a webhook secret can silently break an existing relay if the product does not clearly warn about the consequence.
- The product now makes this risk explicit and the smoke suite guards the invalidation contract end to end.

## Verification

- `node scripts/smoke-integration-activity-log.js`
- `node scripts/validate-static.js`
