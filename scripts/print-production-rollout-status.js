const BASE_URL = (process.env.WETHUS_BASE_URL || 'https://www.wethus.co.kr').replace(/\/$/, '');
const API_BASE_URL = (process.env.WETHUS_API_BASE_URL || 'https://wethus-api.onrender.com').replace(/\/$/, '');
const fs = require('fs');
const path = require('path');
const { getLaunchScope } = require('./lib/launch-scope');
const { analyzeRenderEnvSync } = require('./lib/render-env-sync');

const LAUNCH_SCOPE = getLaunchScope();
const securityFlags = [
  ['cloudStateRequireSession', 'CLOUD_STATE_REQUIRE_SESSION'],
  ['integrationsRequireActor', 'INTEGRATIONS_REQUIRE_ACTOR'],
  ['integrationsRequireSession', 'INTEGRATIONS_REQUIRE_SESSION'],
  ['integrationsEnforceLaunchScope', 'INTEGRATIONS_ENFORCE_LAUNCH_SCOPE'],
  ['projectInteractionsRequireSession', 'PROJECT_INTERACTIONS_REQUIRE_SESSION'],
  ['projectAccessRequireMembership', 'PROJECT_ACCESS_REQUIRE_MEMBERSHIP']
];
const appRoot = path.join(__dirname, '..', 'WETHUS2');
const frontendChecks = [
  {
    file: 'index.html',
    urlPath: '/',
    snippets: [
      'meta name="wethus-frontend-contract" content="2026-06-25-commercial-hardening-v1"',
      'class="hero-banner"',
      'id="homeFeatured"',
      'WETHUS MANIFESTO'
    ]
  },
  {
    file: 'project-hub.html',
    snippets: [
      'meta name="wethus-frontend-contract" content="2026-06-25-commercial-hardening-v1"',
      'renderHub = async function renderHubStable()',
      'loadRemoteActivityEventsForCurrentProject()',
      'loadRemoteStatusSnapshotForCurrentProject()',
      'mergedProjectTimeline(80)'
    ]
  },
  {
    file: 'profile.html',
    snippets: [
      'meta name="wethus-frontend-contract" content="2026-06-25-commercial-hardening-v1"',
      'WETHUS.myBookmarkedProjects()',
      'WETHUS.myLikedProjects()',
      'data-open-project'
    ]
  },
  {
    file: 'explore_theme.html',
    snippets: [
      'meta name="wethus-frontend-contract" content="2026-06-25-commercial-hardening-v1"',
      'WETHUS.isBookmarked(',
      'class="bookmark-btn',
      'data-bm="'
    ]
  },
  {
    file: 'login.html',
    snippets: [
      'meta name="wethus-frontend-contract" content="2026-06-25-commercial-hardening-v1"',
      'function redirectAfterAuth(user, options = {})',
      'onboardingReturnTo'
    ]
  }
];

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

async function summarizeFrontendDrift() {
  const rows = [];
  for (const check of frontendChecks) {
    const localPath = path.join(appRoot, check.file);
    const localText = fs.readFileSync(localPath, 'utf8');
    const url = check.urlPath ? `${BASE_URL}${check.urlPath}` : `${BASE_URL}/${check.file}`;
    const { res, text: liveText } = await fetchText(url);
    const snippetDrift = check.snippets.filter((snippet) => localText.includes(snippet) !== liveText.includes(snippet));
    rows.push({
      file: check.file,
      status: res.status,
      driftCount: snippetDrift.length,
      snippetDrift
    });
  }
  return rows;
}

async function summarizeBackendContractDrift() {
  const rows = [];

  const { res: healthRes, json: health } = await fetchJson(`${API_BASE_URL}/health`);
  const healthDrift = [
    ...(health?.service === 'wethus-backend' ? [] : ['service identity']),
    ...(!health?.build || typeof health.build !== 'object' ? ['build metadata'] : []),
    ...(!health?.security || typeof health.security !== 'object' ? ['security object'] : []),
    ...(Object.prototype.hasOwnProperty.call(health?.security || {}, 'cloudStateRequireSession') ? [] : ['cloudStateRequireSession key']),
    ...(Object.prototype.hasOwnProperty.call(health?.security || {}, 'integrationsRequireActor') ? [] : ['integrationsRequireActor key']),
    ...(Object.prototype.hasOwnProperty.call(health?.security || {}, 'integrationsRequireSession') ? [] : ['integrationsRequireSession key']),
    ...(Object.prototype.hasOwnProperty.call(health?.security || {}, 'integrationsEnforceLaunchScope') ? [] : ['integrationsEnforceLaunchScope key']),
    ...(Object.prototype.hasOwnProperty.call(health?.security || {}, 'projectInteractionsRequireSession') ? [] : ['projectInteractionsRequireSession key']),
    ...(Object.prototype.hasOwnProperty.call(health?.security || {}, 'projectAccessRequireMembership') ? [] : ['projectAccessRequireMembership key'])
  ];
  rows.push({ surface: '/health', status: healthRes.status, drift: healthDrift });

  const { res: providerRes, json: providerJson } = await fetchJson(`${API_BASE_URL}/integrations/providers`);
  const providers = providerRes.ok && providerJson?.ok && Array.isArray(providerJson.providers) ? providerJson.providers : [];
  const providerMap = Object.fromEntries(providers.map((provider) => [String(provider?.key || ''), provider]));
  const providerDrift = [];
  for (const key of [...LAUNCH_SCOPE.launchProviders, ...LAUNCH_SCOPE.deferredProviders]) {
    const provider = providerMap[key];
    const expectedPhase = LAUNCH_SCOPE.launchProviders.includes(key) ? 'launch' : 'deferred';
    const expectedIncluded = expectedPhase === 'launch';
    if (!provider) {
      providerDrift.push(`${key} row missing`);
      continue;
    }
    if (provider.launchPhase !== expectedPhase) providerDrift.push(`${key}.launchPhase`);
    if (provider.launchIncluded !== expectedIncluded) providerDrift.push(`${key}.launchIncluded`);
    if (!String(provider.launchNote || '').trim()) providerDrift.push(`${key}.launchNote`);
  }
  rows.push({ surface: '/integrations/providers', status: providerRes.status, drift: providerDrift });

  return rows;
}

async function main() {
  const { res: healthRes, json: health } = await fetchJson(`${API_BASE_URL}/health`);
  if (!healthRes.ok || !health?.ok) {
    console.error(`- unable to read ${API_BASE_URL}/health`);
    process.exit(1);
  }

  const { res: providerRes, json: providerJson } = await fetchJson(`${API_BASE_URL}/integrations/providers`);
  const providers = providerRes.ok && providerJson?.ok && Array.isArray(providerJson.providers) ? providerJson.providers : [];
  const providerMap = Object.fromEntries(providers.map((provider) => [String(provider?.key || ''), provider]));
  const frontendDrift = await summarizeFrontendDrift();
  const backendContractDrift = await summarizeBackendContractDrift();
  const sourceHead = require('child_process')
    .spawnSync('git', ['rev-parse', 'HEAD'], { cwd: path.resolve(__dirname, '..'), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], shell: false })
    .stdout
    .trim();
  const renderEnvSync = analyzeRenderEnvSync(health?.security || {}, health?.build?.commit || '', sourceHead);

  console.log(`Production rollout status for ${BASE_URL}`);
  console.log(`Backend build: ${health?.build?.ref || '-'} ${health?.build?.commit || '-'}`);
  console.log('');
  console.log('Security flags:');
  for (const [healthKey, envKey] of securityFlags) {
    const enabled = health?.security?.[healthKey] === true;
    console.log(`- ${envKey}: ${enabled ? 'true' : 'false'}`);
  }

  console.log('');
  console.log('Provider readiness:');
  for (const key of LAUNCH_SCOPE.launchProviders) {
    const provider = providerMap[key];
    console.log(`- launch: ${key} = ${provider?.status || 'missing'}`);
  }
  for (const key of LAUNCH_SCOPE.deferredProviders) {
    const provider = providerMap[key];
    console.log(`- deferred: ${key} = ${provider?.status || 'missing'}`);
  }

  console.log('');
  console.log('Frontend contract drift:');
  for (const row of frontendDrift) {
    const summary = row.status !== 200
      ? `http ${row.status}`
      : row.driftCount
        ? `${row.driftCount} snippet drift`
        : 'clean';
    console.log(`- ${row.file}: ${summary}`);
    if (row.snippetDrift.length) {
      for (const snippet of row.snippetDrift) {
        console.log(`  - missing parity: ${snippet}`);
      }
    }
  }

  console.log('');
  console.log('Backend contract drift:');
  for (const row of backendContractDrift) {
    const summary = row.status !== 200
      ? `http ${row.status}`
      : row.drift.length
        ? `${row.drift.length} contract drift`
        : 'clean';
    console.log(`- ${row.surface}: ${summary}`);
    if (row.drift.length) {
      for (const item of row.drift) {
        console.log(`  - missing parity: ${item}`);
      }
    }
  }

  console.log('');
  console.log('Render env sync:');
  if (!renderEnvSync.mismatches.length) {
    console.log('- render.yaml security defaults match live /health flags');
  } else {
    console.log(`- build matches source: ${renderEnvSync.buildMatchesSource ? 'yes' : 'no'}`);
    renderEnvSync.mismatches.forEach((item) => {
      console.log(`- ${item.envKey}: desired=${item.desired} actual=${item.actual}`);
    });
    if (renderEnvSync.envSyncPending) {
      console.log('- live backend code is current, but Render saved env values are still older than the blueprint defaults');
    }
  }

  const rolloutNeeded = securityFlags.filter(([healthKey]) => health?.security?.[healthKey] !== true);
  if (rolloutNeeded.length) {
    console.log('');
    console.log('Next Render env updates:');
    for (const [, envKey] of rolloutNeeded) {
      console.log(`- set ${envKey}=true`);
    }
    console.log('- redeploy Render backend');
    console.log('- rerun: REQUIRE_WETHUS_BACKEND_CONTRACTS=true WETHUS_GATE_STRICT_PRODUCTION=true node scripts/run-commercial-gate.js');
    console.log('- helper: node scripts/print-post-deploy-verification.js');
    if (renderEnvSync.envSyncPending) {
      console.log('- note: Render backend code is already current; this is now an env sync/settings problem rather than a source deploy problem');
    }
  }

  const driftNeeded = frontendDrift.filter((row) => row.status !== 200 || row.driftCount > 0);
  if (driftNeeded.length) {
    console.log('');
    console.log('Next frontend deploy actions:');
    driftNeeded.forEach((row) => console.log(`- redeploy Vercel frontend for ${row.file}`));
    console.log('- rerun: node scripts/check-live-frontend-drift.js');
    console.log('- helper: node scripts/print-post-deploy-verification.js');
  }

  const backendDriftNeeded = backendContractDrift.filter((row) => row.status !== 200 || row.drift.length > 0);
  if (backendDriftNeeded.length) {
    console.log('');
    console.log('Next backend contract actions:');
    console.log('- redeploy Render backend from the current hardened source state');
    console.log('- rerun: node scripts/check-live-backend-contract-drift.js');
    console.log('- rerun: REQUIRE_WETHUS_BACKEND_CONTRACTS=true node scripts/smoke-production.js');
    console.log('- helper: node scripts/print-post-deploy-verification.js');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
