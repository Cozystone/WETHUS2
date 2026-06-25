const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { getLaunchScope } = require('./lib/launch-scope');
const { analyzeRenderEnvSync, backendSourceHead } = require('./lib/render-env-sync');

const repoRoot = path.resolve(__dirname, '..');
const appRoot = path.join(repoRoot, 'WETHUS2');
const BASE_URL = (process.env.WETHUS_BASE_URL || 'https://www.wethus.co.kr').replace(/\/$/, '');
const API_BASE_URL = (process.env.WETHUS_API_BASE_URL || 'https://wethus-api.onrender.com').replace(/\/$/, '');
const LAUNCH_SCOPE = getLaunchScope();

const securityFlags = [
  ['cloudStateRequireSession', 'CLOUD_STATE_REQUIRE_SESSION'],
  ['integrationsRequireActor', 'INTEGRATIONS_REQUIRE_ACTOR'],
  ['integrationsRequireSession', 'INTEGRATIONS_REQUIRE_SESSION'],
  ['integrationsEnforceLaunchScope', 'INTEGRATIONS_ENFORCE_LAUNCH_SCOPE'],
  ['projectInteractionsRequireSession', 'PROJECT_INTERACTIONS_REQUIRE_SESSION'],
  ['projectAccessRequireMembership', 'PROJECT_ACCESS_REQUIRE_MEMBERSHIP']
];

const frontendChecks = [
  {
    file: 'index.html',
    urlPath: '/',
    snippets: [
      'meta name="wethus-frontend-contract" content="2026-06-26-commercial-interactions-v1"',
      'class="hero-banner"',
      'id="homeFeatured"',
      'WETHUS MANIFESTO'
    ]
  },
  {
    file: 'project-hub.html',
    snippets: [
      'meta name="wethus-frontend-contract" content="2026-06-26-commercial-interactions-v1"',
      'renderHub = async function renderHubStable()',
      'loadRemoteActivityEventsForCurrentProject()',
      'loadRemoteStatusSnapshotForCurrentProject()',
      'mergedProjectTimeline(80)',
      'id="hubWebhookModal"',
      'function sendWebhookTestEvent()',
      'data-tool-webhook'
    ]
  },
  {
    file: 'profile.html',
    snippets: [
      'meta name="wethus-frontend-contract" content="2026-06-26-commercial-interactions-v1"',
      'WETHUS.myBookmarkedProjects()',
      'WETHUS.myLikedProjects()',
      'data-open-project'
    ]
  },
  {
    file: 'explore_theme.html',
    snippets: [
      'meta name="wethus-frontend-contract" content="2026-06-26-commercial-interactions-v1"',
      'WETHUS.isBookmarked(',
      'class="bookmark-btn',
      'data-bm="'
    ]
  },
  {
    file: 'login.html',
    snippets: [
      'meta name="wethus-frontend-contract" content="2026-06-26-commercial-interactions-v1"',
      'function redirectAfterAuth(user, options = {})',
      'onboardingReturnTo'
    ]
  },
  {
    file: 'founder.html',
    snippets: [
      'meta name="wethus-frontend-contract" content="2026-06-26-commercial-interactions-v1"',
      'const fieldLabels = {',
      'const focusField = (el) => {'
    ]
  },
  {
    file: 'admin.html',
    snippets: [
      'meta name="wethus-frontend-contract" content="2026-06-26-commercial-interactions-v1"',
      'class="js-review-note"',
      'id="opsActionStatus"',
      'const setCardBusy = (card, busy, message) => {'
    ]
  }
];
const JSON_MODE = process.argv.includes('--json');

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

async function fetchJson(url) {
  const res = await fetch(url, { redirect: 'follow' });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (_) {
    json = null;
  }
  return { res, json, text };
}

async function fetchText(url) {
  const res = await fetch(url, { redirect: 'follow' });
  const text = await res.text();
  return { res, text };
}

async function localSourceStatus() {
  const head = runGit(['rev-parse', 'HEAD']);
  const backendHead = backendSourceHead();
  const remoteMainLine = runGit(['ls-remote', 'origin', 'refs/heads/main']);
  const remoteMain = remoteMainLine.split(/\s+/)[0] || '';
  const status = runGit(['status', '--short']);
  return {
    head,
    backendHead,
    remoteMain,
    aligned: !!remoteMain && head === remoteMain,
    dirty: !!status,
    dirtyCount: status ? status.split(/\r?\n/).filter(Boolean).length : 0
  };
}

async function productionRuntimeStatus() {
  const { res: healthRes, json: health } = await fetchJson(`${API_BASE_URL}/health`);
  if (!healthRes.ok || !health?.ok) {
    throw new Error(`unable to read ${API_BASE_URL}/health`);
  }
  const { res: providerRes, json: providerJson } = await fetchJson(`${API_BASE_URL}/integrations/providers`);
  const providers = providerRes.ok && providerJson?.ok && Array.isArray(providerJson.providers) ? providerJson.providers : [];
  const providerMap = Object.fromEntries(providers.map((provider) => [String(provider?.key || ''), provider]));
  return {
    buildRef: health?.build?.ref || '-',
    buildCommit: health?.build?.commit || '-',
    security: health?.security || {},
    providerMap
  };
}

async function frontendDriftStatus() {
  const rows = [];
  for (const check of frontendChecks) {
    const localText = fs.readFileSync(path.join(appRoot, check.file), 'utf8');
    const url = check.urlPath ? `${BASE_URL}${check.urlPath}` : `${BASE_URL}/${check.file}`;
    const { res, text: liveText } = await fetchText(url);
    const snippetDrift = check.snippets.filter((snippet) => localText.includes(snippet) !== liveText.includes(snippet));
    rows.push({
      file: check.file,
      ok: res.status === 200 && snippetDrift.length === 0,
      status: res.status,
      snippetDrift
    });
  }
  return rows;
}

async function backendContractDriftStatus() {
  const rows = [];
  const { res: healthRes, json: health } = await fetchJson(`${API_BASE_URL}/health`);
  rows.push({
    surface: '/health',
    status: healthRes.status,
    drift: [
      ...(health?.service === 'wethus-backend' ? [] : ['service identity']),
      ...(!health?.build || typeof health.build !== 'object' ? ['build metadata'] : []),
      ...(!health?.security || typeof health.security !== 'object' ? ['security object'] : []),
      ...(Object.prototype.hasOwnProperty.call(health?.security || {}, 'cloudStateRequireSession') ? [] : ['cloudStateRequireSession key']),
      ...(Object.prototype.hasOwnProperty.call(health?.security || {}, 'integrationsRequireActor') ? [] : ['integrationsRequireActor key']),
      ...(Object.prototype.hasOwnProperty.call(health?.security || {}, 'integrationsRequireSession') ? [] : ['integrationsRequireSession key']),
      ...(Object.prototype.hasOwnProperty.call(health?.security || {}, 'integrationsEnforceLaunchScope') ? [] : ['integrationsEnforceLaunchScope key']),
      ...(Object.prototype.hasOwnProperty.call(health?.security || {}, 'projectInteractionsRequireSession') ? [] : ['projectInteractionsRequireSession key']),
      ...(Object.prototype.hasOwnProperty.call(health?.security || {}, 'projectAccessRequireMembership') ? [] : ['projectAccessRequireMembership key'])
    ]
  });

  const { res: providerRes, json: providerJson } = await fetchJson(`${API_BASE_URL}/integrations/providers`);
  const providers = providerRes.ok && providerJson?.ok && Array.isArray(providerJson.providers) ? providerJson.providers : [];
  const providerMap = Object.fromEntries(providers.map((provider) => [String(provider?.key || ''), provider]));
  const providerDrift = [];

  for (const key of [...LAUNCH_SCOPE.launchProviders, ...LAUNCH_SCOPE.deferredProviders]) {
    const provider = providerMap[key];
    const expectedPhase = LAUNCH_SCOPE.launchProviders.includes(key) ? 'launch' : LAUNCH_SCOPE.deferredProviders.includes(key) ? 'deferred' : 'unknown';
    const expectedIncluded = expectedPhase === 'launch';
    if (!provider) {
      providerDrift.push(`${key} row missing`);
      continue;
    }
    if (provider.launchPhase !== expectedPhase) providerDrift.push(`${key}.launchPhase`);
    if (provider.launchIncluded !== expectedIncluded) providerDrift.push(`${key}.launchIncluded`);
    if (!String(provider.launchNote || '').trim()) providerDrift.push(`${key}.launchNote`);
  }

  rows.push({
    surface: '/integrations/providers',
    status: providerRes.status,
    drift: providerDrift
  });

  return rows;
}

function printSection(title) {
  console.log('');
  console.log(title);
}

async function buildSummary() {
  const source = await localSourceStatus();
  const runtime = await productionRuntimeStatus();
  const renderEnvSync = analyzeRenderEnvSync(runtime.security || {}, runtime.buildCommit || '', source.backendHead);
  const frontend = await frontendDriftStatus();
  const backendContract = await backendContractDriftStatus();

  const disabledFlags = securityFlags.filter(([key]) => runtime.security?.[key] !== true);
  const providerWarnings = LAUNCH_SCOPE.launchProviders
    .map((key) => [key, runtime.providerMap[key]?.status || 'missing'])
    .filter(([, status]) => status !== 'ready');
  const frontendWarnings = frontend.filter((row) => !row.ok);
  const backendContractWarnings = backendContract.filter((row) => row.status !== 200 || row.drift.length > 0);

  const localReady = source.aligned && !source.dirty;
  const productionReady = !disabledFlags.length && !frontendWarnings.length && !backendContractWarnings.length;

  return {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    apiBaseUrl: API_BASE_URL,
    localReleaseCandidateReady: localReady,
    productionLaunchReady: productionReady,
    source,
    runtime,
    renderEnvSync,
    frontend,
    backendContract,
    blockers: {
      source: [
        ...(!source.aligned ? ['local HEAD does not match origin/main'] : []),
        ...(source.dirty ? ['local worktree still has uncommitted changes'] : [])
      ],
      disabledFlags: disabledFlags.map(([, envKey]) => envKey),
      renderEnvSync: renderEnvSync.mismatches,
      providers: providerWarnings.map(([provider, status]) => ({ provider, status })),
      frontend: frontendWarnings.map((row) => ({ file: row.file, driftCount: row.snippetDrift.length, status: row.status })),
      backendContract: backendContractWarnings.map((row) => ({ surface: row.surface, driftCount: row.drift.length, status: row.status }))
    },
    nextActions: [
      ...((!source.aligned || source.dirty) ? ['commit and push the current commercialization bundle'] : []),
      ...disabledFlags.map(([, envKey]) => `set Render env ${envKey}=true`),
      ...(renderEnvSync.envSyncPending ? ['sync Render saved env values with the current render.yaml blueprint or update them manually in the Render dashboard'] : []),
      ...(disabledFlags.length ? ['redeploy Render backend'] : []),
      ...(backendContractWarnings.length ? ['rerun node scripts/check-live-backend-contract-drift.js after backend deploys'] : []),
      ...(frontendWarnings.length ? ['redeploy Vercel frontend', 'rerun node scripts/check-live-frontend-drift.js'] : []),
      ...(providerWarnings.length ? ['configure the remaining launch-scope provider secrets or remove them from launch scope'] : []),
      'rerun REQUIRE_WETHUS_BACKEND_CONTRACTS=true WETHUS_GATE_STRICT_PRODUCTION=true node scripts/run-commercial-gate.js once deploys are live'
    ]
  };
}

function printSummary(summary) {
  const {
    localReleaseCandidateReady,
    productionLaunchReady,
    runtime,
    source,
    frontend,
    backendContract,
    blockers,
    renderEnvSync,
    nextActions
  } = summary;

  console.log('Commercialization readiness summary');
  console.log(`- local release candidate: ${localReleaseCandidateReady ? 'ready' : 'not ready'}`);
  console.log(`- production launch state: ${productionLaunchReady ? 'ready' : 'blocked'}`);
  console.log(`- backend build: ${runtime.buildRef} ${runtime.buildCommit}`);

  printSection('Local source state');
  console.log(`- HEAD matches origin/main: ${source.aligned ? 'yes' : 'no'}`);
  console.log(`- worktree dirty: ${source.dirty ? `yes (${source.dirtyCount} changed files)` : 'no'}`);

  printSection('Production backend flags');
  for (const [healthKey, envKey] of securityFlags) {
    console.log(`- ${envKey}: ${runtime.security?.[healthKey] === true ? 'true' : 'false'}`);
  }

  printSection('Render env sync');
  if (!renderEnvSync.mismatches.length) {
    console.log('- render.yaml security defaults match live /health flags');
  } else {
    console.log(`- build matches backend source: ${renderEnvSync.buildMatchesSource ? 'yes' : 'no'}`);
    renderEnvSync.mismatches.forEach((item) => {
      console.log(`- ${item.envKey}: desired=${item.desired} actual=${item.actual}`);
    });
    if (renderEnvSync.envSyncPending) {
      console.log('- live backend source is current; remaining rollout work is saved Render env synchronization');
    }
  }

  printSection('Production provider scope');
  for (const provider of LAUNCH_SCOPE.launchProviders) {
    console.log(`- launch: ${provider} = ${runtime.providerMap[provider]?.status || 'missing'}`);
  }
  for (const provider of LAUNCH_SCOPE.deferredProviders) {
    console.log(`- deferred: ${provider} = ${runtime.providerMap[provider]?.status || 'missing'}`);
  }

  printSection('Frontend contract drift');
  for (const row of frontend) {
    console.log(`- ${row.file}: ${row.ok ? 'clean' : `${row.snippetDrift.length} drift / http ${row.status}`}`);
  }

  printSection('Backend contract drift');
  for (const row of backendContract) {
    console.log(`- ${row.surface}: ${row.status === 200 && !row.drift.length ? 'clean' : `${row.drift.length} drift / http ${row.status}`}`);
  }

  printSection('Current launch blockers');
  for (const message of blockers.source) {
    console.log(`- ${message}`);
  }
  for (const envKey of blockers.disabledFlags) {
    console.log(`- production flag disabled: ${envKey}`);
  }
  for (const item of blockers.renderEnvSync) {
    console.log(`- render env sync mismatch: ${item.envKey}`);
  }
  for (const { provider, status } of blockers.providers) {
    console.log(`- provider not ready: ${provider} (${status})`);
  }
  for (const row of blockers.frontend) {
    console.log(`- frontend drift: ${row.file}`);
  }
  for (const row of blockers.backendContract) {
    console.log(`- backend contract drift: ${row.surface}`);
  }
  if (!blockers.source.length && !blockers.disabledFlags.length && !blockers.renderEnvSync.length && !blockers.providers.length && !blockers.frontend.length) {
    console.log('- none');
  }

  printSection('Next actions');
  nextActions.forEach((action) => console.log(`- ${action}`));
}

(async () => {
  const summary = await buildSummary();
  if (JSON_MODE) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }
  printSummary(summary);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
