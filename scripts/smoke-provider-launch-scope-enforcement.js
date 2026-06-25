const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const repoRoot = path.resolve(__dirname, '..');
const backendRoot = path.join(repoRoot, 'WETHUS2', 'backend');
const port = Number(process.env.WETHUS_PROVIDER_LAUNCH_SCOPE_ENFORCEMENT_SMOKE_PORT || 8899);
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

async function getJson(url) {
  const response = await fetch(url);
  const payload = await response.json().catch(() => ({}));
  return { status: response.status, payload };
}

function expectDeferredBlocked(result, label) {
  if (result.status !== 409) {
    fail(`${label} should return 409 when launch-scope enforcement is enabled, got ${result.status}`);
    return;
  }
  if (result.payload?.ok !== false) fail(`${label} should return ok=false`);
  if (result.payload?.launchPhase !== 'deferred') fail(`${label} should return launchPhase=deferred`);
  if (result.payload?.launchIncluded !== false) fail(`${label} should return launchIncluded=false`);
  if (!String(result.payload?.launchNote || '').trim()) fail(`${label} should include launchNote`);
}

function expectGoogleAllowed(result, label) {
  if (result.status !== 200) {
    fail(`${label} should return 200 for launch-scope-allowed google flow, got ${result.status}`);
    return;
  }
  if (result.payload?.ok !== true) fail(`${label} should return ok=true`);
  if (result.payload?.launchPhase !== 'launch') fail(`${label} should return launchPhase=launch`);
  if (result.payload?.launchIncluded !== true) fail(`${label} should return launchIncluded=true`);
}

(async () => {
  const logs = { text: '' };
  const smokeDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wethus-provider-launch-scope-enforcement-smoke-'));
  let child;

  try {
    child = spawn(process.execPath, ['server.js'], {
      cwd: backendRoot,
      env: {
        ...process.env,
        PORT: String(port),
        WETHUS_DATA_DIR: smokeDataDir,
        RATE_LIMIT_DISABLED: 'true',
        INTEGRATIONS_ENFORCE_LAUNCH_SCOPE: 'true'
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    child.stdout.on('data', (data) => { logs.text += data.toString(); });
    child.stderr.on('data', (data) => { logs.text += data.toString(); });

    await waitForServer(child, logs);

    const health = await getJson(`${baseUrl}/health`);
    if (health.payload?.security?.integrationsEnforceLaunchScope !== true) {
      fail('health payload should expose integrationsEnforceLaunchScope=true when enforcement is enabled');
    }

    const notionStart = await getJson(`${baseUrl}/oauth/notion/start?project_id=demo&user_id=user-1`);
    expectDeferredBlocked(notionStart, 'notion oauth start');

    const slackStart = await getJson(`${baseUrl}/oauth/slack/start?project_id=demo&user_id=user-1`);
    expectDeferredBlocked(slackStart, 'slack oauth start');

    const figmaStart = await getJson(`${baseUrl}/oauth/figma/start?project_id=demo&user_id=user-1`);
    expectDeferredBlocked(figmaStart, 'figma oauth start');

    const notionResources = await getJson(`${baseUrl}/integrations/resources?provider=notion&projectId=demo`);
    expectDeferredBlocked(notionResources, 'notion resources');

    const googleStart = await getJson(`${baseUrl}/oauth/google/start?project_id=demo&user_id=user-1`);
    expectGoogleAllowed(googleStart, 'google oauth start');

  } finally {
    await stopChild(child);
    fs.rmSync(smokeDataDir, { recursive: true, force: true });
  }

  if (errors.length) {
    console.error(errors.map((error) => `- ${error}`).join('\n'));
    process.exit(1);
  }

  console.log('Provider launch-scope enforcement smoke passed.');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
