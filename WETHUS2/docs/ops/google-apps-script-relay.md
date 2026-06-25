# Google Apps Script Relay Runbook

Date: 2026-06-26

## Why this exists

WETHUS already records integration lifecycle events such as connection, reconnection, disconnection, sync, and manual hub test events.

Google Docs and Google Sheets still need a relay to forward provider-side activity into the WETHUS webhook endpoint. This runbook turns that requirement into an operator-ready setup instead of an implied future task.

Authoritative backend contract:

- Webhook issue endpoint: `POST /integrations/:id/webhook-config`
- Webhook ingest endpoint: `POST /webhooks/:provider/:integrationId`
- Required header: `x-webhook-secret`
- Expected body fields:
  - `event_type`
  - `item_id`
  - `item_name`
  - `actor_name`
  - `occurred_at`
  - optional `summary`
  - optional `raw_payload`

See:

- [C:/0.ASKIM ALL-VIN/0.5.WETHUS/WETHUS2/backend/server.js](C:/0.ASKIM%20ALL-VIN/0.5.WETHUS/WETHUS2/backend/server.js:1574)
- [C:/0.ASKIM ALL-VIN/0.5.WETHUS/WETHUS2/backend/server.js](C:/0.ASKIM%20ALL-VIN/0.5.WETHUS/WETHUS2/backend/server.js:1614)

## Important product truth

- Google Sheets can emit richer activity through `onEdit` and `onChange` installable triggers.
- Google Docs does not expose a fine-grained edit trigger equivalent to Sheets.
- For Docs, WETHUS can still receive:
  - open events
  - manual update events
  - periodic heartbeat events
- If you need exact per-edit Google Docs audit trails later, that requires a different Google Workspace admin or Drive Activity strategy beyond this Apps Script starter.

## Files to copy into Apps Script

Use the relay starter package in:

- [C:/0.ASKIM ALL-VIN/0.5.WETHUS/WETHUS2/integrations/google-apps-script-relay/Code.js](C:/0.ASKIM%20ALL-VIN/0.5.WETHUS/WETHUS2/integrations/google-apps-script-relay/Code.js)
- [C:/0.ASKIM ALL-VIN/0.5.WETHUS/WETHUS2/integrations/google-apps-script-relay/appsscript.json](C:/0.ASKIM%20ALL-VIN/0.5.WETHUS/WETHUS2/integrations/google-apps-script-relay/appsscript.json)

Replace these placeholders before saving:

- `__WETHUS_WEBHOOK_URL__`
- `__WETHUS_WEBHOOK_SECRET__`
- `__WETHUS_PROVIDER__`
- `__WETHUS_RESOURCE_NAME__`

Provider values:

- Google Docs relay: `google_docs`
- Google Sheets relay: `google_sheets`

## Setup flow

1. In WETHUS Project Hub, connect the Google Docs or Google Sheets resource first.
2. Open `활동 로그 수집`.
3. Click `Webhook 발급`.
4. Copy:
   - webhook URL
   - webhook secret
5. Open the target Google Doc or Sheet.
6. Open `Extensions -> Apps Script`.
7. Replace the default script with the contents of `Code.js`.
8. Open project settings and replace the manifest with `appsscript.json` if needed.
9. Fill the four placeholders with the values from WETHUS.
10. Save the project.

## Trigger installation

### Google Sheets

Run this once from the Apps Script editor:

```javascript
createSheetInstallableTriggers();
```

This creates installable triggers for:

- `onOpen`
- `onEdit`
- `onChange`

### Google Docs

Run this once from the Apps Script editor:

```javascript
createDocsHeartbeatTrigger();
```

This gives Docs a recurring heartbeat even when no manual update button is pressed.

Docs also send:

- `document_opened` on open
- `document_updated` when the custom menu action is used

## Verification

1. Reopen the Google Doc or Sheet.
2. In the `WETHUS Relay` menu, click `Send manual update`.
3. Return to WETHUS Project Hub.
4. Confirm:
   - `활동 로그` status changes from waiting to verified
   - recent event list shows the new event
   - project timeline includes the relay event

For Sheets, also edit one cell and confirm a `sheet_edited` event appears.

## Failure handling

- `401 invalid webhook secret`
  - Reissue the webhook in WETHUS and update the Apps Script constants.
- `404 integration not found`
  - The integration was deleted or the webhook URL is stale.
- No new events in WETHUS
  - Confirm the integration is still connected.
  - Confirm the webhook was issued for the current connected resource.
  - Confirm Apps Script authorization prompts were accepted.
  - For Sheets, confirm installable triggers were created.
  - For Docs, remember there is no cell-level edit trigger; use open, manual update, or heartbeat verification.

## Operational note

If a leader clicks `Webhook 재발급`, the previous secret becomes invalid immediately.
Any existing Apps Script relay must be updated with the new secret at once.
