const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const bundleRoot = path.join(repoRoot, 'launch-readiness-bundles');
const timestamp = new Date().toISOString().replace(/[:]/g, '-').replace(/\..+/, 'Z');
const bundleDir = path.join(bundleRoot, timestamp);

const artifactFiles = [
  'commercialization-readiness-summary.txt',
  'commercialization-readiness-summary.json',
  'production-rollout-status.txt',
  'production-rollout-status.json',
  'launch-readiness-snapshot.md',
  'launch-readiness-snapshot.json'
];

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

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function main() {
  ensureDir(bundleDir);
  runNode(['scripts/generate-launch-readiness-artifacts.js']);
  runNode(['scripts/write-launch-readiness-step-summary.js'], {
    LAUNCH_READINESS_SUMMARY_FILE: path.join('launch-readiness-bundles', timestamp, 'launch-readiness-step-summary.md')
  });

  for (const file of artifactFiles) {
    const source = path.join(repoRoot, file);
    if (!fs.existsSync(source)) {
      throw new Error(`missing launch readiness artifact: ${file}`);
    }
    fs.copyFileSync(source, path.join(bundleDir, path.basename(file)));
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    bundleDir,
    files: [...artifactFiles, 'launch-readiness-step-summary.md']
  };
  fs.writeFileSync(path.join(bundleDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

  console.log(`Launch readiness bundle exported to ${bundleDir}`);
}

main();
