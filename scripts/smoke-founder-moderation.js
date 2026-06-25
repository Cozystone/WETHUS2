const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const repoRoot = path.resolve(__dirname, '..');
const backendRoot = path.join(repoRoot, 'WETHUS2', 'backend');
const port = Number(process.env.WETHUS_FOUNDER_MODERATION_SMOKE_PORT || 8897);
const baseUrl = `http://127.0.0.1:${port}`;
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

function isIsoDate(value) {
  const date = new Date(String(value || ''));
  return !Number.isNaN(date.getTime()) && String(value || '').includes('T');
}

function expectFounderContract(payload, expectation = {}) {
  if (!payload || payload.ok !== true) {
    fail(`${expectation.label || 'response'} should return ok=true`);
    return;
  }
  if (payload.decision !== expectation.decision) {
    fail(`${expectation.label || 'response'} should return decision=${expectation.decision}, got ${payload.decision || 'missing'}`);
  }
  if (String(payload.reason || '').trim().length < 3) {
    fail(`${expectation.label || 'response'} should include a non-empty reason`);
  }
  if (payload.category !== expectation.category) {
    fail(`${expectation.label || 'response'} should return category=${expectation.category}, got ${payload.category || 'missing'}`);
  }
  if (payload.normalizedCategory !== expectation.normalizedCategory) {
    fail(`${expectation.label || 'response'} should return normalizedCategory=${expectation.normalizedCategory}, got ${payload.normalizedCategory || 'missing'}`);
  }
  if (!isIsoDate(payload.reviewedAt)) {
    fail(`${expectation.label || 'response'} should include an ISO reviewedAt timestamp`);
  }
}

async function postFounderReview(body) {
  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/ai/review-founder`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body)
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        fail(`review-founder should return 200 for ${body.title || 'submission'}, got ${response.status}`);
      }
      return payload;
    } catch (error) {
      lastError = error;
      if (attempt < 2) await sleep(200 * (attempt + 1));
    }
  }
  throw lastError || new Error(`review-founder request failed for ${body.title || 'submission'}`);
}

async function expectHardBlock() {
  const payload = await postFounderReview({
    title: 'Unsafe project',
    category: 'Policy',
    description: 'This submission tells people to kill rivals and spread terror tactics in public spaces.',
    motivation: 'Harmful intent',
    output: 'Violence plan',
    plan: 'Step by step violent escalation'
  });
  expectFounderContract(payload, {
    label: 'hard block case',
    decision: 'block',
    category: 'Policy',
    normalizedCategory: 'SocietyLaw'
  });
}

async function expectFallbackAllow() {
  const payload = await postFounderReview({
    title: 'Student research collaboration platform',
    category: 'Science',
    description: 'We are building a student research collaboration platform that helps high school teams document hypotheses, assign experiment roles, collect observation notes, and summarize evidence for fair-ready presentations. The goal is to reduce confusion during weekly meetings and make mentor feedback easier to act on.',
    motivation: 'Our club loses momentum because ideas, measurements, and next steps are scattered across messages and notebooks.',
    output: 'A working prototype with experiment logs, mentor comment summaries, and a repeatable research sprint template.',
    plan: 'Interview three science clubs, map the workflow, prototype the dashboard, and run two weekly pilot cycles with measurable improvement in meeting clarity.'
  });
  expectFounderContract(payload, {
    label: 'fallback allow case',
    decision: 'allow',
    category: 'Science',
    normalizedCategory: 'MathSci'
  });
}

async function expectFallbackReview() {
  const payload = await postFounderReview({
    title: 'Short film idea',
    category: 'Film',
    description: 'A student short film idea.',
    motivation: 'Test it.',
    output: 'Video',
    plan: 'Soon'
  });
  expectFounderContract(payload, {
    label: 'fallback review case',
    decision: 'review',
    category: 'Film',
    normalizedCategory: 'ArtCulture'
  });
}

(async () => {
  const logs = { text: '' };
  const smokeDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wethus-founder-moderation-smoke-'));
  let child;

  try {
    child = spawn(process.execPath, ['server.js'], {
      cwd: backendRoot,
      env: {
        ...process.env,
        PORT: String(port),
        WETHUS_DATA_DIR: smokeDataDir,
        RATE_LIMIT_DISABLED: 'true',
        AI_PROVIDER: 'ollama',
        OLLAMA_BASE_URL: 'http://127.0.0.1:9',
        OLLAMA_MODEL: 'missing-model'
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    child.stdout.on('data', data => { logs.text += data.toString(); });
    child.stderr.on('data', data => { logs.text += data.toString(); });

    await waitForServer(child, logs);
    await expectHardBlock();
    await expectFallbackAllow();
    await expectFallbackReview();
  } finally {
    await stopChild(child);
    fs.rmSync(smokeDataDir, { recursive: true, force: true });
  }

  if (errors.length) {
    console.error(errors.map(error => `- ${error}`).join('\n'));
    process.exit(1);
  }

  console.log('Founder moderation smoke passed.');
})().catch(err => {
  console.error(err);
  process.exit(1);
});
