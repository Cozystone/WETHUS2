# 2026-06-26 webhook modal busy state

## What changed

- Added a dedicated `hubWebhookOpsStatus` line to the project-hub webhook modal so operators can see the last action outcome without relying only on alerts.
- While webhook issue/reissue or test-event submission is in progress, the modal now disables issue, test, and copy actions to reduce accidental duplicate requests.
- Copy actions now also update the same in-modal status line after success or failure.
- Extended frontend contract validation and drift checks so the busy-state/status UI cannot silently disappear from the live hub.

## Why it matters

- Commercial operators need clear feedback when a webhook secret is being issued, reissued, or copied.
- This reduces duplicate destructive actions and makes the activity-log setup flow feel less fragile during real ops work.

## Verification

- `node scripts/validate-static.js`
- `node scripts/run-commercial-gate.js`
