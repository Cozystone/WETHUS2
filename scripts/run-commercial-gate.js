const { spawnSync } = require('child_process');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const env = { ...process.env };
const strictProduction = String(process.env.WETHUS_GATE_STRICT_PRODUCTION || 'false').toLowerCase() === 'true';

const steps = [
  {
    label: 'Deploy source readiness',
    command: process.execPath,
    args: ['scripts/check-deploy-source-readiness.js'],
    env: strictProduction
      ? {
          ...env,
          WETHUS_DEPLOY_SOURCE_STRICT: 'true'
        }
      : env
  },
  {
    label: 'Static validation',
    command: process.execPath,
    args: ['scripts/validate-static.js']
  },
  {
    label: 'Deploy config parity',
    command: process.execPath,
    args: ['scripts/check-deploy-config-parity.js']
  },
  {
    label: 'Backend security smoke',
    command: process.execPath,
    args: ['scripts/smoke-backend-security.js']
  },
  {
    label: 'Founder moderation smoke',
    command: process.execPath,
    args: ['scripts/smoke-founder-moderation.js']
  },
  {
    label: 'Admin review queue smoke',
    command: process.execPath,
    args: ['scripts/smoke-admin-review-queue.js']
  },
  {
    label: 'Project interactions smoke',
    command: process.execPath,
    args: ['scripts/smoke-project-interactions.js']
  },
  {
    label: 'Integration activity log smoke',
    command: process.execPath,
    args: ['scripts/smoke-integration-activity-log.js']
  },
  {
    label: 'Discovery visibility smoke',
    command: process.execPath,
    args: ['scripts/smoke-discovery-visibility.js']
  },
  {
    label: 'Project application smoke',
    command: process.execPath,
    args: ['scripts/smoke-project-applications.js']
  },
  {
    label: 'Provider launch-scope smoke',
    command: process.execPath,
    args: ['scripts/smoke-provider-launch-scope.js']
  },
  {
    label: 'Provider launch-scope env override smoke',
    command: process.execPath,
    args: ['scripts/smoke-provider-launch-scope-env-override.js']
  },
  {
    label: 'Provider launch-scope enforcement smoke',
    command: process.execPath,
    args: ['scripts/smoke-provider-launch-scope-enforcement.js']
  },
  {
    label: 'Live backend contract drift',
    command: process.execPath,
    args: ['scripts/check-live-backend-contract-drift.js'],
    optional: !strictProduction
  },
  {
    label: 'Render env sync drift',
    command: process.execPath,
    args: ['scripts/check-render-env-sync.js'],
    optional: !strictProduction
  },
  {
    label: 'Live frontend drift',
    command: process.execPath,
    args: ['scripts/check-live-frontend-drift.js'],
    optional: !strictProduction
  },
  {
    label: 'Commercial readiness audit',
    command: process.execPath,
    args: ['scripts/audit-commercial-readiness.js'],
    optional: !strictProduction,
    env: strictProduction
      ? {
          ...env,
          REQUIRE_WETHUS_FRONTEND_HUB_CONTRACTS: 'true',
          REQUIRE_WETHUS_BACKEND_CONTRACTS: 'true',
          REQUIRE_WETHUS_PROVIDER_READINESS: env.REQUIRE_WETHUS_PROVIDER_READINESS || 'false'
        }
      : env
  }
];

if (strictProduction) {
  steps.push({
    label: 'Strict production smoke',
    command: process.execPath,
    args: ['scripts/smoke-production.js'],
    env: {
      ...env,
      REQUIRE_WETHUS_API_SECURITY_HEADERS: 'true',
      REQUIRE_WETHUS_API_HEALTH_METADATA: 'true',
      REQUIRE_WETHUS_API_SECURITY_FLAGS: 'true',
      REQUIRE_WETHUS_PROVIDER_READINESS: env.REQUIRE_WETHUS_PROVIDER_READINESS || 'false',
      REQUIRE_WETHUS_BACKEND_CONTRACTS: 'true',
      REQUIRE_WETHUS_FRONTEND_HUB_CONTRACTS: 'true'
    }
  });
}

function runStep(step) {
  console.log(`\n== ${step.label} ==`);
  const result = spawnSync(step.command, step.args, {
    cwd: repoRoot,
    env: step.env || env,
    stdio: 'inherit',
    shell: false
  });
  const code = Number(result.status ?? 1);
  if (code !== 0 && !step.optional) {
    process.exit(code || 1);
  }
  if (code !== 0 && step.optional) {
    console.warn(`Optional step failed: ${step.label}`);
  }
}

for (const step of steps) {
  runStep(step);
}

console.log('\nCommercial gate run completed.');
