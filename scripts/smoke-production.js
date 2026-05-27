const BASE_URL = (process.env.WETHUS_BASE_URL || 'https://www.wethus.co.kr').replace(/\/$/, '');
const API_BASE_URL = (process.env.WETHUS_API_BASE_URL || 'https://wethus-api.onrender.com').replace(/\/$/, '');
const REQUIRE_API_SECURITY_HEADERS = String(process.env.REQUIRE_WETHUS_API_SECURITY_HEADERS || 'false').toLowerCase() === 'true';

const checks = [
  {
    path: '/',
    status: 200,
    includes: ['WETHUS', 'app.js?v=20260527-1811', 'script.js?v=20260527-1612']
  },
  {
    path: '/opportunities.html',
    status: 200,
    includes: ['includeClosedToggle', 'includeClosed:false']
  },
  {
    path: '/login.html',
    status: 200,
    includes: ['app.js?v=20260527-1811', 'id="devModeRow" style="display:none;"', 'const allowDevMode = isLocalHost || window.WETHUS_ENABLE_DEV_MODE === true;'],
    excludes: ['\n</html>\ntGoogleSignIn'],
    excludesRegex: [/^\s*tGoogleSignIn\(\);/m, /^\s*nce: true\}\);/m]
  },
  {
    path: '/founder.html',
    status: 200,
    includes: [
      'app.js?v=20260527-1811',
      "const moderationStatus = moderation.review ? 'manual_review' : 'approved'"
    ]
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
    securityHeaders: true
  },
  {
    path: '/app.js.bak_20260520_1152',
    status: 404
  }
];

const errors = [];
const warnings = [];

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

  if (response.status !== check.status) {
    errors.push(`${url} expected HTTP ${check.status}, got ${response.status}`);
  }

  for (const snippet of check.includes || []) {
    if (!body.includes(snippet)) {
      errors.push(`${url} is missing expected snippet: ${snippet}`);
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

(async () => {
  for (const check of checks) {
    await runCheck(check);
  }

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
