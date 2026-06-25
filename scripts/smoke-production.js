const { getLaunchScope } = require('./lib/launch-scope');

const BASE_URL = (process.env.WETHUS_BASE_URL || 'https://www.wethus.co.kr').replace(/\/$/, '');
const API_BASE_URL = (process.env.WETHUS_API_BASE_URL || 'https://wethus-api.onrender.com').replace(/\/$/, '');
const REQUIRE_API_SECURITY_HEADERS = String(process.env.REQUIRE_WETHUS_API_SECURITY_HEADERS || 'false').toLowerCase() === 'true';
const REQUIRE_API_HEALTH_METADATA = String(process.env.REQUIRE_WETHUS_API_HEALTH_METADATA || process.env.REQUIRE_WETHUS_API_SECURITY_HEADERS || 'false').toLowerCase() === 'true';
const REQUIRE_API_SECURITY_FLAGS = String(process.env.REQUIRE_WETHUS_API_SECURITY_FLAGS || 'false').toLowerCase() === 'true';
const REQUIRE_PROVIDER_READINESS = String(process.env.REQUIRE_WETHUS_PROVIDER_READINESS || 'false').toLowerCase() === 'true';
const REQUIRE_BACKEND_CONTRACTS = String(process.env.REQUIRE_WETHUS_BACKEND_CONTRACTS || 'false').toLowerCase() === 'true';
const REQUIRE_FRONTEND_HUB_CONTRACTS = String(process.env.REQUIRE_WETHUS_FRONTEND_HUB_CONTRACTS || 'false').toLowerCase() === 'true';
const LAUNCH_SCOPE = getLaunchScope();

const checks = [
  {
    path: '/',
    status: 200,
    includes: [
      'WETHUS',
      'meta name="wethus-frontend-contract" content="2026-06-26-commercial-interactions-v1"',
      'id="homeFeatured"',
      'WETHUS MANIFESTO'
    ],
    excludes: ['id="loginForm"', 'class="auth-card"'],
    includesRegex: [/app\.js\?v=/, /script\.js\?v=/]
  },
  {
    path: '/opportunities.html',
    status: 200,
    includes: ['includeClosedToggle', 'includeClosed:false']
  },
  {
    path: '/login.html',
    status: 200,
    includes: [
      'meta name="wethus-frontend-contract" content="2026-06-26-commercial-interactions-v1"',
      'id="devModeRow" style="display:none;"',
      'const allowDevMode = isLocalHost || window.WETHUS_ENABLE_DEV_MODE === true;',
      'function redirectAfterAuth(user, options = {})',
      'onboardingReturnTo'
    ],
    includesRegex: [/app\.js\?v=/],
    excludes: ['\n</html>\ntGoogleSignIn'],
    excludesRegex: [/^\s*tGoogleSignIn\(\);/m, /^\s*nce: true\}\);/m]
  },
  {
    path: '/founder.html',
    status: 200,
    includes: [
      'meta name="wethus-frontend-contract" content="2026-06-26-commercial-interactions-v1"',
      "const moderationStatus = moderation.review ? 'manual_review' : 'approved'",
      'const fieldLabels = {',
      'const focusField = (el) => {'
    ],
    includesRegex: [/app\.js\?v=/]
  },
  {
    path: '/project-hub.html',
    status: 200,
    frontendContract: true,
    includes: [
      'meta name="wethus-frontend-contract" content="2026-06-26-commercial-interactions-v1"',
      'renderHub = async function renderHubStable()',
      'loadRemoteActivityEventsForCurrentProject()',
      'loadRemoteStatusSnapshotForCurrentProject()',
      'mergedProjectTimeline(80)',
      'id="hubWebhookModal"',
      'id="hubWebhookOpsStatus"',
      'id="pgAiBlockers"',
      'id="pgAiEvidenceGaps"',
      'id="pgAiRuns"',
      'function renderMentorRunHistory(hub) {',
      'data-mentor-run-use',
      'requestMentorFollowupFromRun',
      'id="sdBlockers"',
      'id="sdEvidence"',
      'executionBlocker',
      'function integrationWebhookStatus(integration, providerMeta) {',
      'Webhook을 재발급하면 기존 secret은 즉시 무효화됩니다.',
      '외부 푸시 오래됨',
      'function sendWebhookTestEvent()',
      'data-tool-webhook'
    ],
    includesRegex: [/app\.js\?v=/]
  },
  {
    path: '/profile.html',
    status: 200,
    frontendContract: true,
    includes: [
      'meta name="wethus-frontend-contract" content="2026-06-26-commercial-interactions-v1"',
      'WETHUS.myBookmarkedProjects()',
      'WETHUS.myLikedProjects()',
      'data-open-project',
      'const onboardingReturnTarget = (() => {',
      'location.href = onboardingReturnTarget || \'index.html\''
    ],
    includesRegex: [/app\.js\?v=/]
  },
  {
    path: '/admin.html',
    status: 200,
    frontendContract: true,
    includes: [
      'meta name="wethus-frontend-contract" content="2026-06-26-commercial-interactions-v1"',
      'class="js-review-note"',
      'id="opsActionStatus"',
      'const setCardBusy = (card, busy, message) => {'
    ],
    includesRegex: [/app\.js\?v=/]
  },
  {
    path: '/explore_theme.html',
    status: 200,
    frontendContract: true,
    includes: [
      'meta name="wethus-frontend-contract" content="2026-06-26-commercial-interactions-v1"',
      'WETHUS.isBookmarked(',
      'class="bookmark-btn',
      'data-bm="',
      'reopenCommentPanel',
      'reopenApplyModal',
      'pendingApplyMotivation'
    ],
    includesRegex: [/app\.js\?v=/]
  },
  {
    path: '/data/opportunity-published.json',
    status: 200,
    json: true,
    minActiveOpportunities: 1
  },
  {
    url: `${API_BASE_URL}/auth/google/config`,
    status: 200,
    json: true,
    requireObject: {
      ok: true,
      clientId: 'string'
    }
  },
  {
    url: `${API_BASE_URL}/health`,
    status: 200,
    json: true,
    requireObject: {
      ok: true
    },
    securityHeaders: true,
    backendHealth: true
  },
  {
    url: `${API_BASE_URL}/integrations/providers`,
    status: 200,
    json: true,
    requireObject: {
      ok: true
    },
    providerCatalog: true
  },
  {
    path: '/app.js.bak_20260520_1152',
    status: 404
  }
];

const errors = [];
const warnings = [];

function fail(message) {
  errors.push(message);
}

function expectedProviderPhase(key) {
  if (LAUNCH_SCOPE.launchProviders.includes(key)) return 'launch';
  if (LAUNCH_SCOPE.deferredProviders.includes(key)) return 'deferred';
  return 'unknown';
}

function activeOpportunityCount(items) {
  const now = Date.now();
  return items.filter(item => {
    const raw = String(item?.deadline || item?.applyEnd || '').trim();
    const date = raw ? new Date(`${raw}T23:59:59+09:00`) : null;
    return date && !Number.isNaN(date.getTime()) && date.getTime() >= now;
  }).length;
}

async function runCheck(check) {
  const url = check.url || `${BASE_URL}${check.path}`;
  const response = await fetch(url, { redirect: 'follow' });
  const body = await response.text();
  const reportFrontendContract = (message) => {
    if (REQUIRE_FRONTEND_HUB_CONTRACTS) errors.push(message);
    else warnings.push(message);
  };
  const reportBackendContract = (message) => {
    if (REQUIRE_BACKEND_CONTRACTS) errors.push(message);
    else warnings.push(message);
  };

  if (response.status !== check.status) {
    errors.push(`${url} expected HTTP ${check.status}, got ${response.status}`);
  }

  for (const snippet of check.includes || []) {
    if (!body.includes(snippet)) {
      if (check.frontendContract) reportFrontendContract(`${url} is missing expected snippet: ${snippet}`);
      else errors.push(`${url} is missing expected snippet: ${snippet}`);
    }
  }

  for (const pattern of check.includesRegex || []) {
    if (!pattern.test(body)) {
      if (check.frontendContract) reportFrontendContract(`${url} is missing expected pattern: ${pattern}`);
      else errors.push(`${url} is missing expected pattern: ${pattern}`);
    }
  }

  for (const snippet of check.excludes || []) {
    if (body.includes(snippet)) {
      errors.push(`${url} contains forbidden snippet: ${snippet}`);
    }
  }

  for (const pattern of check.excludesRegex || []) {
    if (pattern.test(body)) {
      errors.push(`${url} contains forbidden pattern: ${pattern}`);
    }
  }

  if (check.json) {
    try {
      const parsed = JSON.parse(body);
      if (check.path === '/data/opportunity-published.json' && !Array.isArray(parsed.items)) {
        errors.push(`${url} JSON must contain an items array`);
      }
      if (check.minActiveOpportunities) {
        const items = Array.isArray(parsed.items) ? parsed.items : [];
        const activeCount = activeOpportunityCount(items);
        if (activeCount < check.minActiveOpportunities) {
          errors.push(`${url} must contain at least ${check.minActiveOpportunities} non-expired opportunity; found ${activeCount}`);
        }
      }
      for (const [key, expected] of Object.entries(check.requireObject || {})) {
        if (expected === true && parsed[key] !== true) errors.push(`${url} JSON field ${key} must be true`);
        if (expected === 'string' && !String(parsed[key] || '').trim()) errors.push(`${url} JSON field ${key} must be a non-empty string`);
      }
      if (check.backendHealth) {
        const reportHealthDrift = (message) => {
          if (REQUIRE_API_HEALTH_METADATA) errors.push(message);
          else warnings.push(message);
        };
        if (parsed.service !== 'wethus-backend') reportHealthDrift(`${url} does not expose backend service identity; production may be running an older backend`);
        if (!parsed.security || typeof parsed.security !== 'object') reportHealthDrift(`${url} does not expose backend security flags; production may be running an older backend`);
        if (!parsed.build || typeof parsed.build !== 'object') reportHealthDrift(`${url} does not expose backend build metadata; production deploy drift is harder to diagnose`);
        if (parsed.security && typeof parsed.security === 'object') {
          const requiredSecurityKeys = [
            'cloudStateRequireSession',
            'integrationsRequireActor',
            'integrationsRequireSession',
            'integrationsEnforceLaunchScope',
            'projectInteractionsRequireSession',
            'projectAccessRequireMembership'
          ];
          for (const key of requiredSecurityKeys) {
            if (!Object.prototype.hasOwnProperty.call(parsed.security, key)) {
              reportBackendContract(`${url} is missing backend security contract key ${key}`);
            }
          }
          const requiredFlags = [
            ['cloudStateRequireSession', 'cloud/state session guard'],
            ['integrationsRequireActor', 'integration actor guard'],
            ['integrationsRequireSession', 'integration session guard'],
            ['integrationsEnforceLaunchScope', 'integration launch-scope enforcement'],
            ['projectInteractionsRequireSession', 'project interaction session guard'],
            ['projectAccessRequireMembership', 'project membership access guard']
          ];
          for (const [key, label] of requiredFlags) {
            if (parsed.security[key] !== true) {
              const message = `${url} has not enabled ${label}`;
              if (REQUIRE_API_SECURITY_FLAGS) errors.push(message);
              else warnings.push(message);
            }
          }
        }
      }
      if (check.providerCatalog) {
        const rows = Array.isArray(parsed.providers) ? parsed.providers : [];
        const byKey = Object.fromEntries(rows.map((row) => [String(row?.key || ''), row]));
        for (const key of LAUNCH_SCOPE.launchProviders) {
          const provider = byKey[key];
          if (!provider || provider.status !== 'ready') {
            const message = `${url} provider ${key} is not ready`;
            if (REQUIRE_PROVIDER_READINESS) errors.push(message);
            else warnings.push(message);
          }
          if (!provider) {
            reportBackendContract(`${url} provider ${key} is missing launch contract metadata`);
            continue;
          }
          if (provider.launchPhase !== expectedProviderPhase(key)) {
            reportBackendContract(`${url} provider ${key} launchPhase should be ${expectedProviderPhase(key)}, got ${provider.launchPhase || 'missing'}`);
          }
          if (provider.launchIncluded !== true) {
            reportBackendContract(`${url} provider ${key} should expose launchIncluded=true`);
          }
          if (!String(provider.launchNote || '').trim()) {
            reportBackendContract(`${url} provider ${key} should expose a non-empty launchNote`);
          }
        }
        for (const key of LAUNCH_SCOPE.deferredProviders) {
          const provider = byKey[key];
          if (!provider) {
            reportBackendContract(`${url} provider ${key} is missing launch contract metadata`);
            continue;
          }
          if (!['deferred', 'ready'].includes(String(provider.status || ''))) {
            warnings.push(`${url} deferred provider ${key} is still ${provider.status}`);
          }
          if (provider.launchPhase !== expectedProviderPhase(key)) {
            reportBackendContract(`${url} provider ${key} launchPhase should be ${expectedProviderPhase(key)}, got ${provider.launchPhase || 'missing'}`);
          }
          if (provider.launchIncluded !== false) {
            reportBackendContract(`${url} provider ${key} should expose launchIncluded=false`);
          }
          if (!String(provider.launchNote || '').trim()) {
            reportBackendContract(`${url} provider ${key} should expose a non-empty launchNote`);
          }
        }
      }
    } catch (err) {
      errors.push(`${url} returned invalid JSON: ${err.message}`);
    }
  }

  if (check.securityHeaders) {
    const requiredHeaders = {
      'content-security-policy': "default-src 'none'",
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
      'referrer-policy': 'no-referrer'
    };
    for (const [header, expected] of Object.entries(requiredHeaders)) {
      const actual = response.headers.get(header) || '';
      if (!actual.includes(expected)) {
        const message = `${url} missing security header ${header}: ${expected}`;
        if (REQUIRE_API_SECURITY_HEADERS) errors.push(message);
        else warnings.push(message);
      }
    }
  }
}

async function verifyLiveGoogleOAuthStart() {
  const origin = BASE_URL;
  const next = '/project-hub.html?projectId=demo';
  const url = `${API_BASE_URL}/auth/google/start?next=${encodeURIComponent(next)}`;
  const response = await fetch(url, {
    redirect: 'manual',
    headers: {
      origin
    }
  });

  if (response.status !== 302) {
    fail(`${url} should return HTTP 302, got ${response.status}`);
    return;
  }

  const location = String(response.headers.get('location') || '').trim();
  if (!location) {
    fail(`${url} should include a Location header`);
    return;
  }

  let redirectUrl;
  try {
    redirectUrl = new URL(location);
  } catch (error) {
    fail(`${url} returned an invalid Location header: ${error.message}`);
    return;
  }

  if (redirectUrl.origin !== 'https://accounts.google.com') {
    fail(`${url} should redirect to Google Accounts, got ${redirectUrl.origin}`);
  }
  if (redirectUrl.pathname !== '/o/oauth2/v2/auth') {
    fail(`${url} should redirect to /o/oauth2/v2/auth, got ${redirectUrl.pathname}`);
  }
  if (redirectUrl.searchParams.get('response_type') !== 'code') {
    fail(`${url} should request response_type=code`);
  }
  if (redirectUrl.searchParams.get('scope') !== 'openid email profile') {
    fail(`${url} should request openid email profile scope`);
  }
  if (redirectUrl.searchParams.get('prompt') !== 'select_account') {
    fail(`${url} should request prompt=select_account`);
  }

  const state = String(redirectUrl.searchParams.get('state') || '').trim();
  if (!state) {
    fail(`${url} should include encoded state`);
    return;
  }

  let decoded = null;
  try {
    decoded = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
  } catch (error) {
    fail(`${url} should provide base64url JSON state: ${error.message}`);
    return;
  }

  if (decoded?.auth_flow !== 'login') {
    fail(`${url} should encode auth_flow=login in state`);
  }
  if (decoded?.next_path !== next) {
    fail(`${url} should preserve next_path in state`);
  }
  if (decoded?.app_origin !== origin) {
    fail(`${url} should preserve app_origin=${origin} in state`);
  }
  if (!String(decoded?.redirect_uri || '').trim()) {
    fail(`${url} should preserve redirect_uri in state`);
  }
}

(async () => {
  for (const check of checks) {
    await runCheck(check);
  }

  await verifyLiveGoogleOAuthStart();

  if (errors.length) {
    console.error(errors.map(error => `- ${error}`).join('\n'));
    process.exit(1);
  }

  if (warnings.length) {
    console.warn(warnings.map(warning => `- WARNING: ${warning}`).join('\n'));
  }

  console.log(`Production smoke passed for ${BASE_URL}.`);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
