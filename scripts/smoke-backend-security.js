const { spawn } = require('child_process');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');

const repoRoot = path.resolve(__dirname, '..');
const backendRoot = path.join(repoRoot, 'WETHUS2', 'backend');
const port = Number(process.env.WETHUS_BACKEND_SMOKE_PORT || 8899);
const baseUrl = `http://127.0.0.1:${port}`;
const TEST_JWT_SECRET = process.env.JWT_SECRET || 'backend-security-smoke-secret-1234567890';
const errors = [];

function fail(message) {
  errors.push(message);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function stopChild(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return Promise.resolve();
  return new Promise(resolve => {
    const timeout = setTimeout(resolve, 3000);
    child.once('exit', () => {
      clearTimeout(timeout);
      resolve();
    });
    child.kill();
  });
}

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

function makeTestJwt(payload) {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const body = base64url(JSON.stringify({ iat: now, exp: now + 3600, ...payload }));
  const signature = crypto.createHmac('sha256', TEST_JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

async function waitForServer(child, logs) {
  for (let i = 0; i < 40; i += 1) {
    if (child.exitCode !== null) break;
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) return response;
    } catch (_) {}
    await sleep(250);
  }
  throw new Error(`backend did not start on ${baseUrl}\n${logs.text}`);
}

async function expectSecurityHeaders() {
  const response = await fetch(`${baseUrl}/health`);
  const body = await response.json().catch(() => ({}));
  const csp = response.headers.get('content-security-policy') || '';
  const nosniff = response.headers.get('x-content-type-options') || '';
  const frame = response.headers.get('x-frame-options') || '';
  const referrer = response.headers.get('referrer-policy') || '';
  if (body.service !== 'wethus-backend') fail('/health should expose service identity');
  if (!body.security?.rateLimit) fail('/health should expose enabled rate limiting');
  if (body.security?.cloudStateRequireSession !== true) fail('/health should expose cloud state guard status');
  if (body.security?.integrationsRequireActor !== true) fail('/health should expose integration actor guard status');
  if (body.security?.integrationsRequireSession !== true) fail('/health should expose integration session guard status');
  if (!csp.includes("default-src 'none'")) fail('missing strict Content-Security-Policy on /health');
  if (nosniff !== 'nosniff') fail('missing X-Content-Type-Options: nosniff');
  if (frame !== 'DENY') fail('missing X-Frame-Options: DENY');
  if (referrer !== 'no-referrer') fail('missing Referrer-Policy: no-referrer');
}

async function expectSsrfGuard() {
  const response = await fetch(`${baseUrl}/tools/fetch-meta`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ url: 'http://127.0.0.1:80/' })
  });
  const body = await response.json().catch(() => ({}));
  if (response.status !== 400) fail(`/tools/fetch-meta should reject localhost with 400, got ${response.status}`);
  if (!/private|local/i.test(String(body.error || ''))) fail('/tools/fetch-meta rejection should mention private/local URL');
}

async function expectRateLimit() {
  let limited = false;
  for (let i = 0; i < 31; i += 1) {
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'nobody@example.com', password: 'badpass123' })
    });
    if (response.status === 429) {
      limited = true;
      if (!response.headers.get('retry-after')) fail('rate-limited response should include Retry-After');
      break;
    }
  }
  if (!limited) fail('/auth/login rate limit did not trigger after repeated requests');
}

async function expectCloudStateGuard() {
  const readResponse = await fetch(`${baseUrl}/cloud/state?email=victim@example.com`);
  if (readResponse.status !== 401) fail(`/cloud/state GET should require a session when guard is enabled, got ${readResponse.status}`);

  const writeResponse = await fetch(`${baseUrl}/cloud/state`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'victim@example.com', state: { users: [], projects: [] } })
  });
  if (writeResponse.status !== 401) fail(`/cloud/state POST should require a session when guard is enabled, got ${writeResponse.status}`);
}

async function expectIntegrationActorGuard() {
  const guardedChecks = [
    ['/integrations?projectId=smoke-project', 'GET'],
    ['/activity-events?projectId=smoke-project', 'GET'],
    ['/integrations/insights?projectId=smoke-project', 'GET'],
    ['/integrations/resources?provider=notion&projectId=smoke-project', 'GET'],
    ['/integrations/resources2?provider=google&projectId=smoke-project&resourceProvider=google_docs', 'GET'],
    ['/status-snapshot?projectId=smoke-project', 'GET'],
    ['/external-identities?userId=smoke-user', 'GET']
  ];

  for (const [path, method] of guardedChecks) {
    const response = await fetch(`${baseUrl}${path}`, { method });
    if (response.status !== 401) fail(`${method} ${path} should require an actor when guard is enabled, got ${response.status}`);
  }

  const createResponse = await fetch(`${baseUrl}/integrations`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      project_id: 'smoke-project',
      integration_type: 'document',
      provider: 'notion',
      external_resource_id: 'smoke-doc'
    })
  });
  if (createResponse.status !== 401) fail(`POST /integrations should require an actor when guard is enabled, got ${createResponse.status}`);

  const actorCreate = await fetch(`${baseUrl}/integrations`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-user-id': 'actor-a',
      authorization: `Bearer ${makeTestJwt({ sub: 'actor-a', email: 'actor-a@example.com', name: 'Actor A' })}`
    },
    body: JSON.stringify({
      project_id: 'smoke-project',
      integration_type: 'document',
      provider: 'notion',
      external_resource_id: `smoke-doc-${Date.now()}`
    })
  });
  const created = await actorCreate.json().catch(() => ({}));
  if (!actorCreate.ok || !created?.integration?.id) fail(`POST /integrations with actor should succeed, got ${actorCreate.status}`);

  if (created?.integration?.id) {
    const forbiddenDelete = await fetch(`${baseUrl}/integrations/${created.integration.id}`, {
      method: 'DELETE',
      headers: {
        'x-user-id': 'actor-b',
        authorization: `Bearer ${makeTestJwt({ sub: 'actor-b', email: 'actor-b@example.com', name: 'Actor B' })}`
      }
    });
    if (forbiddenDelete.status !== 403) fail(`DELETE /integrations/:id by another actor should be forbidden, got ${forbiddenDelete.status}`);

    const mismatchDelete = await fetch(`${baseUrl}/integrations/${created.integration.id}`, {
      method: 'DELETE',
      headers: {
        'x-user-id': 'actor-a',
        authorization: `Bearer ${makeTestJwt({ sub: 'actor-b', email: 'actor-b@example.com', name: 'Actor B' })}`
      }
    });
    if (mismatchDelete.status !== 403) fail(`DELETE /integrations/:id with mismatched session should be forbidden, got ${mismatchDelete.status}`);
  }
}

(async () => {
  const logs = { text: '' };
  const smokeDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wethus-backend-smoke-'));
  let child;

  try {
    child = spawn(process.execPath, ['server.js'], {
      cwd: backendRoot,
      env: {
        ...process.env,
        PORT: String(port),
        WETHUS_DATA_DIR: smokeDataDir,
        RATE_LIMIT_DISABLED: 'false',
        CLOUD_STATE_REQUIRE_SESSION: 'true',
        INTEGRATIONS_REQUIRE_ACTOR: 'true',
        INTEGRATIONS_REQUIRE_SESSION: 'true',
        JWT_SECRET: TEST_JWT_SECRET
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    child.stdout.on('data', data => { logs.text += data.toString(); });
    child.stderr.on('data', data => { logs.text += data.toString(); });

    await waitForServer(child, logs);
    await expectSecurityHeaders();
    await expectSsrfGuard();
    await expectRateLimit();
    await expectCloudStateGuard();
    await expectIntegrationActorGuard();
  } finally {
    await stopChild(child);
    fs.rmSync(smokeDataDir, { recursive: true, force: true });
  }

  if (errors.length) {
    console.error(errors.map(error => `- ${error}`).join('\n'));
    process.exit(1);
  }

  console.log('Backend security smoke passed.');
})().catch(err => {
  console.error(err);
  process.exit(1);
});
