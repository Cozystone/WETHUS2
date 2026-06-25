const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BASE_URL = (process.env.WETHUS_BASE_URL || 'https://www.wethus.co.kr').replace(/\/$/, '');
const appRoot = path.join(__dirname, '..', 'WETHUS2');

const checks = [
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
      'mergedProjectTimeline(80)',
      'id="hubWebhookModal"',
      'function sendWebhookTestEvent()',
      'data-tool-webhook'
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

function sha256(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function normalizeText(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchText(url) {
  const res = await fetch(url, { redirect: 'follow' });
  const text = await res.text();
  return { res, text };
}

async function run() {
  let hasFailure = false;

  for (const check of checks) {
    const localPath = path.join(appRoot, check.file);
    const localText = fs.readFileSync(localPath, 'utf8');
    const localNormalized = normalizeText(localText);
    const localHash = sha256(localNormalized);

    const url = check.urlPath ? `${BASE_URL}${check.urlPath}` : `${BASE_URL}/${check.file}`;
    const { res, text: liveText } = await fetchText(url);
    const liveNormalized = normalizeText(liveText);
    const liveHash = sha256(liveNormalized);

    console.log(`\n== ${check.file} ==`);
    console.log(`URL: ${url}`);
    console.log(`HTTP: ${res.status}`);
    for (const key of ['server', 'date', 'last-modified', 'etag', 'cache-control', 'age']) {
      console.log(`${key}: ${res.headers.get(key) || ''}`);
    }
    console.log(`local normalized sha256: ${localHash}`);
    console.log(`live  normalized sha256: ${liveHash}`);
    console.log(`normalized match: ${localHash === liveHash ? 'yes' : 'no'}`);

    if (res.status !== 200) {
      console.log(`- FAIL: live page returned HTTP ${res.status}`);
      hasFailure = true;
      continue;
    }

    for (const snippet of check.snippets) {
      const localHas = localText.includes(snippet);
      const liveHas = liveText.includes(snippet);
      const status = localHas === liveHas ? 'OK' : 'DRIFT';
      console.log(`- ${status}: ${snippet}`);
      console.log(`  local=${localHas} live=${liveHas}`);
      if (localHas !== liveHas) hasFailure = true;
    }
  }

  if (hasFailure) {
    process.exit(1);
  }

  console.log('\nLive frontend drift check passed.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
