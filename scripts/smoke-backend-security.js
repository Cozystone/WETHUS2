const { spawn } = require('child_process');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const backendRoot = path.join(repoRoot, 'WETHUS2', 'backend');
const port = Number(process.env.WETHUS_BACKEND_SMOKE_PORT || 8899);
const baseUrl = `http://127.0.0.1:${port}`;
const errors = [];

function fail(message) {
  errors.push(message);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
  const csp = response.headers.get('content-security-policy') || '';
  const nosniff = response.headers.get('x-content-type-options') || '';
  const frame = response.headers.get('x-frame-options') || '';
  const referrer = response.headers.get('referrer-policy') || '';
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
    headers: { 'content-type': 'application/json', 'x-user-id': 'actor-a' },
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
      headers: { 'x-user-id': 'actor-b' }
    });
    if (forbiddenDelete.status !== 403) fail(`DELETE /integrations/:id by another actor should be forbidden, got ${forbiddenDelete.status}`);
  }
}

(async () => {
  const logs = { text: '' };
  const child = spawn(process.execPath, ['server.js'], {
    cwd: backendRoot,
    env: {
      ...process.env,
      PORT: String(port),
      RATE_LIMIT_DISABLED: 'false',
      CLOUD_STATE_REQUIRE_SESSION: 'true',
      INTEGRATIONS_REQUIRE_ACTOR: 'true',
      JWT_SECRET: process.env.JWT_SECRET || 'backend-security-smoke-secret-1234567890'
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  child.stdout.on('data', data => { logs.text += data.toString(); });
  child.stderr.on('data', data => { logs.text += data.toString(); });

  try {
    await waitForServer(child, logs);
    await expectSecurityHeaders();
    await expectSsrfGuard();
    await expectRateLimit();
    await expectCloudStateGuard();
    await expectIntegrationActorGuard();
  } finally {
    child.kill();
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
