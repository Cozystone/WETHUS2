const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const repoRoot = path.resolve(__dirname, '..');
const backendRoot = path.join(repoRoot, 'WETHUS2', 'backend');
const port = Number(process.env.WETHUS_PROVIDER_LAUNCH_SCOPE_OVERRIDE_SMOKE_PORT || 8902);
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

(async () => {
  const logs = { text: '' };
  const smokeDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wethus-provider-launch-scope-override-smoke-'));
  let child;

  try {
    child = spawn(process.execPath, ['server.js'], {
      cwd: backendRoot,
      env: {
        ...process.env,
        PORT: String(port),
        WETHUS_DATA_DIR: smokeDataDir,
        RATE_LIMIT_DISABLED: 'true',
        WETHUS_LAUNCH_PROVIDERS: 'google_docs,notion',
        WETHUS_DEFERRED_PROVIDERS: 'google_sheets,slack,figma'
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    child.stdout.on('data', (data) => { logs.text += data.toString(); });
    child.stderr.on('data', (data) => { logs.text += data.toString(); });

    await waitForServer(child, logs);

    const response = await fetch(`${baseUrl}/integrations/providers`);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.ok !== true) {
      fail(`/integrations/providers should return ok=true with env override, got ${response.status}`);
    } else {
      const launchScope = payload.launchScope || {};
      const providers = providerMap(payload.providers);
      const launchProviders = Array.isArray(launchScope.launchProviders) ? launchScope.launchProviders : [];
      const deferredProviders = Array.isArray(launchScope.deferredProviders) ? launchScope.deferredProviders : [];

      if (!launchProviders.includes('google_docs') || !launchProviders.includes('notion')) {
        fail('launchScope should follow WETHUS_LAUNCH_PROVIDERS override');
      }
      if (!deferredProviders.includes('google_sheets')) {
        fail('launchScope should move google_sheets into deferred providers via env override');
      }

      if (providers.get('notion')?.launchPhase !== 'launch') {
        fail(`notion launchPhase should become launch under env override, got ${providers.get('notion')?.launchPhase || 'missing'}`);
      }
      if (providers.get('google_sheets')?.launchPhase !== 'deferred') {
        fail(`google_sheets launchPhase should become deferred under env override, got ${providers.get('google_sheets')?.launchPhase || 'missing'}`);
      }
    }
  } finally {
    await stopChild(child);
    fs.rmSync(smokeDataDir, { recursive: true, force: true });
  }

  if (errors.length) {
    console.error(errors.map((error) => `- ${error}`).join('\n'));
    process.exit(1);
  }

  console.log('Provider launch-scope env override smoke passed.');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
