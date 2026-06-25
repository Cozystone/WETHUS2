const { spawn } = require('child_process');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');

const repoRoot = path.resolve(__dirname, '..');
const backendRoot = path.join(repoRoot, 'WETHUS2', 'backend');
const port = Number(process.env.WETHUS_INTEGRATION_ACTIVITY_SMOKE_PORT || 8893);
const baseUrl = `http://127.0.0.1:${port}`;
const TEST_JWT_SECRET = process.env.JWT_SECRET || 'integration-activity-smoke-secret-1234567890';
const errors = [];
let smokeDataDirGlobal = '';

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

function actorHeaders(actorId) {
  return {
    'content-type': 'application/json',
    'x-user-id': actorId,
    authorization: `Bearer ${makeTestJwt({ sub: actorId, email: `${actorId}@example.com`, name: actorId })}`
  };
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

function seedFixture() {
  const now = new Date().toISOString();
  fs.writeFileSync(path.join(smokeDataDirGlobal, 'users.json'), JSON.stringify({
    users: [
      { id: 'actor-a', email: 'actor-a@example.com', name: 'Founder', nickname: 'Founder', passwordHash: '', createdAt: now, updatedAt: now },
      { id: 'actor-b', email: 'actor-b@example.com', name: 'Member', nickname: 'Member', passwordHash: '', createdAt: now, updatedAt: now }
    ]
  }, null, 2));

  fs.writeFileSync(path.join(smokeDataDirGlobal, 'cloud-projects.json'), JSON.stringify({
    projects: [
      {
        id: 'integration-project',
        title: 'Integration Activity Project',
        founderId: 'actor-a',
        founderEmail: 'actor-a@example.com',
        moderationStatus: 'approved',
        summary: 'Integration activity smoke fixture',
        createdAt: now,
        updatedAt: now,
        teamMembers: [
          { id: 'actor-a', name: 'Founder', isLeader: true, role: 'Founder' },
          { id: 'actor-b', name: 'Member', isLeader: false, role: 'Designer' }
        ]
      }
    ]
  }, null, 2));
}

async function getProjectEvents() {
  const response = await fetch(`${baseUrl}/activity-events?projectId=integration-project&limit=50`, {
    headers: actorHeaders('actor-a')
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    fail(`GET /activity-events should succeed for founder, got ${response.status}`);
    return [];
  }
  return Array.isArray(payload?.events) ? payload.events : [];
}

async function getProjectIntegrations() {
  const response = await fetch(`${baseUrl}/integrations?projectId=integration-project`, {
    headers: actorHeaders('actor-a')
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    fail(`GET /integrations should succeed for founder, got ${response.status}`);
    return [];
  }
  return Array.isArray(payload?.integrations) ? payload.integrations : [];
}

async function expectLifecycleEvents() {
  const createResponse = await fetch(`${baseUrl}/integrations`, {
    method: 'POST',
    headers: actorHeaders('actor-a'),
    body: JSON.stringify({
      project_id: 'integration-project',
      integration_type: 'document',
      provider: 'notion',
      external_resource_id: `demo-doc-${Date.now()}`,
      external_resource_name: 'Demo Notion Doc'
    })
  });
  const createPayload = await createResponse.json().catch(() => ({}));
  if (!createResponse.ok || !createPayload?.integration?.id) {
    fail(`POST /integrations should create an integration, got ${createResponse.status}`);
    return;
  }

  const integrationId = createPayload.integration.id;
  const configureWebhook = await fetch(`${baseUrl}/integrations/${integrationId}/webhook-config`, {
    method: 'POST',
    headers: actorHeaders('actor-a')
  });
  const webhookPayload = await configureWebhook.json().catch(() => ({}));
  if (!configureWebhook.ok || !webhookPayload?.webhook_secret || !webhookPayload?.webhook_url) {
    fail(`POST /integrations/:id/webhook-config should return a secret and URL, got ${configureWebhook.status}`);
    return;
  }
  if (webhookPayload?.reissued !== false) {
    fail(`first webhook issue should return reissued=false, got ${String(webhookPayload?.reissued)}`);
  }

  const webhookResponse = await fetch(webhookPayload.webhook_url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-webhook-secret': webhookPayload.webhook_secret
    },
    body: JSON.stringify({
      event_type: 'task_updated',
      item_id: 'task-1',
      item_name: 'Sprint Plan',
      actor_name: 'Notion Bot'
    })
  });
  const webhookEventPayload = await webhookResponse.json().catch(() => ({}));
  if (!webhookResponse.ok || !webhookEventPayload?.accepted) {
    fail(`POST webhook should be accepted, got ${webhookResponse.status}`);
  }

  const reissueWebhook = await fetch(`${baseUrl}/integrations/${integrationId}/webhook-config`, {
    method: 'POST',
    headers: actorHeaders('actor-a')
  });
  const reissuePayload = await reissueWebhook.json().catch(() => ({}));
  if (!reissueWebhook.ok || !reissuePayload?.webhook_secret || !reissuePayload?.webhook_url) {
    fail(`second POST /integrations/:id/webhook-config should also return a secret and URL, got ${reissueWebhook.status}`);
    return;
  }
  if (reissuePayload?.reissued !== true) {
    fail(`second webhook issue should return reissued=true, got ${String(reissuePayload?.reissued)}`);
  }
  if (String(reissuePayload?.webhook_secret || '') === String(webhookPayload?.webhook_secret || '')) {
    fail('reissued webhook secret should differ from the previous secret');
  }

  const staleSecretResponse = await fetch(reissuePayload.webhook_url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-webhook-secret': webhookPayload.webhook_secret
    },
    body: JSON.stringify({
      event_type: 'task_updated',
      item_id: 'task-stale',
      item_name: 'Stale Secret Attempt',
      actor_name: 'Stale Bot'
    })
  });
  if (staleSecretResponse.status !== 401) {
    fail(`old webhook secret should be rejected after reissue, got ${staleSecretResponse.status}`);
  }

  const reissuedWebhookResponse = await fetch(reissuePayload.webhook_url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-webhook-secret': reissuePayload.webhook_secret
    },
    body: JSON.stringify({
      event_type: 'task_updated',
      item_id: 'task-2',
      item_name: 'Reissued Secret Plan',
      actor_name: 'Notion Bot'
    })
  });
  const reissuedWebhookEventPayload = await reissuedWebhookResponse.json().catch(() => ({}));
  if (!reissuedWebhookResponse.ok || !reissuedWebhookEventPayload?.accepted) {
    fail(`POST webhook with reissued secret should be accepted, got ${reissuedWebhookResponse.status}`);
  }

  let integrations = await getProjectIntegrations();
  let recreated = integrations.find((item) => String(item?.id || '') === String(createPayload?.integration?.id || ''));
  if (!recreated) {
    fail('integration should still be listed after webhook verification');
    return;
  }
  if (String(recreated?.webhook_health || '') !== 'healthy') {
    fail(`recent webhook verification should report webhook_health=healthy, got ${recreated?.webhook_health || 'missing'}`);
  }
  if (recreated?.webhook_verified !== true) {
    fail(`recent webhook verification should set webhook_verified=true, got ${String(recreated?.webhook_verified)}`);
  }

  const staleOccurredAt = new Date(Date.now() - (9 * 24 * 60 * 60 * 1000)).toISOString();
  const staleWebhookResponse = await fetch(reissuePayload.webhook_url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-webhook-secret': reissuePayload.webhook_secret
    },
    body: JSON.stringify({
      event_type: 'task_updated',
      item_id: 'task-old',
      item_name: 'Old Relay Ping',
      actor_name: 'Notion Bot',
      occurred_at: staleOccurredAt
    })
  });
  const staleWebhookPayload = await staleWebhookResponse.json().catch(() => ({}));
  if (!staleWebhookResponse.ok || !staleWebhookPayload?.accepted) {
    fail(`POST webhook with stale occurred_at should still be accepted, got ${staleWebhookResponse.status}`);
  }

  const disconnectResponse = await fetch(`${baseUrl}/integrations/${integrationId}`, {
    method: 'DELETE',
    headers: actorHeaders('actor-a')
  });
  if (!disconnectResponse.ok) {
    fail(`soft DELETE /integrations/:id should succeed, got ${disconnectResponse.status}`);
  }

  const recreateResponse = await fetch(`${baseUrl}/integrations`, {
    method: 'POST',
    headers: actorHeaders('actor-a'),
    body: JSON.stringify({
      project_id: 'integration-project',
      integration_type: 'document',
      provider: 'notion',
      external_resource_id: createPayload.integration.external_resource_id,
      external_resource_name: 'Demo Notion Doc'
    })
  });
  const recreatePayload = await recreateResponse.json().catch(() => ({}));
  if (!recreateResponse.ok || !recreatePayload?.integration?.id) {
    fail(`reconnecting an integration should succeed, got ${recreateResponse.status}`);
  }

  integrations = await getProjectIntegrations();
  recreated = integrations.find((item) => String(item?.id || '') === String(recreatePayload?.integration?.id || ''));
  if (!recreated) {
    fail('reconnected integration should still be listed before hard delete');
    return;
  }
  if (!String(recreated?.webhook_last_event_at || '').trim()) {
    fail('integration webhook state should retain the last external event timestamp');
  }
  if (String(recreated?.webhook_last_event_type || '') !== 'task_updated') {
    fail(`integration webhook state should retain the last external event type, got ${recreated?.webhook_last_event_type || 'missing'}`);
  }
  if (String(recreated?.webhook_last_item_name || '') !== 'Old Relay Ping') {
    fail(`integration webhook state should retain the latest external item name, got ${recreated?.webhook_last_item_name || 'missing'}`);
  }
  if (Number(recreated?.webhook_delivery_count || 0) < 1) {
    fail('integration webhook state should increment delivery count after a webhook event');
  }
  if (String(recreated?.webhook_health || '') !== 'stale') {
    fail(`old webhook verification should report webhook_health=stale, got ${recreated?.webhook_health || 'missing'}`);
  }
  if (Number(recreated?.webhook_verified_age_hours || 0) < 24 * 7) {
    fail(`stale webhook verification should expose an age above the stale threshold, got ${recreated?.webhook_verified_age_hours || 'missing'}`);
  }

  const hardDeleteResponse = await fetch(`${baseUrl}/integrations/${integrationId}?hard=1`, {
    method: 'DELETE',
    headers: actorHeaders('actor-a')
  });
  if (!hardDeleteResponse.ok) {
    fail(`hard DELETE /integrations/:id should succeed, got ${hardDeleteResponse.status}`);
  }

  const events = await getProjectEvents();
  const eventTypes = events.map(event => String(event?.event_type || ''));
  ['integration_connected', 'task_updated', 'integration_disconnected', 'integration_reconnected', 'integration_deleted'].forEach((eventType) => {
    if (!eventTypes.includes(eventType)) {
      fail(`activity log should include ${eventType}`);
    }
  });

  const connectedEvent = events.find(event => String(event?.event_type || '') === 'integration_connected');
  if (String(connectedEvent?.source_type || '') !== 'notion') {
    fail('integration_connected should preserve the provider as source_type');
  }

  const webhookEvent = events.find(event => String(event?.event_type || '') === 'task_updated');
  if (!events.some(event => String(event?.source_item_name || '') === 'Sprint Plan')) {
    fail('webhook events should preserve the original external item name in activity-events');
  }
  if (!events.some(event => String(event?.source_item_name || '') === 'Reissued Secret Plan')) {
    fail('webhook events should preserve the reissued-secret external item name in activity-events');
  }
  if (!events.some(event => String(event?.source_item_name || '') === 'Old Relay Ping')) {
    fail('webhook events should preserve the stale external item name in activity-events');
  }
  if (!webhookEvent) {
    fail('activity log should contain at least one task_updated event');
  }
}

(async () => {
  const logs = { text: '' };
  const smokeDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wethus-integration-activity-smoke-'));
  smokeDataDirGlobal = smokeDataDir;
  let child;

  try {
    seedFixture();
    child = spawn(process.execPath, ['server.js'], {
      cwd: backendRoot,
      env: {
        ...process.env,
        PORT: String(port),
        WETHUS_DATA_DIR: smokeDataDir,
        RATE_LIMIT_DISABLED: 'true',
        JWT_SECRET: TEST_JWT_SECRET,
        CLOUD_STATE_REQUIRE_SESSION: 'true',
        INTEGRATIONS_REQUIRE_ACTOR: 'true',
        INTEGRATIONS_REQUIRE_SESSION: 'true',
        PROJECT_INTERACTIONS_REQUIRE_SESSION: 'true',
        PROJECT_ACCESS_REQUIRE_MEMBERSHIP: 'true'
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    child.stdout.on('data', chunk => { logs.text += chunk.toString(); });
    child.stderr.on('data', chunk => { logs.text += chunk.toString(); });

    await waitForServer(child, logs);
    await expectLifecycleEvents();
  } catch (error) {
    fail(error.message || String(error));
  } finally {
    await stopChild(child);
  }

  if (errors.length) {
    console.error('Integration activity log smoke failures:');
    errors.forEach((message) => console.error(`- ${message}`));
    process.exit(1);
  }

  console.log('Integration activity log smoke passed.');
})();
