const BASE_URL = (process.env.WETHUS_BASE_URL || 'https://www.wethus.co.kr').replace(/\/$/, '');

const checks = [
  {
    path: '/',
    status: 200,
    includes: ['WETHUS', '모든 학생 창업 프로젝트']
  },
  {
    path: '/opportunities.html',
    status: 200,
    includes: ['includeClosedToggle', '마감 포함', 'includeClosed:false']
  },
  {
    path: '/login.html',
    status: 200,
    includes: ['id="devModeRow" style="display:none;"', 'const allowDevMode = isLocalHost || window.WETHUS_ENABLE_DEV_MODE === true;'],
    excludes: ['\n</html>\ntGoogleSignIn'],
    excludesRegex: [/^\s*tGoogleSignIn\(\);/m, /^\s*nce: true\}\);/m]
  },
  {
    path: '/data/opportunity-published.json',
    status: 200,
    json: true
  },
  {
    path: '/app.js.bak_20260520_1152',
    status: 404
  }
];

const errors = [];

async function runCheck(check) {
  const url = `${BASE_URL}${check.path}`;
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
      if (!Array.isArray(parsed.items)) errors.push(`${url} JSON must contain an items array`);
    } catch (err) {
      errors.push(`${url} returned invalid JSON: ${err.message}`);
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

  console.log(`Production smoke passed for ${BASE_URL}.`);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
