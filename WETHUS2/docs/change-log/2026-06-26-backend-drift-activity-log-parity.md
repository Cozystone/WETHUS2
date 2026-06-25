## 2026-06-26 Backend Drift Activity Log Parity

- Extended live backend drift reporting so `/integrations/providers` now verifies the activity-log capability contract as well as launch-scope metadata.
- Added parity checks for:
  - `activityLogMode`
  - `activityLogSummary`
  - `lifecycleEvents`
  - `manualTestEvents`
  - `webhookIngress`
  - `relayRequired`
  - `externalPushReady`
- Refreshed `STATUS.md` to match the current evidence:
  - live frontend drift is cleared
  - remaining commercialization lag is centered on the Render backend build and provider activity-log metadata deployment
