const WETHUS_WEBHOOK_URL = '__WETHUS_WEBHOOK_URL__';
const WETHUS_WEBHOOK_SECRET = '__WETHUS_WEBHOOK_SECRET__';
const WETHUS_PROVIDER = '__WETHUS_PROVIDER__';
const WETHUS_RESOURCE_NAME = '__WETHUS_RESOURCE_NAME__';

function notifyWethus(eventType, extra) {
  const payload = {
    event_type: eventType,
    item_id: resolveResourceId_(),
    item_name: resolveResourceName_(),
    actor_name: Session.getActiveUser().getEmail() || 'Apps Script Relay',
    provider: WETHUS_PROVIDER,
    occurred_at: new Date().toISOString()
  };
  const body = Object.assign(payload, extra || {});
  const response = UrlFetchApp.fetch(WETHUS_WEBHOOK_URL, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'x-webhook-secret': WETHUS_WEBHOOK_SECRET },
    payload: JSON.stringify(body),
    muteHttpExceptions: true
  });
  const code = response.getResponseCode();
  if (code < 200 || code >= 300) {
    throw new Error(`WETHUS webhook rejected relay event (${code}): ${response.getContentText()}`);
  }
  return JSON.parse(response.getContentText() || '{}');
}

function installWethusMenu() {
  const ui = tryGetUi_();
  if (!ui) return;
  ui.createMenu('WETHUS Relay')
    .addItem('Send manual update', 'logManualUpdate')
    .addItem('Send relay heartbeat', 'sendRelayHeartbeat')
    .addToUi();
}

function onOpen(e) {
  installWethusMenu();
  notifyWethus(resolveOpenEventType_(), {
    summary: `${resolveResourceName_()} opened in Google Workspace`,
    raw_payload: {
      trigger: 'onOpen',
      authMode: String(e && e.authMode || '')
    }
  });
}

function onEdit(e) {
  if (!isSpreadsheetRelay_()) return;
  const range = e && e.range;
  notifyWethus('sheet_edited', {
    summary: range ? `Edited ${range.getA1Notation()} in ${resolveResourceName_()}` : `Edited ${resolveResourceName_()}`,
    raw_payload: {
      trigger: 'onEdit',
      sheetName: range ? range.getSheet().getName() : '',
      a1Notation: range ? range.getA1Notation() : '',
      oldValue: e && Object.prototype.hasOwnProperty.call(e, 'oldValue') ? e.oldValue : '',
      value: e && Object.prototype.hasOwnProperty.call(e, 'value') ? e.value : ''
    }
  });
}

function onChange(e) {
  if (!isSpreadsheetRelay_()) return;
  notifyWethus('sheet_changed', {
    summary: `${resolveResourceName_()} changed`,
    raw_payload: {
      trigger: 'onChange',
      changeType: String(e && e.changeType || '')
    }
  });
}

function logManualUpdate() {
  notifyWethus('document_updated', {
    summary: `Manual relay update from ${resolveResourceName_()}`,
    raw_payload: {
      trigger: 'manual',
      provider: WETHUS_PROVIDER
    }
  });
}

function sendRelayHeartbeat() {
  notifyWethus('relay_heartbeat', {
    summary: `Relay heartbeat from ${resolveResourceName_()}`,
    raw_payload: {
      trigger: 'manual_heartbeat',
      provider: WETHUS_PROVIDER
    }
  });
}

function createSheetInstallableTriggers() {
  if (!isSpreadsheetRelay_()) {
    throw new Error('createSheetInstallableTriggers only applies to Google Sheets relays.');
  }
  deleteExistingRelayTriggers_();
  const spreadsheetId = SpreadsheetApp.getActive().getId();
  ScriptApp.newTrigger('onOpen').forSpreadsheet(spreadsheetId).onOpen().create();
  ScriptApp.newTrigger('onEdit').forSpreadsheet(spreadsheetId).onEdit().create();
  ScriptApp.newTrigger('onChange').forSpreadsheet(spreadsheetId).onChange().create();
}

function createDocsHeartbeatTrigger() {
  deleteExistingRelayTriggers_();
  ScriptApp.newTrigger('sendRelayHeartbeat').timeBased().everyHours(1).create();
}

function deleteExistingRelayTriggers_() {
  ScriptApp.getProjectTriggers().forEach((trigger) => {
    const handler = trigger.getHandlerFunction();
    if (['onOpen', 'onEdit', 'onChange', 'sendRelayHeartbeat'].indexOf(handler) >= 0) {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}

function resolveOpenEventType_() {
  return isSpreadsheetRelay_() ? 'spreadsheet_opened' : 'document_opened';
}

function resolveResourceName_() {
  if (WETHUS_RESOURCE_NAME && !/^__.+__$/.test(WETHUS_RESOURCE_NAME)) return WETHUS_RESOURCE_NAME;
  try {
    if (isSpreadsheetRelay_()) return SpreadsheetApp.getActive().getName();
  } catch (_) {}
  try {
    return DocumentApp.getActiveDocument().getName();
  } catch (_) {}
  return 'Google Workspace Resource';
}

function resolveResourceId_() {
  try {
    if (isSpreadsheetRelay_()) return SpreadsheetApp.getActive().getId();
  } catch (_) {}
  try {
    return DocumentApp.getActiveDocument().getId();
  } catch (_) {}
  return WETHUS_PROVIDER;
}

function isSpreadsheetRelay_() {
  return String(WETHUS_PROVIDER || '').toLowerCase() === 'google_sheets';
}

function tryGetUi_() {
  try {
    return isSpreadsheetRelay_() ? SpreadsheetApp.getUi() : DocumentApp.getUi();
  } catch (_) {
    return null;
  }
}
