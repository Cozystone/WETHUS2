const { getLaunchScope } = require('./lib/launch-scope');

const BASE_URL = (process.env.WETHUS_BASE_URL || 'https://www.wethus.co.kr').replace(/\/$/, '');
const API_BASE_URL = (process.env.WETHUS_API_BASE_URL || 'https://wethus-api.onrender.com').replace(/\/$/, '');
const STRICT = String(process.env.WETHUS_AUDIT_STRICT || 'true').toLowerCase() !== 'false';
const REQUIRE_FRONTEND_CONTRACTS = String(process.env.REQUIRE_WETHUS_FRONTEND_HUB_CONTRACTS || 'false').toLowerCase() === 'true';
const REQUIRE_BACKEND_CONTRACTS = String(process.env.REQUIRE_WETHUS_BACKEND_CONTRACTS || 'false').toLowerCase() === 'true';
const REQUIRE_PROVIDER_READINESS = String(process.env.REQUIRE_WETHUS_PROVIDER_READINESS || 'false').toLowerCase() === 'true';
const LAUNCH_SCOPE = getLaunchScope();

const blockers = [];
const warnings = [];
const notes = [];
const actions = [];

function addBlocker(message) {
  blockers.push(message);
}

function addWarning(message) {
  warnings.push(message);
}

function addNote(message) {
  notes.push(message);
}

function addAction(message) {
  if (!actions.includes(message)) actions.push(message);
}

function addBackendContractFinding(message) {
  if (REQUIRE_BACKEND_CONTRACTS) addBlocker(message);
  else addWarning(message);
}

function expectedProviderPhase(key) {
  if (LAUNCH_SCOPE.launchProviders.includes(key)) return 'launch';
  if (LAUNCH_SCOPE.deferredProviders.includes(key)) return 'deferred';
  return 'unknown';
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
  return { res, text, json };
}

async function fetchText(url) {
  const res = await fetch(url, { redirect: 'follow' });
  const text = await res.text();
  return { res, text };
}

async function auditSite() {
  const url = `${BASE_URL}/`;
  const { res, text } = await fetchText(url);
  if (res.status !== 200) addBlocker(`Site root must return HTTP 200, got ${res.status}`);
  if (!text.includes('WETHUS')) addBlocker('Site root is missing the WETHUS brand marker.');
  if (!/app\.js\?v=/.test(text)) addWarning('Site root HTML is missing the versioned app.js reference.');
  addNote(`Site root response: ${res.status}`);
}

async function auditHealth() {
  const { res, json } = await fetchJson(`${API_BASE_URL}/health`);
  if (res.status !== 200) {
    addBlocker(`/health must return HTTP 200, got ${res.status}`);
    return;
  }
  if (!json?.ok) addBlocker('/health must return ok=true.');
  if (json?.service !== 'wethus-backend') addBlocker('Production backend service identity is missing or unexpected.');
  if (!json?.build || !json?.build?.commit) addWarning('Production backend build metadata is missing.');

  const security = json?.security || {};
  const requiredSecurityKeys = [
    ['cloudStateRequireSession', 'cloud/state session guard contract key'],
    ['integrationsRequireActor', 'integration actor guard contract key'],
    ['integrationsRequireSession', 'integration session guard contract key'],
    ['integrationsEnforceLaunchScope', 'integration launch-scope enforcement contract key'],
    ['projectInteractionsRequireSession', 'project interaction guard contract key'],
    ['projectAccessRequireMembership', 'project membership access guard contract key']
  ];
  for (const [key, label] of requiredSecurityKeys) {
    if (!Object.prototype.hasOwnProperty.call(security, key)) {
      addBackendContractFinding(`/health is missing ${label}: ${key}`);
      addAction('Backend deploy: redeploy the Render backend so /health exposes the full hardened security contract.');
    }
  }

  const requiredFlags = [
    ['cloudStateRequireSession', 'cloud/state session guard', 'CLOUD_STATE_REQUIRE_SESSION'],
    ['integrationsRequireActor', 'integration actor guard', 'INTEGRATIONS_REQUIRE_ACTOR'],
    ['integrationsRequireSession', 'integration session guard', 'INTEGRATIONS_REQUIRE_SESSION'],
    ['integrationsEnforceLaunchScope', 'integration launch-scope enforcement', 'INTEGRATIONS_ENFORCE_LAUNCH_SCOPE'],
    ['projectInteractionsRequireSession', 'project interaction session guard', 'PROJECT_INTERACTIONS_REQUIRE_SESSION'],
    ['projectAccessRequireMembership', 'project membership access guard', 'PROJECT_ACCESS_REQUIRE_MEMBERSHIP']
  ];
  for (const [key, label, envKey] of requiredFlags) {
    if (security[key] !== true) {
      addBlocker(`${label} is not enabled in production.`);
      addAction(`Render env: set ${envKey}=true, redeploy the backend, then rerun the strict production gate.`);
    }
  }

  addNote(`Backend build: ${json?.build?.ref || '-'} ${json?.build?.commit || '-'}`);
}

async function auditProviders() {
  const { res, json } = await fetchJson(`${API_BASE_URL}/integrations/providers`);
  if (res.status !== 200 || !json?.ok) {
    addBlocker('/integrations/providers is unavailable.');
    return;
  }

  const providers = Array.isArray(json.providers) ? json.providers : [];
  const byKey = Object.fromEntries(providers.map((provider) => [String(provider?.key || ''), provider]));

  for (const key of LAUNCH_SCOPE.launchProviders) {
    const provider = byKey[key];
    if (provider?.status !== 'ready') addBlocker(`${key} provider is not ready.`);
    if (!provider) {
      addBackendContractFinding(`${key} provider metadata is missing launch contract fields.`);
      addAction('Backend deploy: redeploy the Render backend so /integrations/providers exposes the launch-scope contract fields.');
      continue;
    }
    if (provider.launchPhase !== expectedProviderPhase(key)) {
      addBackendContractFinding(`${key} provider launchPhase should be ${expectedProviderPhase(key)}, got ${provider.launchPhase || 'missing'}.`);
      addAction('Backend deploy: redeploy the Render backend so /integrations/providers matches the local launch-scope contract.');
    }
    if (provider.launchIncluded !== true) {
      addBackendContractFinding(`${key} provider should expose launchIncluded=true.`);
      addAction('Backend deploy: redeploy the Render backend so /integrations/providers matches the local launch-scope contract.');
    }
    if (!String(provider.launchNote || '').trim()) {
      addBackendContractFinding(`${key} provider should expose a non-empty launchNote.`);
      addAction('Backend deploy: redeploy the Render backend so /integrations/providers matches the local launch-scope contract.');
    }
  }

  for (const key of LAUNCH_SCOPE.deferredProviders) {
    const provider = byKey[key];
    if (!provider) {
      const message = `${key} provider metadata is missing.`;
      if (REQUIRE_PROVIDER_READINESS || REQUIRE_BACKEND_CONTRACTS) addBlocker(message);
      else addWarning(message);
      addAction('Backend deploy: redeploy the Render backend so /integrations/providers exposes the launch-scope contract fields.');
      continue;
    }
    if (!['deferred', 'ready'].includes(String(provider.status || ''))) {
      const message = `${provider.label || key} provider is still ${provider.status || 'unknown'}.`;
      if (REQUIRE_PROVIDER_READINESS) addBlocker(message);
      else addWarning(message);
      const envKeys = {
        notion: 'NOTION_CLIENT_ID / NOTION_CLIENT_SECRET / NOTION_REDIRECT_URI',
        slack: 'SLACK_CLIENT_ID / SLACK_CLIENT_SECRET / SLACK_REDIRECT_URI',
        figma: 'FIGMA_CLIENT_ID / FIGMA_CLIENT_SECRET / FIGMA_REDIRECT_URI'
      };
      if (envKeys[key]) addAction(`Provider setup: configure ${envKeys[key]} in Render before marketing ${key} as a live integration.`);
    } else if (provider.status === 'deferred') {
      addNote(`${provider.label || key} remains intentionally deferred outside the current launch scope.`);
    }
    if (provider.launchPhase !== expectedProviderPhase(key)) {
      addBackendContractFinding(`${key} provider launchPhase should be ${expectedProviderPhase(key)}, got ${provider.launchPhase || 'missing'}.`);
      addAction('Backend deploy: redeploy the Render backend so /integrations/providers matches the local launch-scope contract.');
    }
    if (provider.launchIncluded !== false) {
      addBackendContractFinding(`${key} provider should expose launchIncluded=false.`);
      addAction('Backend deploy: redeploy the Render backend so /integrations/providers matches the local launch-scope contract.');
    }
    if (!String(provider.launchNote || '').trim()) {
      addBackendContractFinding(`${key} provider should expose a non-empty launchNote.`);
      addAction('Backend deploy: redeploy the Render backend so /integrations/providers matches the local launch-scope contract.');
    }
  }

  LAUNCH_SCOPE.notes.forEach((note) => addNote(`Launch scope: ${note}`));
}

async function auditFrontendFlows() {
  const pages = [
    { path: '/' },
    { path: '/explore.html' },
    { path: '/project-hub.html' },
    { path: '/founder.html' },
    {
      path: '/login.html',
      frontendContract: [
        'meta name="wethus-frontend-contract" content="2026-06-26-commercial-interactions-v1"',
        'function redirectAfterAuth(user, options = {})',
        'onboardingReturnTo'
      ]
    },
    {
      path: '/',
      frontendContract: [
        'meta name="wethus-frontend-contract" content="2026-06-26-commercial-interactions-v1"',
        'class="hero-banner"',
        'id="homeFeatured"',
        'WETHUS MANIFESTO'
      ]
    },
    {
      path: '/project-hub.html',
      frontendContract: [
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
      path: '/profile.html',
      frontendContract: [
        'meta name="wethus-frontend-contract" content="2026-06-26-commercial-interactions-v1"',
        'WETHUS.myBookmarkedProjects()',
        'WETHUS.myLikedProjects()',
        'data-open-project'
      ]
    },
    {
      path: '/explore_theme.html',
      frontendContract: [
        'meta name="wethus-frontend-contract" content="2026-06-26-commercial-interactions-v1"',
        'WETHUS.isBookmarked(',
        'class="bookmark-btn',
        'data-bm="'
      ]
    }
  ];

  const checkedPaths = new Set();
  for (const page of pages) {
    const { path, frontendContract = [] } = page;
    const { res, text } = await fetchText(`${BASE_URL}${path}`);
    checkedPaths.add(path);

    if (res.status !== 200) addBlocker(`${path} must return HTTP 200, got ${res.status}`);

    for (const snippet of frontendContract) {
      if (!text.includes(snippet)) {
        const message = `${path} is missing expected frontend contract snippet: ${snippet}`;
        if (REQUIRE_FRONTEND_CONTRACTS) addBlocker(message);
        else addWarning(message);
        addAction(`Frontend deploy: redeploy the Vercel frontend so ${path} matches the local commercialization contract.`);
      }
    }
  }

  addNote('Core frontend page response checks completed.');
  addNote(`Frontend contract pages checked: ${Array.from(checkedPaths).join(', ')}`);
}

async function auditOpportunityFreshness() {
  const { res, json } = await fetchJson(`${BASE_URL}/data/opportunity-published.json`);
  if (res.status !== 200 || !json) {
    addWarning('Opportunity feed freshness could not be audited from production.');
    return;
  }

  const updatedAt = String(json.updatedAt || '').trim();
  if (!updatedAt) {
    addWarning('Opportunity feed is missing updatedAt metadata.');
    addAction('Opportunity ops: publish the feed with an updatedAt timestamp so freshness can be audited.');
    return;
  }

  const updatedDate = new Date(updatedAt);
  if (Number.isNaN(updatedDate.getTime())) {
    addWarning(`Opportunity feed updatedAt is invalid: ${updatedAt}`);
    addAction('Opportunity ops: fix opportunity-published.json updatedAt format.');
    return;
  }

  const ageDays = Math.max(0, Math.floor((Date.now() - updatedDate.getTime()) / 86400000));
  addNote(`Opportunity feed updatedAt: ${updatedDate.toISOString()} (${ageDays} days old)`);

  if (ageDays > 14) {
    addWarning(`Opportunity feed is stale at ${ageDays} days old.`);
    addAction('Opportunity ops: refresh opportunity-published.json so the public opportunity surface reflects current deadlines.');
  }
}

(async () => {
  await auditSite();
  await auditHealth();
  await auditProviders();
  await auditFrontendFlows();
  await auditOpportunityFreshness();

  if (notes.length) {
    console.log(notes.map((note) => `- NOTE: ${note}`).join('\n'));
  }
  if (warnings.length) {
    console.warn(warnings.map((warning) => `- WARNING: ${warning}`).join('\n'));
  }
  if (actions.length) {
    console.log(actions.map((action) => `- ACTION: ${action}`).join('\n'));
  }
  if (blockers.length) {
    const message = blockers.map((blocker) => `- BLOCKER: ${blocker}`).join('\n');
    if (STRICT) {
      console.error(message);
      process.exit(1);
    }
    console.warn(message);
  }

  console.log(`Commercial readiness audit completed for ${BASE_URL}.`);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
