const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const tempSummaryPath = path.join(repoRoot, '.tmp-launch-readiness-step-summary.md');
const generatedArtifactPaths = [
  'commercialization-readiness-summary.txt',
  'commercialization-readiness-summary.json',
  'production-rollout-status.txt',
  'production-rollout-status.json',
  'launch-readiness-snapshot.md',
  'launch-readiness-snapshot.json'
].map((file) => path.join(repoRoot, file));

function runNode(args, extraEnv = {}) {
  const result = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    env: { ...process.env, ...extraEnv },
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false
  });
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || `${args.join(' ')} failed`).trim());
  }
  return String(result.stdout || '');
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, file), 'utf8').replace(/^\uFEFF/, ''));
}

function waitForFile(filePath, attempts = 5) {
  for (let i = 0; i < attempts; i += 1) {
    if (fs.existsSync(filePath)) return true;
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 25);
  }
  return fs.existsSync(filePath);
}

function missingArtifacts() {
  return generatedArtifactPaths.filter((file) => !waitForFile(file));
}

function ensureArtifactsExist() {
  let missing = missingArtifacts();
  if (!missing.length) return;

  runNode(['scripts/generate-launch-readiness-artifacts.js']);
  missing = missingArtifacts();
  if (missing.length) {
    throw new Error(`launch readiness artifacts were not created: ${missing.map((file) => path.basename(file)).join(', ')}`);
  }
}

function main() {
  try {
    runNode(['scripts/generate-launch-readiness-artifacts.js']);
    ensureArtifactsExist();

    const summaryText = fs.readFileSync(path.join(repoRoot, 'commercialization-readiness-summary.txt'), 'utf8');
    const rolloutText = fs.readFileSync(path.join(repoRoot, 'production-rollout-status.txt'), 'utf8');
    const snapshotText = fs.readFileSync(path.join(repoRoot, 'launch-readiness-snapshot.md'), 'utf8');
    const readinessJson = readJson('commercialization-readiness-summary.json');
    const rolloutJson = readJson('production-rollout-status.json');
    const snapshotJson = readJson('launch-readiness-snapshot.json');

    if (!summaryText.includes('Commercialization readiness summary')) {
      throw new Error('commercialization-readiness-summary.txt is missing the expected heading');
    }
    if (!rolloutText.includes('Production rollout status')) {
      throw new Error('production-rollout-status.txt is missing the expected heading');
    }
    if (!snapshotText.includes('# WETHUS Launch Snapshot')) {
      throw new Error('launch-readiness-snapshot.md is missing the expected heading');
    }
    if (readinessJson.productionLaunchReady !== true) {
      throw new Error('commercialization-readiness-summary.json should report productionLaunchReady=true in the current live state');
    }
    if ((rolloutJson.frontendDrift || []).some((row) => row.status !== 200 || row.driftCount !== 0)) {
      throw new Error('production-rollout-status.json should report clean frontend drift rows');
    }
    if (!snapshotJson || snapshotJson.launchVerdict !== 'ready') {
      throw new Error('launch-readiness-snapshot.json should report launchVerdict=ready in the current live state');
    }

    runNode(['scripts/write-launch-readiness-step-summary.js'], {
      GITHUB_STEP_SUMMARY: tempSummaryPath
    });
    const stepSummary = fs.readFileSync(tempSummaryPath, 'utf8');
    if (!stepSummary.includes('# WETHUS Launch Readiness')) {
      throw new Error('step summary is missing the expected heading');
    }
    if (!stepSummary.includes('## Current Blockers')) {
      throw new Error('step summary is missing the current blockers section');
    }

    console.log('Launch readiness artifact smoke passed.');
  } finally {
    try {
      fs.rmSync(tempSummaryPath, { force: true });
    } catch (_) {}
    for (const file of generatedArtifactPaths) {
      try {
        fs.rmSync(file, { force: true });
      } catch (_) {}
    }
  }
}

main();
