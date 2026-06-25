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
      /^WETHUS2\/config\//,
      /^render\.yaml$/
    ]
  },
  {
    key: 'frontend_interactions',
    title: 'Frontend Interactions And Hub',
    patterns: [
      /^WETHUS2\/admin\.html$/,
      /^WETHUS2\/app\.js$/,
      /^WETHUS2\/index\.html$/,
      /^WETHUS2\/login\.html$/,
      /^WETHUS2\/project-hub\.html$/,
      /^WETHUS2\/profile\.html$/,
      /^WETHUS2\/explore_theme\.html$/,
      /^WETHUS2\/script\.js$/,
      /^WETHUS2\/vercel\.json$/
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
      /^scripts\/lib\//,
      /^scripts\/plan-commercialization-release\.js$/,
      /^scripts\/print-commercialization-readiness-summary\.js$/,
      /^scripts\/print-commercialization-staging-plan\.js$/,
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
      /^scripts\/smoke-provider-launch-scope-enforcement\.js$/,
      /^scripts\/smoke-provider-launch-scope-env-override\.js$/,
      /^scripts\/smoke-provider-launch-scope\.js$/,
      /^scripts\/validate-static\.js$/,
      /^\.github\/workflows\/production-smoke\.yml$/,
      /^\.github\/workflows\/static-checks\.yml$/
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

function printPhase(title, bodyLines) {
  console.log(`\n## ${title}`);
  bodyLines.forEach((line) => console.log(`- ${line}`));
}

try {
  const statusOutput = runGit(['status', '--short']);
  const entries = statusOutput
    .split(/\r?\n/)
    .map(normalizeStatusLine)
    .filter(Boolean);

  const grouped = new Map(groups.map((group) => [group.key, []]));
  const uncategorized = [];
  for (const entry of entries) {
    const group = matchGroup(entry.file);
    if (!group) {
      uncategorized.push(entry.file);
      continue;
    }
    grouped.get(group.key).push(entry.file);
  }

  console.log('Commercialization release plan');
  console.log(`total changed files: ${entries.length}`);

  printPhase('Phase 0. Commit Candidate Scope', [
    `backend files: ${(grouped.get('backend_security') || []).length}`,
    `frontend files: ${(grouped.get('frontend_interactions') || []).length}`,
    `gate/ci files: ${(grouped.get('release_gates') || []).length}`,
    `docs files: ${(grouped.get('ops_docs') || []).length}`,
    uncategorized.length ? `uncategorized files: ${uncategorized.length}` : 'uncategorized files: 0'
  ]);

  printPhase('Phase 1. Local Release Candidate Validation', [
    'node scripts/check-deploy-source-readiness.js',
    'node scripts/describe-commercialization-bundle.js',
    'node scripts/suggest-commercialization-commits.js',
    'node scripts/print-commercialization-staging-plan.js',
    'node scripts/print-commercialization-readiness-summary.js',
    'node scripts/print-production-rollout-status.js',
    'node scripts/validate-static.js',
    'node scripts/smoke-backend-security.js',
    'node scripts/smoke-founder-moderation.js',
    'node scripts/smoke-admin-review-queue.js',
    'node scripts/smoke-project-interactions.js',
    'node scripts/smoke-discovery-visibility.js',
    'node scripts/smoke-project-applications.js',
    'node scripts/smoke-provider-launch-scope.js',
    'node scripts/smoke-provider-launch-scope-env-override.js',
    'node scripts/smoke-provider-launch-scope-enforcement.js',
    'node scripts/check-live-backend-contract-drift.js',
    'node scripts/run-commercial-gate.js'
  ]);

  printPhase('Phase 2. Code Deploy', [
    'Commit the current commercialization hardening bundle.',
    'Push the commit to origin/main.',
    'Redeploy Vercel frontend for wethus-2 if auto-deploy does not pick it up.',
    'Redeploy Render backend for wethus-api from the same pushed source state.'
  ]);

  printPhase('Phase 3. Live Drift Verification', [
    'node scripts/check-live-frontend-drift.js',
    'node scripts/check-live-backend-contract-drift.js',
    'node scripts/smoke-production.js',
    'node scripts/audit-commercial-readiness.js',
    'node scripts/print-production-rollout-status.js',
    'node scripts/print-post-deploy-verification.js',
    'Confirm project-hub/profile/explore_theme all expose the shared frontend contract marker.'
  ]);

  printPhase('Phase 4. Production Security Rollout', [
    'Enable CLOUD_STATE_REQUIRE_SESSION=true',
    'Enable INTEGRATIONS_REQUIRE_ACTOR=true',
    'Enable INTEGRATIONS_REQUIRE_SESSION=true',
    'Enable INTEGRATIONS_ENFORCE_LAUNCH_SCOPE=true',
    'Enable PROJECT_INTERACTIONS_REQUIRE_SESSION=true',
    'Enable PROJECT_ACCESS_REQUIRE_MEMBERSHIP=true',
    'Then rerun WETHUS_GATE_STRICT_PRODUCTION=true node scripts/run-commercial-gate.js'
  ]);

  if (entries.length) {
    printPhase('Current Blocking Reality', [
      'The local worktree is still dirty, so the current local state is not yet directly deployable.',
      'Production Vercel/Render cannot reflect these local changes until they are committed and pushed.',
      'After deploy, production security flags still need explicit rollout.'
    ]);
  }

  if (uncategorized.length) {
    printPhase('Uncategorized Files', uncategorized);
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
