## 2026-06-26 Integration Activity Log Contract

- Added explicit activity-log capability fields to `/integrations/providers` so the product can distinguish:
  - built-in lifecycle logging
  - webhook ingress availability
  - whether external push logging is fully ready or still requires a relay
- Updated the project hub external-tools UI to surface the new policy in:
  - tool cards
  - connected integration summaries
  - the webhook modal
- Clarified the current launch truth for Google Docs and Google Sheets:
  - connection/disconnection/sync logs are recorded automatically
  - external document change events still require a relay such as Apps Script or another webhook forwarder
- Extended commercialization diagnostics and smoke coverage so provider metadata now fails fast when the activity-log contract is missing.
