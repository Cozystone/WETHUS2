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
      'function integrationWebhookStatus(integration, providerMeta) {',
      'Webhook을 재발급하면 기존 secret은 즉시 무효화됩니다.',
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
      '관리자 운영 검토',
      'class="js-review-note"',
      'id="opsActionStatus"',
      'const setCardBusy = (card, busy, message) => {',
      '이 메모는 승인/반려 사유로 바로 반영됩니다.'
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

function extractFrontendContractMarker(text) {
  const match = String(text || '').match(/<meta\s+name="wethus-frontend-contract"\s+content="([^"]+)"/i);
  return match ? String(match[1] || '').trim() : '';
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
    const localMarker = extractFrontendContractMarker(localText);

    const url = check.urlPath ? `${BASE_URL}${check.urlPath}` : `${BASE_URL}/${check.file}`;
    const { res, text: liveText } = await fetchText(url);
    const liveNormalized = normalizeText(liveText);
    const liveHash = sha256(liveNormalized);
    const liveMarker = extractFrontendContractMarker(liveText);

    console.log(`\n== ${check.file} ==`);
    console.log(`URL: ${url}`);
    console.log(`HTTP: ${res.status}`);
    for (const key of ['server', 'date', 'last-modified', 'etag', 'cache-control', 'age']) {
      console.log(`${key}: ${res.headers.get(key) || ''}`);
    }
    console.log(`local normalized sha256: ${localHash}`);
    console.log(`live  normalized sha256: ${liveHash}`);
    console.log(`normalized match: ${localHash === liveHash ? 'yes' : 'no'}`);
    if (localMarker || liveMarker) {
      console.log(`frontend contract marker local: ${localMarker || 'missing'}`);
      console.log(`frontend contract marker live : ${liveMarker || 'missing'}`);
    }

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
