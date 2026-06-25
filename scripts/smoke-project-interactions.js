const { spawn } = require('child_process');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');

const repoRoot = path.resolve(__dirname, '..');
const backendRoot = path.join(repoRoot, 'WETHUS2', 'backend');
const port = Number(process.env.WETHUS_PROJECT_INTERACTIONS_SMOKE_PORT || 8895);
const baseUrl = `http://127.0.0.1:${port}`;
const TEST_JWT_SECRET = process.env.JWT_SECRET || 'project-interactions-smoke-secret-1234567890';
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
      { id: 'actor-b', email: 'actor-b@example.com', name: 'Member B', nickname: 'MemberB', passwordHash: '', createdAt: now, updatedAt: now }
    ]
  }, null, 2));

  fs.writeFileSync(path.join(smokeDataDirGlobal, 'cloud-projects.json'), JSON.stringify({
    projects: [
      {
        id: 'interaction-project',
        title: 'Interaction Project',
        founderId: 'actor-a',
        founderEmail: 'actor-a@example.com',
        moderationStatus: 'approved',
        summary: 'Project interaction smoke fixture',
        comments: [],
        likedBy: [],
        likes: 0,
        createdAt: now,
        updatedAt: now,
        teamMembers: [
          { id: 'actor-a', name: 'Founder', isLeader: true, role: 'Founder' }
        ]
      }
    ]
  }, null, 2));
}

function readProjects() {
  return JSON.parse(fs.readFileSync(path.join(smokeDataDirGlobal, 'cloud-projects.json'), 'utf8')).projects || [];
}

function readBookmarks() {
  const file = path.join(smokeDataDirGlobal, 'project-bookmarks.json');
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf8')).bookmarks || [];
}

function readEvents() {
  const file = path.join(smokeDataDirGlobal, 'activity-events.json');
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf8')).events || [];
}

async function expectLikeLifecycle() {
  const likeAdd = await fetch(`${baseUrl}/projects/interaction-project/likes/toggle`, {
    method: 'POST',
    headers: actorHeaders('actor-b')
  });
  const likeAddPayload = await likeAdd.json().catch(() => ({}));
  if (!likeAdd.ok) {
    fail(`like add should succeed, got ${likeAdd.status}`);
    return;
  }
  if (likeAddPayload.liked !== true || Number(likeAddPayload.likes || 0) !== 1) {
    fail(`like add should return liked=true and likes=1, got liked=${likeAddPayload.liked} likes=${likeAddPayload.likes}`);
  }

  const afterAdd = readProjects().find(project => project.id === 'interaction-project');
  const likedByAfterAdd = Array.isArray(afterAdd?.likedBy) ? afterAdd.likedBy : [];
  if (!likedByAfterAdd.includes('actor-b') || Number(afterAdd?.likes || 0) !== 1) {
    fail('like add should persist likedBy and likes to cloud-projects');
  }

  const likeRemove = await fetch(`${baseUrl}/projects/interaction-project/likes/toggle`, {
    method: 'POST',
    headers: actorHeaders('actor-b')
  });
  const likeRemovePayload = await likeRemove.json().catch(() => ({}));
  if (!likeRemove.ok) {
    fail(`like remove should succeed, got ${likeRemove.status}`);
    return;
  }
  if (likeRemovePayload.liked !== false || Number(likeRemovePayload.likes || 0) !== 0) {
    fail(`like remove should return liked=false and likes=0, got liked=${likeRemovePayload.liked} likes=${likeRemovePayload.likes}`);
  }

  const afterRemove = readProjects().find(project => project.id === 'interaction-project');
  const likedByAfterRemove = Array.isArray(afterRemove?.likedBy) ? afterRemove.likedBy : [];
  if (likedByAfterRemove.includes('actor-b') || Number(afterRemove?.likes || 0) !== 0) {
    fail('like remove should persist likedBy removal and likes=0 to cloud-projects');
  }
}

async function expectCommentLifecycle() {
  const commentResponse = await fetch(`${baseUrl}/projects/interaction-project/comments`, {
    method: 'POST',
    headers: actorHeaders('actor-b'),
    body: JSON.stringify({ text: 'Meaningful project feedback.' })
  });
  const commentPayload = await commentResponse.json().catch(() => ({}));
  if (!commentResponse.ok) {
    fail(`comment add should succeed, got ${commentResponse.status}`);
    return;
  }
  if (String(commentPayload?.comment?.author || '') !== 'MemberB') {
    fail(`comment author should resolve from the user profile, got ${commentPayload?.comment?.author || 'missing'}`);
  }
  if (!Array.isArray(commentPayload?.comments) || commentPayload.comments.length !== 1) {
    fail(`comment add should return one comment in the project list, got ${Array.isArray(commentPayload?.comments) ? commentPayload.comments.length : 'missing'}`);
  }

  const project = readProjects().find(item => item.id === 'interaction-project');
  if (!Array.isArray(project?.comments) || project.comments.length !== 1) {
    fail('comment add should persist the comment to cloud-projects');
  }
}

async function expectBookmarkLifecycle() {
  const addBookmark = await fetch(`${baseUrl}/projects/interaction-project/bookmarks/toggle`, {
    method: 'POST',
    headers: actorHeaders('actor-b')
  });
  const addBookmarkPayload = await addBookmark.json().catch(() => ({}));
  if (!addBookmark.ok) {
    fail(`bookmark add should succeed, got ${addBookmark.status}`);
    return;
  }
  if (addBookmarkPayload.bookmarked !== true || !addBookmarkPayload.bookmark?.id) {
    fail('bookmark add should return bookmarked=true and a bookmark row');
  }

  const myBookmarksAfterAdd = await fetch(`${baseUrl}/me/bookmarks`, {
    headers: actorHeaders('actor-b')
  });
  const myBookmarksAddPayload = await myBookmarksAfterAdd.json().catch(() => ({}));
  if (!myBookmarksAfterAdd.ok || !Array.isArray(myBookmarksAddPayload?.bookmarks) || myBookmarksAddPayload.bookmarks.length !== 1) {
    fail(`GET /me/bookmarks after add should return one bookmark, got ${myBookmarksAfterAdd.status}`);
  }

  const storedBookmarks = readBookmarks();
  if (storedBookmarks.length !== 1 || String(storedBookmarks[0]?.projectId || '') !== 'interaction-project') {
    fail('bookmark add should persist a bookmark row to project-bookmarks');
  }

  const removeBookmark = await fetch(`${baseUrl}/projects/interaction-project/bookmarks/toggle`, {
    method: 'POST',
    headers: actorHeaders('actor-b')
  });
  const removeBookmarkPayload = await removeBookmark.json().catch(() => ({}));
  if (!removeBookmark.ok) {
    fail(`bookmark remove should succeed, got ${removeBookmark.status}`);
    return;
  }
  if (removeBookmarkPayload.bookmarked !== false) {
    fail(`bookmark remove should return bookmarked=false, got ${removeBookmarkPayload.bookmarked}`);
  }

  const myBookmarksAfterRemove = await fetch(`${baseUrl}/me/bookmarks`, {
    headers: actorHeaders('actor-b')
  });
  const myBookmarksRemovePayload = await myBookmarksAfterRemove.json().catch(() => ({}));
  if (!myBookmarksAfterRemove.ok || !Array.isArray(myBookmarksRemovePayload?.bookmarks) || myBookmarksRemovePayload.bookmarks.length !== 0) {
    fail(`GET /me/bookmarks after remove should return zero bookmarks, got ${myBookmarksAfterRemove.status}`);
  }

  if (readBookmarks().length !== 0) {
    fail('bookmark remove should delete the bookmark row from project-bookmarks');
  }
}

function expectAuditEvents() {
  const eventTypes = readEvents().map(event => String(event?.event_type || ''));
  const required = [
    'project_like_added',
    'project_like_removed',
    'project_comment_added',
    'project_bookmark_added',
    'project_bookmark_removed'
  ];
  required.forEach((eventType) => {
    if (!eventTypes.includes(eventType)) {
      fail(`audit events should include ${eventType}`);
    }
  });
}

(async () => {
  const logs = { text: '' };
  const smokeDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wethus-project-interactions-smoke-'));
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
        PROJECT_INTERACTIONS_REQUIRE_SESSION: 'true',
        JWT_SECRET: TEST_JWT_SECRET
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    child.stdout.on('data', data => { logs.text += data.toString(); });
    child.stderr.on('data', data => { logs.text += data.toString(); });

    await waitForServer(child, logs);
    await expectLikeLifecycle();
    await expectCommentLifecycle();
    await expectBookmarkLifecycle();
    expectAuditEvents();
  } finally {
    await stopChild(child);
    fs.rmSync(smokeDataDir, { recursive: true, force: true });
  }

  if (errors.length) {
    console.error(errors.map(error => `- ${error}`).join('\n'));
    process.exit(1);
  }

  console.log('Project interactions smoke passed.');
})().catch(err => {
  console.error(err);
  process.exit(1);
});
