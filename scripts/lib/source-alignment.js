const { spawnSync } = require('child_process');

function sleepMs(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, Math.max(0, Number(ms || 0)));
}

function runGit(repoRoot, args) {
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

function resolveRemoteMain(repoRoot, options = {}) {
  const head = String(options.head || runGit(repoRoot, ['rev-parse', 'HEAD'])).trim();
  const attempts = Math.max(1, Number(options.attempts || 5));
  const retryDelayMs = Math.max(0, Number(options.retryDelayMs || 400));
  let remoteMain = '';

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const remoteMainLine = runGit(repoRoot, ['ls-remote', 'origin', 'refs/heads/main']);
    remoteMain = remoteMainLine.split(/\s+/)[0] || '';
    if (!remoteMain || remoteMain === head || attempt === attempts - 1) break;
    sleepMs(retryDelayMs);
  }

  return {
    head,
    remoteMain,
    aligned: !!remoteMain && head === remoteMain
  };
}

module.exports = {
  runGit,
  resolveRemoteMain
};
