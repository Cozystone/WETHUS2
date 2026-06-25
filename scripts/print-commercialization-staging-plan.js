const { spawnSync } = require('child_process');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');

const commitGroups = [
  {
    key: 'core_hardening',
    title: 'Commit 1. Core Backend + Frontend Hardening',
    description: 'Stage the runtime behavior changes that should deploy together.',
    patterns: [
      /^WETHUS2\/app\.js$/,
      /^WETHUS2\/admin\.html$/,
      /^WETHUS2\/index\.html$/,
      /^WETHUS2\/login\.html$/,
      /^WETHUS2\/backend\/\.env\.example$/,
      /^WETHUS2\/backend\/README\.md$/,
      /^WETHUS2\/backend\/server\.js$/,
      /^WETHUS2\/config\//,
      /^WETHUS2\/explore_theme\.html$/,
      /^WETHUS2\/profile\.html$/,
      /^WETHUS2\/project-hub\.html$/,
      /^WETHUS2\/script\.js$/,
      /^WETHUS2\/vercel\.json$/,
      /^render\.yaml$/
    ],
    checks: [
      'node --check WETHUS2/backend/server.js',
      'node scripts/validate-static.js',
      'node scripts/smoke-backend-security.js',
      'node scripts/smoke-founder-moderation.js',
      'node scripts/smoke-admin-review-queue.js',
      'node scripts/smoke-project-interactions.js',
      'node scripts/smoke-discovery-visibility.js'
    ]
  },
  {
    key: 'gates_and_ci',
    title: 'Commit 2. Commercialization Gates + CI',
    description: 'Stage gate scripts and workflow enforcement after the runtime changes are ready.',
    patterns: [
      /^\.gitignore$/,
      /^\.github\/workflows\/production-smoke\.yml$/,
      /^\.github\/workflows\/static-checks\.yml$/,
      /^scripts\/audit-commercial-readiness\.js$/,
      /^scripts\/check-deploy-config-parity\.js$/,
      /^scripts\/check-deploy-source-readiness\.js$/,
      /^scripts\/check-live-frontend-drift\.js$/,
      /^scripts\/check-live-backend-contract-drift\.js$/,
      /^scripts\/describe-commercialization-bundle\.js$/,
      /^scripts\/plan-commercialization-release\.js$/,
      /^scripts\/print-commercialization-staging-plan\.js$/,
      /^scripts\/print-commercialization-readiness-summary\.js$/,
      /^scripts\/print-post-deploy-verification\.js$/,
      /^scripts\/print-production-rollout-status\.js$/,
      /^scripts\/run-commercial-gate\.js$/,
      /^scripts\/smoke-admin-review-queue\.js$/,
      /^scripts\/smoke-discovery-visibility\.js$/,
      /^scripts\/smoke-project-interactions\.js$/,
      /^scripts\/smoke-backend-security\.js$/,
      /^scripts\/smoke-founder-moderation\.js$/,
      /^scripts\/smoke-production\.js$/,
      /^scripts\/smoke-project-applications\.js$/,
      /^scripts\/smoke-provider-launch-scope-env-override\.js$/,
      /^scripts\/smoke-provider-launch-scope\.js$/,
      /^scripts\/smoke-provider-launch-scope-enforcement\.js$/,
      /^scripts\/suggest-commercialization-commits\.js$/,
      /^scripts\/validate-static\.js$/,
      /^scripts\/lib\//
    ],
    checks: [
      'node scripts/run-commercial-gate.js',
      'node scripts/check-live-backend-contract-drift.js',
      'WETHUS_GATE_STRICT_PRODUCTION=true node scripts/run-commercial-gate.js'
    ]
  },
  {
    key: 'ops_docs',
    title: 'Commit 3. Ops Docs + Change Logs',
    description: 'Stage the runbooks and change logs once code and gates are settled.',
    patterns: [
      /^NEXT_STEPS\.md$/,
      /^STATUS\.md$/,
      /^WETHUS2\/docs\/change-log\//,
      /^WETHUS2\/docs\/ops\//
    ],
    checks: [
      'manual docs review',
      'confirm docs reflect current gate output'
    ]
  }
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

function normalizeStatusLine(line) {
  const trimmed = String(line || '').trim();
  if (!trimmed) return null;
  const status = trimmed.slice(0, 2).trim() || '??';
  const file = trimmed.slice(2).trim().replace(/\\/g, '/');
  return { status, file };
}

function quotePath(file) {
  return `"${file}"`;
}

function printGroup(group, rows) {
  const files = rows.map((row) => row.file);
  console.log(`\n## ${group.title}`);
  console.log(`summary: ${group.description}`);
  console.log('stage command:');
  console.log(`git add ${files.map(quotePath).join(' ')}`);
  console.log('files:');
  rows.forEach((row) => console.log(`- [${row.status}] ${row.file}`));
  console.log('recommended checks before commit:');
  group.checks.forEach((check) => console.log(`- ${check}`));
}

try {
  const statusOutput = runGit(['status', '--short']);
  const rows = statusOutput
    .split(/\r?\n/)
    .map(normalizeStatusLine)
    .filter(Boolean);

  if (!rows.length) {
    console.log('No local changes detected.');
    process.exit(0);
  }

  const grouped = new Map(commitGroups.map((group) => [group.key, []]));
  const leftovers = [];

  for (const row of rows) {
    const group = commitGroups.find((candidate) =>
      candidate.patterns.some((pattern) => pattern.test(row.file))
    );
    if (!group) {
      leftovers.push(row);
      continue;
    }
    grouped.get(group.key).push(row);
  }

  console.log('Commercialization staging plan');
  console.log(`total changed files: ${rows.length}`);

  for (const group of commitGroups) {
    const files = grouped.get(group.key) || [];
    if (!files.length) continue;
    printGroup(group, files);
  }

  if (leftovers.length) {
    console.log('\n## Leftovers');
    leftovers.forEach((row) => console.log(`- [${row.status}] ${row.file}`));
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
