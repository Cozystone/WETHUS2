const { spawnSync } = require('child_process');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const STRICT = String(process.env.WETHUS_DEPLOY_SOURCE_STRICT || 'false').toLowerCase() === 'true';

const warnings = [];
const errors = [];
const IGNORE_PATTERNS = [
  /^\.tmp-backend-.*\.log$/,
  /^\.tmp-wethus-backend.*\.pid$/,
  /^WETHUS2\/backend\/\.tmp-wethus-backend.*\.pid$/,
  /^commercialization-readiness-summary\.(json|txt)$/,
  /^production-rollout-status\.(json|txt)$/,
  /^launch-readiness-step-summary\.md$/,
  /^launch-readiness-snapshot\.(md|json)$/
];

function runGit(args) {
  const result = spawnSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false
  });
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || `git ${args.join(' ')} failed`).trim());
  }
  return String(result.stdout || '').trim();
}

function warn(message) {
  warnings.push(message);
}

function fail(message) {
  errors.push(message);
}

function shouldIgnoreStatusFile(file) {
  const normalized = String(file || '').trim().replace(/\\/g, '/');
  return IGNORE_PATTERNS.some((pattern) => pattern.test(normalized));
}

try {
  const head = runGit(['rev-parse', 'HEAD']);
  const remoteMainLine = runGit(['ls-remote', 'origin', 'refs/heads/main']);
  const remoteMain = remoteMainLine.split(/\s+/)[0] || '';
  const rawStatus = runGit(['status', '--short']);
  const status = rawStatus
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((line) => !shouldIgnoreStatusFile(String(line).slice(2).trim()))
    .join('\n');

  console.log(`HEAD: ${head}`);
  console.log(`origin/main: ${remoteMain || '(missing)'}`);
  console.log(`worktree dirty: ${status ? 'yes' : 'no'}`);

  if (!remoteMain) {
    fail('origin/main could not be resolved.');
  } else if (head !== remoteMain) {
    const message = 'Local HEAD does not match origin/main, so production cannot reflect the current local commit yet.';
    if (STRICT) fail(message);
    else warn(message);
  }

  if (status) {
    const message = 'Local worktree has uncommitted changes, so production cannot reflect the current local working state yet.';
    if (STRICT) fail(message);
    else warn(message);
    console.log('\nDirty files:');
    console.log(status);
  }
} catch (error) {
  fail(error.message);
}

if (warnings.length) {
  console.warn(warnings.map((item) => `- WARNING: ${item}`).join('\n'));
}

if (errors.length) {
  console.error(errors.map((item) => `- ERROR: ${item}`).join('\n'));
  process.exit(1);
}

console.log('Deploy source readiness check passed.');
