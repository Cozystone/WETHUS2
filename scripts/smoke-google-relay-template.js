const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const relayDir = path.join(repoRoot, 'WETHUS2', 'integrations', 'google-apps-script-relay');
const codeFile = path.join(relayDir, 'Code.js');
const manifestFile = path.join(relayDir, 'appsscript.json');
const runbookFile = path.join(repoRoot, 'WETHUS2', 'docs', 'ops', 'google-apps-script-relay.md');
const errors = [];

function fail(message) {
  errors.push(message);
}

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

if (!fs.existsSync(codeFile)) {
  fail('google relay Code.js must exist');
} else {
  const text = read(codeFile);
  [
    'const WETHUS_WEBHOOK_URL = \'__WETHUS_WEBHOOK_URL__\';',
    'const WETHUS_WEBHOOK_SECRET = \'__WETHUS_WEBHOOK_SECRET__\';',
    'const WETHUS_PROVIDER = \'__WETHUS_PROVIDER__\';',
    'function notifyWethus(eventType, extra) {',
    'UrlFetchApp.fetch(WETHUS_WEBHOOK_URL',
    '\'x-webhook-secret\': WETHUS_WEBHOOK_SECRET',
    'function onOpen(e) {',
    'function onEdit(e) {',
    'function onChange(e) {',
    'function logManualUpdate() {',
    'function sendRelayHeartbeat() {',
    'function createSheetInstallableTriggers() {',
    'function createDocsHeartbeatTrigger() {'
  ].forEach((snippet) => {
    if (!text.includes(snippet)) fail(`google relay Code.js must include: ${snippet}`);
  });
}

if (!fs.existsSync(manifestFile)) {
  fail('google relay appsscript.json must exist');
} else {
  const text = read(manifestFile);
  [
    '"runtimeVersion": "V8"',
    '"https://www.googleapis.com/auth/script.external_request"',
    '"https://www.googleapis.com/auth/script.scriptapp"',
    '"https://www.googleapis.com/auth/spreadsheets.currentonly"',
    '"https://www.googleapis.com/auth/documents.currentonly"'
  ].forEach((snippet) => {
    if (!text.includes(snippet)) fail(`google relay manifest must include: ${snippet}`);
  });
}

if (!fs.existsSync(runbookFile)) {
  fail('google relay runbook must exist');
} else {
  const text = read(runbookFile);
  [
    'Google Apps Script Relay Runbook',
    'Google Sheets can emit richer activity through `onEdit` and `onChange` installable triggers.',
    'Google Docs does not expose a fine-grained edit trigger equivalent to Sheets.',
    '`POST /integrations/:id/webhook-config`',
    '`POST /webhooks/:provider/:integrationId`',
    'createSheetInstallableTriggers();',
    'createDocsHeartbeatTrigger();'
  ].forEach((snippet) => {
    if (!text.includes(snippet)) fail(`google relay runbook must include: ${snippet}`);
  });
}

if (errors.length) {
  console.error('Google relay template smoke failures:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Google relay template smoke passed.');
