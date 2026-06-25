const { spawn } = require('child_process');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');

const repoRoot = path.resolve(__dirname, '..');
const backendRoot = path.join(repoRoot, 'WETHUS2', 'backend');
const port = Number(process.env.WETHUS_PROJECT_APPLICATIONS_SMOKE_PORT || 8898);
const baseUrl = `http://127.0.0.1:${port}`;
const TEST_JWT_SECRET = process.env.JWT_SECRET || 'project-applications-smoke-secret-1234567890';
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

function seedProjectFixture() {
  const now = new Date().toISOString();
  fs.writeFileSync(path.join(smokeDataDirGlobal, 'users.json'), JSON.stringify({
    users: [
      { id: 'actor-a', email: 'actor-a@example.com', name: 'Founder', nickname: 'Founder', passwordHash: '', createdAt: now, updatedAt: now },
      { id: 'actor-b', email: 'actor-b@example.com', name: 'Leader', nickname: 'Leader', passwordHash: '', createdAt: now, updatedAt: now },
      { id: 'actor-c', email: 'actor-c@example.com', name: 'Applicant C', nickname: 'Applicant C', passwordHash: '', createdAt: now, updatedAt: now },
      { id: 'actor-d', email: 'actor-d@example.com', name: 'Applicant D', nickname: 'Applicant D', passwordHash: '', createdAt: now, updatedAt: now }
    ]
  }, null, 2));

  fs.writeFileSync(path.join(smokeDataDirGlobal, 'cloud-projects.json'), JSON.stringify({
    projects: [
      {
        id: 'smoke-project',
        title: 'Smoke Project',
        founderId: 'actor-a',
        founderEmail: 'actor-a@example.com',
        moderationStatus: 'approved',
        summary: 'Commercialization smoke project',
        comments: [],
        likedBy: [],
        likes: 0,
        createdAt: now,
        teamMembers: [
          { id: 'actor-a', name: 'Founder', isLeader: true, role: 'Founder' },
          { id: 'actor-b', name: 'Leader', isLeader: true, role: 'Leader' }
        ]
      }
    ]
  }, null, 2));

  fs.writeFileSync(path.join(smokeDataDirGlobal, 'project-applications.json'), JSON.stringify({
    applications: [
      {
        id: 'legacy-pending-app',
        projectId: 'smoke-project',
        projectTitle: 'Smoke Project',
        founderId: 'actor-a',
        founderEmail: 'actor-a@example.com',
        userId: 'actor-d',
        applicantName: 'Applicant D',
        applicantEmail: 'actor-d@example.com',
        motivation: 'Legacy pending row',
        status: 'pending',
        createdAt: now,
        updatedAt: now
      }
    ]
  }, null, 2));
}

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(smokeDataDirGlobal, name), 'utf8'));
}

async function expectApplyLifecycle() {
  const applyResponse = await fetch(`${baseUrl}/projects/smoke-project/applications`, {
    method: 'POST',
    headers: actorHeaders('actor-c'),
    body: JSON.stringify({ motivation: 'I can help this project move faster.' })
  });
  const applyPayload = await applyResponse.json().catch(() => ({}));
  if (!applyResponse.ok) {
    fail(`applicant create should succeed, got ${applyResponse.status}`);
    return;
  }
  if (String(applyPayload?.application?.status || '') !== 'applied') {
    fail(`new application should return normalized applied status, got ${applyPayload?.application?.status || 'missing'}`);
  }

  const applicantView = await fetch(`${baseUrl}/projects/smoke-project/applications`, {
    headers: {
      'x-user-id': 'actor-c',
      authorization: `Bearer ${makeTestJwt({ sub: 'actor-c', email: 'actor-c@example.com', name: 'Applicant C' })}`
    }
  });
  const applicantPayload = await applicantView.json().catch(() => ({}));
  if (!applicantView.ok) {
    fail(`applicant application list should succeed, got ${applicantView.status}`);
  } else {
    if (applicantPayload?.isManager !== false) fail('applicant should not be treated as manager');
    if (String(applicantPayload?.role || '') !== 'applicant') fail(`applicant role should be applicant, got ${applicantPayload?.role || 'missing'}`);
    if (!Array.isArray(applicantPayload?.applications) || applicantPayload.applications.length !== 1) {
      fail(`applicant should only see one personal application, got ${Array.isArray(applicantPayload?.applications) ? applicantPayload.applications.length : 'missing'}`);
    }
  }

  const leaderView = await fetch(`${baseUrl}/projects/smoke-project/applications`, {
    headers: {
      'x-user-id': 'actor-b',
      authorization: `Bearer ${makeTestJwt({ sub: 'actor-b', email: 'actor-b@example.com', name: 'Leader' })}`
    }
  });
  const leaderPayload = await leaderView.json().catch(() => ({}));
  if (!leaderView.ok || !leaderPayload?.isManager) {
    fail(`leader should be able to review applications, got ${leaderView.status}`);
  }

  const createdId = String(applyPayload?.application?.id || '').trim();
  const acceptResponse = await fetch(`${baseUrl}/projects/smoke-project/applications/${encodeURIComponent(createdId)}/status`, {
    method: 'POST',
    headers: actorHeaders('actor-a'),
    body: JSON.stringify({ status: 'accepted' })
  });
  const acceptPayload = await acceptResponse.json().catch(() => ({}));
  if (!acceptResponse.ok) {
    fail(`founder accept should succeed, got ${acceptResponse.status}`);
  } else if (String(acceptPayload?.application?.status || '') !== 'accepted') {
    fail(`accepted application should return accepted status, got ${acceptPayload?.application?.status || 'missing'}`);
  }

  const projects = readJson('cloud-projects.json').projects || [];
  const project = projects.find(item => String(item?.id) === 'smoke-project');
  const memberIds = Array.isArray(project?.teamMembers) ? project.teamMembers.map(member => String(member?.id || '')) : [];
  if (!memberIds.includes('actor-c')) {
    fail('accepted applicant should be added to cloud project teamMembers');
  }

  const acceptedApplicantView = await fetch(`${baseUrl}/projects/smoke-project/applications`, {
    headers: {
      'x-user-id': 'actor-c',
      authorization: `Bearer ${makeTestJwt({ sub: 'actor-c', email: 'actor-c@example.com', name: 'Applicant C' })}`
    }
  });
  const acceptedApplicantPayload = await acceptedApplicantView.json().catch(() => ({}));
  if (!acceptedApplicantView.ok) {
    fail(`accepted member should still read application history, got ${acceptedApplicantView.status}`);
  } else {
    const actorCApp = Array.isArray(acceptedApplicantPayload?.applications)
      ? acceptedApplicantPayload.applications.find(item => String(item?.userId || '') === 'actor-c')
      : null;
    if (String(actorCApp?.status || '') !== 'accepted') {
      fail(`accepted applicant history should expose accepted status, got ${actorCApp?.status || 'missing'}`);
    }
  }
}

async function expectLegacyPendingNormalization() {
  const legacyView = await fetch(`${baseUrl}/projects/smoke-project/applications`, {
    headers: {
      'x-user-id': 'actor-d',
      authorization: `Bearer ${makeTestJwt({ sub: 'actor-d', email: 'actor-d@example.com', name: 'Applicant D' })}`
    }
  });
  const legacyPayload = await legacyView.json().catch(() => ({}));
  if (!legacyView.ok) {
    fail(`legacy applicant list should succeed, got ${legacyView.status}`);
  } else {
    const legacyApp = Array.isArray(legacyPayload?.applications) ? legacyPayload.applications[0] : null;
    if (String(legacyApp?.status || '') !== 'applied') {
      fail(`legacy pending application should normalize to applied in API responses, got ${legacyApp?.status || 'missing'}`);
    }
  }

  const cancelResponse = await fetch(`${baseUrl}/projects/smoke-project/applications/me`, {
    method: 'DELETE',
    headers: {
      'x-user-id': 'actor-d',
      authorization: `Bearer ${makeTestJwt({ sub: 'actor-d', email: 'actor-d@example.com', name: 'Applicant D' })}`
    }
  });
  const cancelPayload = await cancelResponse.json().catch(() => ({}));
  if (!cancelResponse.ok || cancelPayload?.cancelled !== true) {
    fail(`legacy pending application should be cancellable, got ${cancelResponse.status}`);
  } else if (String(cancelPayload?.application?.status || '') !== 'cancelled') {
    fail(`cancelled legacy application should return cancelled status, got ${cancelPayload?.application?.status || 'missing'}`);
  }
}

(async () => {
  const logs = { text: '' };
  const smokeDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wethus-project-applications-smoke-'));
  smokeDataDirGlobal = smokeDataDir;
  let child;

  try {
    seedProjectFixture();
    child = spawn(process.execPath, ['server.js'], {
      cwd: backendRoot,
      env: {
        ...process.env,
        PORT: String(port),
        WETHUS_DATA_DIR: smokeDataDir,
        RATE_LIMIT_DISABLED: 'true',
        CLOUD_STATE_REQUIRE_SESSION: 'true',
        INTEGRATIONS_REQUIRE_ACTOR: 'true',
        INTEGRATIONS_REQUIRE_SESSION: 'true',
        PROJECT_INTERACTIONS_REQUIRE_SESSION: 'true',
        PROJECT_ACCESS_REQUIRE_MEMBERSHIP: 'true',
        JWT_SECRET: TEST_JWT_SECRET
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    child.stdout.on('data', data => { logs.text += data.toString(); });
    child.stderr.on('data', data => { logs.text += data.toString(); });

    await waitForServer(child, logs);
    await expectApplyLifecycle();
    await expectLegacyPendingNormalization();
  } finally {
    await stopChild(child);
    fs.rmSync(smokeDataDir, { recursive: true, force: true });
  }

  if (errors.length) {
    console.error(errors.map(error => `- ${error}`).join('\n'));
    process.exit(1);
  }

  console.log('Project application smoke passed.');
})().catch(err => {
  console.error(err);
  process.exit(1);
});
