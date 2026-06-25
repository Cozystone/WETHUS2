const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const readinessPath = path.join(repoRoot, 'commercialization-readiness-summary.json');
const rolloutPath = path.join(repoRoot, 'production-rollout-status.json');
const summaryFile = process.env.GITHUB_STEP_SUMMARY || '';
const summaryArtifactFile = process.env.LAUNCH_READINESS_SUMMARY_FILE
  ? path.resolve(repoRoot, process.env.LAUNCH_READINESS_SUMMARY_FILE)
  : '';

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
}

function fmtBool(value, yes = 'yes', no = 'no') {
  return value ? yes : no;
}

function pushSection(lines, title) {
  lines.push(`## ${title}`);
  lines.push('');
}

function pushBullet(lines, text) {
  lines.push(`- ${text}`);
}

function renderBlockers(lines, blockers) {
  const items = [
    ...(Array.isArray(blockers?.source) ? blockers.source : []),
    ...(Array.isArray(blockers?.disabledFlags) ? blockers.disabledFlags.map((item) => `production flag disabled: ${item}`) : []),
    ...(Array.isArray(blockers?.renderEnvSync) ? blockers.renderEnvSync.map((item) => `render env mismatch: ${item.envKey}`) : []),
    ...(Array.isArray(blockers?.providers) ? blockers.providers.map((item) => `provider not ready: ${item.provider} (${item.status})`) : []),
    ...(Array.isArray(blockers?.frontend) ? blockers.frontend.map((item) => `frontend drift: ${item.file}`) : []),
    ...(Array.isArray(blockers?.backendContract) ? blockers.backendContract.map((item) => `backend contract drift: ${item.surface}`) : [])
  ];

  if (!items.length) {
    pushBullet(lines, 'none');
    return;
  }
  items.forEach((item) => pushBullet(lines, item));
}

function renderNextActions(lines, actions) {
  if (!Array.isArray(actions) || !actions.length) {
    pushBullet(lines, 'none');
    return;
  }
  actions.forEach((action) => pushBullet(lines, action));
}

function main() {
  if (!summaryFile && !summaryArtifactFile) {
    console.error('GITHUB_STEP_SUMMARY or LAUNCH_READINESS_SUMMARY_FILE must be set');
    process.exit(1);
  }
  if (!fs.existsSync(readinessPath)) {
    console.error(`Missing readiness summary JSON: ${readinessPath}`);
    process.exit(1);
  }
  if (!fs.existsSync(rolloutPath)) {
    console.error(`Missing production rollout status JSON: ${rolloutPath}`);
    process.exit(1);
  }

  const readiness = readJson(readinessPath);
  const rollout = readJson(rolloutPath);
  const lines = [];

  lines.push('# WETHUS Launch Readiness');
  lines.push('');
  pushBullet(lines, `generated at: ${readiness.generatedAt || rollout.generatedAt || '-'}`);
  pushBullet(lines, `local release candidate: ${fmtBool(readiness.localReleaseCandidateReady, 'ready', 'not ready')}`);
  pushBullet(lines, `production launch state: ${fmtBool(readiness.productionLaunchReady, 'ready', 'blocked')}`);
  pushBullet(lines, `backend build: ${(rollout.backendBuild?.ref || readiness.runtime?.buildRef || '-')} ${(rollout.backendBuild?.commit || readiness.runtime?.buildCommit || '-')}`);
  lines.push('');

  pushSection(lines, 'Security Flags');
  for (const [envKey, enabled] of Object.entries(rollout.securityFlags || {})) {
    pushBullet(lines, `${envKey}: ${enabled === true ? 'true' : 'false'}`);
  }
  lines.push('');

  pushSection(lines, 'Provider Scope');
  for (const [provider, status] of Object.entries(rollout.providerStatuses?.launch || {})) {
    pushBullet(lines, `launch: ${provider} = ${status}`);
  }
  for (const [provider, status] of Object.entries(rollout.providerStatuses?.deferred || {})) {
    pushBullet(lines, `deferred: ${provider} = ${status}`);
  }
  lines.push('');

  pushSection(lines, 'Frontend Drift');
  for (const row of rollout.frontendDrift || []) {
    pushBullet(lines, `${row.file}: ${row.status === 200 && row.driftCount === 0 ? 'clean' : `${row.driftCount} drift / http ${row.status}`}`);
  }
  lines.push('');

  pushSection(lines, 'Backend Drift');
  for (const row of rollout.backendContractDrift || []) {
    pushBullet(lines, `${row.surface}: ${row.status === 200 && (!row.drift || row.drift.length === 0) ? 'clean' : `${(row.drift || []).length} drift / http ${row.status}`}`);
  }
  lines.push('');

  pushSection(lines, 'Current Blockers');
  renderBlockers(lines, readiness.blockers || {});
  lines.push('');

  pushSection(lines, 'Next Actions');
  renderNextActions(lines, readiness.nextActions || []);
  lines.push('');

  const output = `${lines.join('\n')}\n`;
  if (summaryFile) {
    fs.writeFileSync(summaryFile, output, 'utf8');
    console.log(`Wrote launch readiness step summary to ${summaryFile}`);
  }
  if (summaryArtifactFile) {
    fs.writeFileSync(summaryArtifactFile, output, 'utf8');
    console.log(`Wrote launch readiness summary artifact to ${summaryArtifactFile}`);
  }
}

main();
