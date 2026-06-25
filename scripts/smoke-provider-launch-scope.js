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

  if (!launchProviders.includes('google_docs')) fail('launchScope should include google_docs');
  if (!launchProviders.includes('google_sheets')) fail('launchScope should include google_sheets');
  if (!deferredProviders.includes('notion')) fail('launchScope should include notion as deferred');
  if (!deferredProviders.includes('slack')) fail('launchScope should include slack as deferred');
  if (!deferredProviders.includes('figma')) fail('launchScope should include figma as deferred');

  const googleDocs = providers.get('google_docs');
  const googleSheets = providers.get('google_sheets');
  const notion = providers.get('notion');
  const slack = providers.get('slack');
  const figma = providers.get('figma');

  if (!googleDocs) fail('providers response should include google_docs');
  if (!googleSheets) fail('providers response should include google_sheets');
  if (!notion) fail('providers response should include notion');
  if (!slack) fail('providers response should include slack');
  if (!figma) fail('providers response should include figma');

  if (googleDocs?.launchPhase !== 'launch') fail(`google_docs launchPhase should be launch, got ${googleDocs?.launchPhase || 'missing'}`);
  if (googleDocs?.launchIncluded !== true) fail('google_docs launchIncluded should be true');
  if (googleSheets?.launchPhase !== 'launch') fail(`google_sheets launchPhase should be launch, got ${googleSheets?.launchPhase || 'missing'}`);
  if (googleSheets?.launchIncluded !== true) fail('google_sheets launchIncluded should be true');

  if (notion?.launchPhase !== 'deferred') fail(`notion launchPhase should be deferred, got ${notion?.launchPhase || 'missing'}`);
  if (notion?.launchIncluded !== false) fail('notion launchIncluded should be false');
  if (slack?.launchPhase !== 'deferred') fail(`slack launchPhase should be deferred, got ${slack?.launchPhase || 'missing'}`);
  if (slack?.launchIncluded !== false) fail('slack launchIncluded should be false');
  if (figma?.launchPhase !== 'deferred') fail(`figma launchPhase should be deferred, got ${figma?.launchPhase || 'missing'}`);
  if (figma?.launchIncluded !== false) fail('figma launchIncluded should be false');

  for (const [key, row] of providers.entries()) {
    if (!String(row?.launchNote || '').trim()) {
      fail(`${key} should include a non-empty launchNote`);
    }
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
