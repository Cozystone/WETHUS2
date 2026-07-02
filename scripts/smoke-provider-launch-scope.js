const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const repoRoot = path.resolve(__dirname, '..');
const backendRoot = path.join(repoRoot, 'WETHUS2', 'backend');
const port = Number(process.env.WETHUS_PROVIDER_LAUNCH_SCOPE_SMOKE_PORT || 8898);
const baseUrl = `http://127.0.0.1:${port}`;
const errors = [];

function fail(message) {
  errors.push(message);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stopChild(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return Promise.resolve();
  return new Promise((resolve) => {
    const timeout = setTimeout(resolve, 3000);
    child.once('exit', () => {
      clearTimeout(timeout);
      resolve();
    });
    child.kill();
  });
}

async function waitForServer(child, logs) {
  for (let i = 0; i < 40; i += 1) {
    if (child.exitCode !== null) break;
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) return;
    } catch (_) {}
    await sleep(250);
  }
  throw new Error(`backend did not start on ${baseUrl}\n${logs.text}`);
}

function providerMap(rows) {
  return new Map((Array.isArray(rows) ? rows : []).map((row) => [String(row?.key || '').trim(), row]));
}

function expectLaunchScopePayload(payload) {
  if (!payload || payload.ok !== true) {
    fail('providers response should return ok=true');
    return;
  }

  const launchScope = payload.launchScope || {};
  const launchProviders = Array.isArray(launchScope.launchProviders) ? launchScope.launchProviders : [];
  const deferredProviders = Array.isArray(launchScope.deferredProviders) ? launchScope.deferredProviders : [];
  const providers = providerMap(payload.providers);

  const expectedLaunchProviders = [
    'google_docs',
    'google_sheets',
    'notion',
    'slack',
    'figma',
    'github',
    'discord',
    'google_calendar',
    'airtable'
  ];

  for (const key of expectedLaunchProviders) {
    if (!launchProviders.includes(key)) fail(`launchScope should include ${key}`);
    if (deferredProviders.includes(key)) fail(`launchScope should not include ${key} as deferred`);
    const row = providers.get(key);
    if (!row) {
      fail(`providers response should include ${key}`);
      continue;
    }
    if (row.launchPhase !== 'launch') fail(`${key} launchPhase should be launch, got ${row.launchPhase || 'missing'}`);
    if (row.launchIncluded !== true) fail(`${key} launchIncluded should be true`);
  }

  const googleDocs = providers.get('google_docs');
  const googleSheets = providers.get('google_sheets');

  for (const [key, row] of providers.entries()) {
    if (!String(row?.launchNote || '').trim()) {
      fail(`${key} should include a non-empty launchNote`);
    }
    if (!String(row?.activityLogMode || '').trim()) {
      fail(`${key} should include activityLogMode`);
    }
    if (!String(row?.activityLogSummary || '').trim()) {
      fail(`${key} should include activityLogSummary`);
    }
    if (row?.lifecycleEvents !== true) {
      fail(`${key} should expose lifecycleEvents=true`);
    }
    if (row?.manualTestEvents !== true) {
      fail(`${key} should expose manualTestEvents=true`);
    }
    if (row?.webhookIngress !== true) {
      fail(`${key} should expose webhookIngress=true`);
    }
  }

  if (googleDocs?.relayRequired !== true || googleDocs?.externalPushReady !== false) {
    fail('google_docs should declare relayRequired=true and externalPushReady=false');
  }
  if (googleSheets?.relayRequired !== true || googleSheets?.externalPushReady !== false) {
    fail('google_sheets should declare relayRequired=true and externalPushReady=false');
  }
}

async function fetchProviders() {
  const response = await fetch(`${baseUrl}/integrations/providers`);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    fail(`providers response should return 200, got ${response.status}`);
  }
  return payload;
}

(async () => {
  const logs = { text: '' };
  const smokeDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wethus-provider-launch-scope-smoke-'));
  let child;

  try {
    child = spawn(process.execPath, ['server.js'], {
      cwd: backendRoot,
      env: {
        ...process.env,
        PORT: String(port),
        WETHUS_DATA_DIR: smokeDataDir,
        RATE_LIMIT_DISABLED: 'true'
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    child.stdout.on('data', (data) => { logs.text += data.toString(); });
    child.stderr.on('data', (data) => { logs.text += data.toString(); });

    await waitForServer(child, logs);
    const payload = await fetchProviders();
    expectLaunchScopePayload(payload);
  } finally {
    await stopChild(child);
    fs.rmSync(smokeDataDir, { recursive: true, force: true });
  }

  if (errors.length) {
    console.error(errors.map((error) => `- ${error}`).join('\n'));
    process.exit(1);
  }

  console.log('Provider launch-scope smoke passed.');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
