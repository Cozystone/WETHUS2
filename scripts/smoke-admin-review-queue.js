const { spawn } = require('child_process');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');

const repoRoot = path.resolve(__dirname, '..');
const backendRoot = path.join(repoRoot, 'WETHUS2', 'backend');
const port = Number(process.env.WETHUS_ADMIN_REVIEW_SMOKE_PORT || 8896);
const baseUrl = `http://127.0.0.1:${port}`;
const TEST_JWT_SECRET = process.env.JWT_SECRET || 'admin-review-smoke-secret-1234567890';
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

function authHeaders(actorId, email) {
  return {
    'content-type': 'application/json',
    authorization: `Bearer ${makeTestJwt({ sub: actorId, email, name: actorId })}`
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
      { id: 'admin-1', email: 'admin@wethus.ai', name: 'Admin', nickname: 'Admin', role: 'admin', passwordHash: '', createdAt: now, updatedAt: now },
      { id: 'founder-1', email: 'founder@example.com', name: 'Founder', nickname: 'Founder', passwordHash: '', createdAt: now, updatedAt: now },
      { id: 'member-1', email: 'member@example.com', name: 'Member', nickname: 'Member', passwordHash: '', createdAt: now, updatedAt: now }
    ]
  }, null, 2));

  fs.writeFileSync(path.join(smokeDataDirGlobal, 'cloud-projects.json'), JSON.stringify({
    projects: [
      {
        id: 'review-project-a',
        title: 'Needs review A',
        founderId: 'founder-1',
        founderEmail: 'founder@example.com',
        summary: 'A manual review project',
        moderationStatus: 'manual_review',
        moderationReason: 'AI requested review',
        createdAt: now,
        updatedAt: now,
        teamMembers: [{ id: 'founder-1', name: 'Founder', isLeader: true, role: 'Founder' }]
      },
      {
        id: 'review-project-b',
        title: 'Needs review B',
        founderId: 'founder-1',
        founderEmail: 'founder@example.com',
        summary: 'Another manual review project',
        moderationStatus: 'manual_review',
        moderationReason: 'AI requested review',
        createdAt: now,
        updatedAt: now,
        teamMembers: [{ id: 'founder-1', name: 'Founder', isLeader: true, role: 'Founder' }]
      },
      {
        id: 'approved-project',
        title: 'Approved project',
        founderId: 'founder-1',
        founderEmail: 'founder@example.com',
        summary: 'Already approved',
        moderationStatus: 'approved',
        createdAt: now,
        updatedAt: now,
        teamMembers: [{ id: 'founder-1', name: 'Founder', isLeader: true, role: 'Founder' }]
      }
    ]
  }, null, 2));
}

function readProjects() {
  return JSON.parse(fs.readFileSync(path.join(smokeDataDirGlobal, 'cloud-projects.json'), 'utf8')).projects || [];
}

function readEvents() {
  const file = path.join(smokeDataDirGlobal, 'activity-events.json');
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf8')).events || [];
}

async function expectNonAdminDenied() {
  const response = await fetch(`${baseUrl}/admin/review-projects`, {
    headers: authHeaders('member-1', 'member@example.com')
  });
  if (response.status !== 403) {
    fail(`non-admin review queue should return 403, got ${response.status}`);
  }
}

async function expectQueueList() {
  const response = await fetch(`${baseUrl}/admin/review-projects`, {
    headers: authHeaders('admin-1', 'admin@wethus.ai')
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    fail(`admin review queue should succeed, got ${response.status}`);
    return;
  }
  if (!Array.isArray(payload?.rows) || payload.rows.length !== 2) {
    fail(`admin review queue should return 2 manual_review projects, got ${Array.isArray(payload?.rows) ? payload.rows.length : 'missing'}`);
    return;
  }
  if (payload.rows.some(row => String(row?.moderationStatus || '') !== 'manual_review')) {
    fail('admin review queue should only include manual_review projects');
  }
}

async function expectApproveAndReject() {
  const approveResponse = await fetch(`${baseUrl}/admin/review-projects/review-project-a/decision`, {
    method: 'POST',
    headers: authHeaders('admin-1', 'admin@wethus.ai'),
    body: JSON.stringify({ decision: 'approve', note: '운영자 승인' })
  });
  const approvePayload = await approveResponse.json().catch(() => ({}));
  if (!approveResponse.ok) {
    fail(`admin approve should succeed, got ${approveResponse.status}`);
  } else if (String(approvePayload?.project?.moderationStatus || '') !== 'approved') {
    fail(`approved project should return approved moderationStatus, got ${approvePayload?.project?.moderationStatus || 'missing'}`);
  }

  const rejectResponse = await fetch(`${baseUrl}/admin/review-projects/review-project-b/decision`, {
    method: 'POST',
    headers: authHeaders('admin-1', 'admin@wethus.ai'),
    body: JSON.stringify({ decision: 'reject', note: '운영자 반려' })
  });
  const rejectPayload = await rejectResponse.json().catch(() => ({}));
  if (!rejectResponse.ok) {
    fail(`admin reject should succeed, got ${rejectResponse.status}`);
  } else if (String(rejectPayload?.project?.moderationStatus || '') !== 'rejected') {
    fail(`rejected project should return rejected moderationStatus, got ${rejectPayload?.project?.moderationStatus || 'missing'}`);
  }

  const projects = readProjects();
  const approved = projects.find(project => project.id === 'review-project-a');
  const rejected = projects.find(project => project.id === 'review-project-b');
  if (String(approved?.moderationStatus || '') !== 'approved') {
    fail('approved project should persist approved moderationStatus');
  }
  if (String(rejected?.moderationStatus || '') !== 'rejected') {
    fail('rejected project should persist rejected moderationStatus');
  }
  if (!String(approved?.moderationReviewedAt || '').includes('T')) {
    fail('approved project should persist moderationReviewedAt');
  }
  if (!String(rejected?.moderationReviewedAt || '').includes('T')) {
    fail('rejected project should persist moderationReviewedAt');
  }

  const queueAfterResponse = await fetch(`${baseUrl}/admin/review-projects`, {
    headers: authHeaders('admin-1', 'admin@wethus.ai')
  });
  const queueAfterPayload = await queueAfterResponse.json().catch(() => ({}));
  if (!queueAfterResponse.ok) {
    fail(`admin review queue after decisions should succeed, got ${queueAfterResponse.status}`);
  } else if (Array.isArray(queueAfterPayload?.rows) && queueAfterPayload.rows.length !== 0) {
    fail(`admin review queue should be empty after decisions, got ${queueAfterPayload.rows.length}`);
  }

  const events = readEvents();
  const eventTypes = events.map(event => String(event?.event_type || ''));
  if (!eventTypes.includes('project_manual_review_approved')) {
    fail('audit events should include project_manual_review_approved');
  }
  if (!eventTypes.includes('project_manual_review_rejected')) {
    fail('audit events should include project_manual_review_rejected');
  }
}

(async () => {
  const logs = { text: '' };
  const smokeDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wethus-admin-review-smoke-'));
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
        JWT_SECRET: TEST_JWT_SECRET
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    child.stdout.on('data', data => { logs.text += data.toString(); });
    child.stderr.on('data', data => { logs.text += data.toString(); });

    await waitForServer(child, logs);
    await expectNonAdminDenied();
    await expectQueueList();
    await expectApproveAndReject();
  } finally {
    await stopChild(child);
    fs.rmSync(smokeDataDir, { recursive: true, force: true });
  }

  if (errors.length) {
    console.error(errors.map(error => `- ${error}`).join('\n'));
    process.exit(1);
  }

  console.log('Admin review queue smoke passed.');
})().catch(err => {
  console.error(err);
  process.exit(1);
});
