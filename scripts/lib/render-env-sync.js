const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..', '..');
const renderYamlPath = path.join(repoRoot, 'render.yaml');
const backendSourcePaths = [
  'render.yaml',
  'WETHUS2/backend',
  'WETHUS2/config/launch-scope.json'
];

const securityFlags = [
  ['cloudStateRequireSession', 'CLOUD_STATE_REQUIRE_SESSION'],
  ['integrationsRequireActor', 'INTEGRATIONS_REQUIRE_ACTOR'],
  ['integrationsRequireSession', 'INTEGRATIONS_REQUIRE_SESSION'],
  ['integrationsEnforceLaunchScope', 'INTEGRATIONS_ENFORCE_LAUNCH_SCOPE'],
  ['projectInteractionsRequireSession', 'PROJECT_INTERACTIONS_REQUIRE_SESSION'],
  ['projectAccessRequireMembership', 'PROJECT_ACCESS_REQUIRE_MEMBERSHIP']
];

function readRenderYaml() {
  return fs.readFileSync(renderYamlPath, 'utf8');
}

function parseRenderEnvValue(key, text = readRenderYaml()) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = text.match(new RegExp(`-\\s+key:\\s+${escapedKey}[\\s\\S]*?value:\\s+"?(true|false)"?`, 'm'));
  return match ? String(match[1]).toLowerCase() === 'true' : null;
}

function desiredSecurityFlagsFromRender() {
  const text = readRenderYaml();
  return Object.fromEntries(
    securityFlags.map(([, envKey]) => [envKey, parseRenderEnvValue(envKey, text)])
  );
}

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

function backendSourceHead() {
  const commit = runGit(['log', '-n', '1', '--format=%H', 'HEAD', '--', ...backendSourcePaths]);
  return commit || runGit(['rev-parse', 'HEAD']);
}

function analyzeRenderEnvSync(runtimeSecurity = {}, buildCommit = '', sourceHead = '') {
  const desired = desiredSecurityFlagsFromRender();
  const mismatches = [];

  for (const [healthKey, envKey] of securityFlags) {
    const desiredValue = desired[envKey];
    const actualValue = runtimeSecurity?.[healthKey] === true;
    if (desiredValue === null) {
      mismatches.push({ envKey, healthKey, desired: null, actual: actualValue });
      continue;
    }
    if (desiredValue !== actualValue) {
      mismatches.push({ envKey, healthKey, desired: desiredValue, actual: actualValue });
    }
  }

  const normalizedBuildCommit = String(buildCommit || '').trim();
  const normalizedSourceHead = String(sourceHead || '').trim().slice(0, normalizedBuildCommit.length || undefined);
  const buildMatchesSource = !!normalizedBuildCommit && !!normalizedSourceHead && normalizedBuildCommit === normalizedSourceHead;
  const envSyncPending = buildMatchesSource && mismatches.some((item) => item.desired === true && item.actual === false);

  return {
    desired,
    mismatches,
    buildMatchesSource,
    envSyncPending
  };
}

module.exports = {
  backendSourcePaths,
  backendSourceHead,
  securityFlags,
  desiredSecurityFlagsFromRender,
  analyzeRenderEnvSync
};
