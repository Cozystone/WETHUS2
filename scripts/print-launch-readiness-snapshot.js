const { spawnSync } = require('child_process');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const JSON_MODE = process.argv.includes('--json');

function runNodeScript(script) {
  const result = spawnSync(process.execPath, [script, '--json'], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false
  });
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || `${script} failed`).trim());
  }
  return JSON.parse(String(result.stdout || '').replace(/^\uFEFF/, '').trim());
}

function push(lines, text = '') {
  lines.push(text);
}

function pushBullet(lines, text) {
  lines.push(`- ${text}`);
}

function renderBlockers(readiness) {
  const blockers = [];
  const source = readiness?.blockers?.source || [];
  const disabledFlags = readiness?.blockers?.disabledFlags || [];
  const renderEnv = readiness?.blockers?.renderEnvSync || [];
  const providers = readiness?.blockers?.providers || [];
  const frontend = readiness?.blockers?.frontend || [];
  const backend = readiness?.blockers?.backendContract || [];

  blockers.push(...source);
  blockers.push(...disabledFlags.map((item) => `production flag disabled: ${item}`));
  blockers.push(...renderEnv.map((item) => `render env mismatch: ${item.envKey}`));
  blockers.push(...providers.map((item) => `provider not ready: ${item.provider} (${item.status})`));
  blockers.push(...frontend.map((item) => `frontend drift: ${item.file}`));
  blockers.push(...backend.map((item) => `backend contract drift: ${item.surface}`));

  return blockers;
}

function main() {
  const readiness = runNodeScript('scripts/print-commercialization-readiness-summary.js');
  const rollout = runNodeScript('scripts/print-production-rollout-status.js');
  const blockers = renderBlockers(readiness);

  const snapshot = {
    generatedAt: new Date().toISOString(),
    commercializationReadiness: readiness,
    productionRollout: rollout,
    launchVerdict: readiness.productionLaunchReady ? 'ready' : 'blocked',
    releaseCandidateVerdict: readiness.localReleaseCandidateReady ? 'ready' : 'not_ready',
    blockers,
    nextActions: readiness.nextActions || []
  };

  if (JSON_MODE) {
    console.log(JSON.stringify(snapshot, null, 2));
    return;
  }

  const lines = [];
  push(lines, '# WETHUS Launch Snapshot');
  push(lines);
  pushBullet(lines, `generated at: ${snapshot.generatedAt}`);
  pushBullet(lines, `release candidate: ${snapshot.releaseCandidateVerdict}`);
  pushBullet(lines, `production verdict: ${snapshot.launchVerdict}`);
  pushBullet(lines, `backend build: ${rollout.backendBuild?.ref || '-'} ${rollout.backendBuild?.commit || '-'}`);
  push(lines);

  push(lines, '## Core State');
  push(lines);
  pushBullet(lines, `frontend drift clean: ${rollout.frontendDrift.every((row) => row.status === 200 && row.driftCount === 0) ? 'yes' : 'no'}`);
  pushBullet(lines, `backend contract clean: ${rollout.backendContractDrift.every((row) => row.status === 200 && (!row.drift || row.drift.length === 0)) ? 'yes' : 'no'}`);
  pushBullet(lines, `render env sync clean: ${!(rollout.renderEnvSync?.mismatches || []).length ? 'yes' : 'no'}`);
  push(lines);

  push(lines, '## Launch Providers');
  push(lines);
  for (const [provider, status] of Object.entries(rollout.providerStatuses?.launch || {})) {
    pushBullet(lines, `${provider}: ${status}`);
  }
  push(lines);

  push(lines, '## Deferred Providers');
  push(lines);
  for (const [provider, status] of Object.entries(rollout.providerStatuses?.deferred || {})) {
    pushBullet(lines, `${provider}: ${status}`);
  }
  push(lines);

  push(lines, '## Current Blockers');
  push(lines);
  if (!blockers.length) {
    pushBullet(lines, 'none');
  } else {
    blockers.forEach((item) => pushBullet(lines, item));
  }
  push(lines);

  push(lines, '## Next Actions');
  push(lines);
  if (!snapshot.nextActions.length) {
    pushBullet(lines, 'none');
  } else {
    snapshot.nextActions.forEach((item) => pushBullet(lines, item));
  }

  console.log(lines.join('\n'));
}

main();
