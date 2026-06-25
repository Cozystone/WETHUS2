const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');

const outputs = [
  {
    command: ['scripts/print-commercialization-readiness-summary.js'],
    file: 'commercialization-readiness-summary.txt'
  },
  {
    command: ['scripts/print-commercialization-readiness-summary.js', '--json'],
    file: 'commercialization-readiness-summary.json'
  },
  {
    command: ['scripts/print-production-rollout-status.js'],
    file: 'production-rollout-status.txt'
  },
  {
    command: ['scripts/print-production-rollout-status.js', '--json'],
    file: 'production-rollout-status.json'
  },
  {
    command: ['scripts/print-launch-readiness-snapshot.js'],
    file: 'launch-readiness-snapshot.md'
  },
  {
    command: ['scripts/print-launch-readiness-snapshot.js', '--json'],
    file: 'launch-readiness-snapshot.json'
  }
];

function runNode(args) {
  const result = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false
  });
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || `${args.join(' ')} failed`).trim());
  }
  return String(result.stdout || '');
}

function main() {
  for (const output of outputs) {
    const text = runNode(output.command);
    fs.writeFileSync(path.join(repoRoot, output.file), text, 'utf8');
    console.log(`Wrote ${output.file}`);
  }
}

main();
