const { spawnSync } = require('child_process');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');

const groups = [
  {
    key: 'backend_security',
    title: 'Backend Security And Sessions',
    patterns: [
      /^WETHUS2\/backend\/server\.js$/,
      /^WETHUS2\/backend\/README\.md$/,
      /^WETHUS2\/backend\/\.env\.example$/,
      /^render\.yaml$/,
      /^WETHUS2\/config\//
    ],
    checks: [
      'node --check WETHUS2/backend/server.js',
      'node scripts/smoke-backend-security.js',
      'node scripts/smoke-founder-moderation.js',
      'node scripts/smoke-admin-review-queue.js',
      'node scripts/smoke-project-interactions.js',
      'node scripts/smoke-discovery-visibility.js',
      'node scripts/check-live-backend-contract-drift.js'
    ]
  },
  {
    key: 'frontend_interactions',
    title: 'Frontend Interactions And Hub',
    patterns: [
      /^WETHUS2\/app\.js$/,
      /^WETHUS2\/admin\.html$/,
      /^WETHUS2\/index\.html$/,
      /^WETHUS2\/login\.html$/,
      /^WETHUS2\/project-hub\.html$/,
      /^WETHUS2\/profile\.html$/,
      /^WETHUS2\/explore_theme\.html$/,
      /^WETHUS2\/script\.js$/,
      /^WETHUS2\/vercel\.json$/
    ],
    checks: [
      'node scripts/validate-static.js',
      'node scripts/check-live-frontend-drift.js'
    ]
  },
  {
    key: 'release_gates',
    title: 'Commercialization Gates And CI',
    patterns: [
      /^\.gitignore$/,
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
      /^scripts\/suggest-commercialization-commits\.js$/,
      /^scripts\/run-commercial-gate\.js$/,
      /^scripts\/smoke-admin-review-queue\.js$/,
      /^scripts\/smoke-discovery-visibility\.js$/,
      /^scripts\/smoke-project-interactions\.js$/,
      /^scripts\/smoke-production\.js$/,
      /^scripts\/smoke-backend-security\.js$/,
      /^scripts\/smoke-founder-moderation\.js$/,
      /^scripts\/smoke-project-applications\.js$/,
      /^scripts\/smoke-provider-launch-scope-env-override\.js$/,
      /^scripts\/smoke-provider-launch-scope\.js$/,
      /^scripts\/smoke-provider-launch-scope-enforcement\.js$/,
      /^scripts\/validate-static\.js$/,
      /^scripts\/lib\//,
      /^\.github\/workflows\/production-smoke\.yml$/,
      /^\.github\/workflows\/static-checks\.yml$/
    ],
    checks: [
      'node scripts/run-commercial-gate.js',
      'WETHUS_GATE_STRICT_PRODUCTION=true node scripts/run-commercial-gate.js'
    ]
  },
  {
    key: 'ops_docs',
    title: 'Ops Docs And Release Notes',
    patterns: [
      /^STATUS\.md$/,
      /^NEXT_STEPS\.md$/,
      /^WETHUS2\/docs\/ops\//,
      /^WETHUS2\/docs\/change-log\//
    ],
    checks: [
      'manual runbook review',
      'confirm docs match gate outputs'
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

function matchGroup(file) {
  return groups.find((group) => group.patterns.some((pattern) => pattern.test(file))) || null;
}

function printGroup(group, entries) {
  console.log(`\n## ${group.title}`);
  console.log(`count: ${entries.length}`);
  entries.forEach((entry) => console.log(`- [${entry.status}] ${entry.file}`));
  console.log('suggested checks:');
  group.checks.forEach((check) => console.log(`- ${check}`));
}

try {
  const statusOutput = runGit(['status', '--short']);
  const entries = statusOutput
    .split(/\r?\n/)
    .map(normalizeStatusLine)
    .filter(Boolean);

  if (!entries.length) {
    console.log('No local changes detected.');
    process.exit(0);
  }

  const grouped = new Map(groups.map((group) => [group.key, []]));
  const uncategorized = [];

  for (const entry of entries) {
    const group = matchGroup(entry.file);
    if (!group) {
      uncategorized.push(entry);
      continue;
    }
    grouped.get(group.key).push(entry);
  }

  console.log('Commercialization bundle manifest');
  console.log(`changed files: ${entries.length}`);

  for (const group of groups) {
    const rows = grouped.get(group.key) || [];
    if (!rows.length) continue;
    printGroup(group, rows);
  }

  if (uncategorized.length) {
    console.log('\n## Uncategorized');
    uncategorized.forEach((entry) => console.log(`- [${entry.status}] ${entry.file}`));
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
