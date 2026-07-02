const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const repoRoot = path.resolve(__dirname, '..');
const backendRoot = path.join(repoRoot, 'WETHUS2', 'backend');
const port = Number(process.env.WETHUS_GOOGLE_OAUTH_SMOKE_PORT || 8900);
const baseUrl = `http://127.0.0.1:${port}`;
const errors = [];

function fail(message) {
  errors.push(message);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stopChild(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return Promise.resolve();
  return new Promise((resolve) => {
    const timeout = setTimeout(resolve, 3000);
    child.once('exit', () => {
      clearTimeout(timeout);
      resolve();
    });
    child.kill();
  });
}

async function waitForServer(child, logs) {
  for (let i = 0; i < 40; i += 1) {
    if (child.exitCode !== null) break;
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) return;
    } catch (_) {}
    await sleep(250);
  }
  throw new Error(`backend did not start on ${baseUrl}\n${logs.text}`);
}

async function getJson(url) {
  const response = await fetch(url, { redirect: 'manual' });
  const payload = await response.json().catch(() => ({}));
  return { response, payload };
}

async function verifyGoogleConfig() {
  const { response, payload } = await getJson(`${baseUrl}/auth/google/config`);
  if (response.status !== 200) {
    fail(`/auth/google/config should return 200, got ${response.status}`);
    return;
  }
  if (payload?.ok !== true) fail('/auth/google/config should return ok=true');
  if (String(payload?.clientId || '').trim() !== 'google-client-id-for-smoke') {
    fail('/auth/google/config should expose the configured Google client ID');
  }
}

async function verifySocialProviderConfig() {
  const providers = [
    ['naver', 'naver-client-id-for-smoke', true],
    ['kakao', 'kakao-client-id-for-smoke', true]
  ];
  for (const [provider, expectedClientId, expectedReady] of providers) {
    const { response, payload } = await getJson(`${baseUrl}/auth/${provider}/config`);
    if (response.status !== 200) {
      fail(`/auth/${provider}/config should return 200, got ${response.status}`);
      continue;
    }
    if (payload?.ok !== true) fail(`/auth/${provider}/config should return ok=true`);
    if (payload?.ready !== expectedReady) fail(`/auth/${provider}/config should expose ready=${expectedReady}`);
    if (String(payload?.clientId || '').trim() !== expectedClientId) {
      fail(`/auth/${provider}/config should expose the configured client ID`);
    }
  }
}

async function verifyGoogleStartRedirect() {
  const origin = 'https://www.wethus.co.kr';
  const response = await fetch(`${baseUrl}/auth/google/start?next=%2Fproject-hub.html%3FprojectId%3Ddemo`, {
    redirect: 'manual',
    headers: {
      origin
    }
  });

  if (response.status !== 302) {
    fail(`/auth/google/start should return 302 redirect, got ${response.status}`);
    return;
  }

  const location = String(response.headers.get('location') || '').trim();
  if (!location) {
    fail('/auth/google/start should include a Location header');
    return;
  }

  let redirectUrl;
  try {
    redirectUrl = new URL(location);
  } catch {
    fail(`/auth/google/start returned an invalid redirect URL: ${location}`);
    return;
  }

  if (redirectUrl.origin !== 'https://accounts.google.com') {
    fail(`/auth/google/start should redirect to Google Accounts, got ${redirectUrl.origin}`);
  }
  if (redirectUrl.pathname !== '/o/oauth2/v2/auth') {
    fail(`/auth/google/start should use the Google OAuth v2 path, got ${redirectUrl.pathname}`);
  }
  if (redirectUrl.searchParams.get('client_id') !== 'google-oauth-client-id-for-smoke') {
    fail('/auth/google/start should use the configured GOOGLE_OAUTH_CLIENT_ID');
  }
  if (redirectUrl.searchParams.get('redirect_uri') !== 'https://www.wethus.co.kr/auth/google/callback') {
    fail('/auth/google/start should use the configured login redirect URI');
  }
  if (redirectUrl.searchParams.get('response_type') !== 'code') {
    fail('/auth/google/start should request response_type=code');
  }
  if (redirectUrl.searchParams.get('scope') !== 'openid email profile') {
    fail('/auth/google/start should request openid email profile scope');
  }
  if (redirectUrl.searchParams.get('prompt') !== 'select_account') {
    fail('/auth/google/start should request prompt=select_account');
  }

  const state = String(redirectUrl.searchParams.get('state') || '').trim();
  if (!state) {
    fail('/auth/google/start should include encoded state');
    return;
  }

  let decoded = null;
  try {
    decoded = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
  } catch {
    fail('/auth/google/start state should be base64url JSON');
    return;
  }

  if (decoded?.auth_flow !== 'login') fail('google start state should preserve auth_flow=login');
  if (decoded?.next_path !== '/project-hub.html?projectId=demo') fail('google start state should preserve sanitized next_path');
  if (decoded?.app_origin !== origin) fail('google start state should preserve the allowed app origin');
  if (decoded?.redirect_uri !== 'https://www.wethus.co.kr/auth/google/callback') fail('google start state should preserve redirect_uri');
}

async function verifyNaverStartRedirect() {
  const origin = 'https://www.wethus.co.kr';
  const response = await fetch(`${baseUrl}/auth/naver/start?next=%2Fprofile.html`, {
    redirect: 'manual',
    headers: { origin }
  });
  if (response.status !== 302) {
    fail(`/auth/naver/start should return 302 redirect, got ${response.status}`);
    return;
  }
  const location = String(response.headers.get('location') || '').trim();
  const redirectUrl = new URL(location);
  if (redirectUrl.origin !== 'https://nid.naver.com') fail(`/auth/naver/start should redirect to Naver, got ${redirectUrl.origin}`);
  if (redirectUrl.pathname !== '/oauth2.0/authorize') fail(`/auth/naver/start should use authorize endpoint, got ${redirectUrl.pathname}`);
  if (redirectUrl.searchParams.get('client_id') !== 'naver-client-id-for-smoke') fail('/auth/naver/start should use configured NAVER_CLIENT_ID');
  if (redirectUrl.searchParams.get('redirect_uri') !== 'https://www.wethus.co.kr/auth/naver/callback') fail('/auth/naver/start should use configured redirect URI');
  if (redirectUrl.searchParams.get('response_type') !== 'code') fail('/auth/naver/start should request response_type=code');
  const decoded = JSON.parse(Buffer.from(redirectUrl.searchParams.get('state') || '', 'base64url').toString('utf8'));
  if (decoded?.provider !== 'naver') fail('naver start state should preserve provider=naver');
  if (decoded?.next_path !== '/profile.html') fail('naver start state should preserve next_path');
}

async function verifyKakaoStartRedirect() {
  const origin = 'https://www.wethus.co.kr';
  const response = await fetch(`${baseUrl}/auth/kakao/start?next=%2Fprofile.html`, {
    redirect: 'manual',
    headers: { origin }
  });
  if (response.status !== 302) {
    fail(`/auth/kakao/start should return 302 redirect, got ${response.status}`);
    return;
  }
  const location = String(response.headers.get('location') || '').trim();
  const redirectUrl = new URL(location);
  if (redirectUrl.origin !== 'https://kauth.kakao.com') fail(`/auth/kakao/start should redirect to Kakao, got ${redirectUrl.origin}`);
  if (redirectUrl.pathname !== '/oauth/authorize') fail(`/auth/kakao/start should use authorize endpoint, got ${redirectUrl.pathname}`);
  if (redirectUrl.searchParams.get('client_id') !== 'kakao-client-id-for-smoke') fail('/auth/kakao/start should use configured KAKAO_CLIENT_ID');
  if (redirectUrl.searchParams.get('redirect_uri') !== 'https://www.wethus.co.kr/auth/kakao/callback') fail('/auth/kakao/start should use configured redirect URI');
  if (redirectUrl.searchParams.get('response_type') !== 'code') fail('/auth/kakao/start should request response_type=code');
  const decoded = JSON.parse(Buffer.from(redirectUrl.searchParams.get('state') || '', 'base64url').toString('utf8'));
  if (decoded?.provider !== 'kakao') fail('kakao start state should preserve provider=kakao');
  if (decoded?.next_path !== '/profile.html') fail('kakao start state should preserve next_path');
}

async function verifyGoogleCallbackGuard() {
  const response = await fetch(`${baseUrl}/auth/google/callback`, { redirect: 'manual' });
  const body = await response.text();
  if (response.status !== 400) {
    fail(`/auth/google/callback without code should return 400, got ${response.status}`);
    return;
  }
  if (!body.includes('code missing')) {
    fail('/auth/google/callback without code should explain that code is missing');
  }
}

(async () => {
  const logs = { text: '' };
  const smokeDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wethus-google-oauth-smoke-'));
  let child;

  try {
    child = spawn(process.execPath, ['server.js'], {
      cwd: backendRoot,
      env: {
        ...process.env,
        PORT: String(port),
        WETHUS_DATA_DIR: smokeDataDir,
        RATE_LIMIT_DISABLED: 'true',
        PUBLIC_APP_URL: 'https://www.wethus.co.kr',
        INTEGRATION_APP_URL: `http://127.0.0.1:${port}`,
        ALLOWED_ORIGINS: 'https://www.wethus.co.kr,http://127.0.0.1:8080',
        GOOGLE_CLIENT_ID: 'google-client-id-for-smoke',
        GOOGLE_CLIENT_SECRET: 'google-client-secret-for-smoke',
        GOOGLE_OAUTH_CLIENT_ID: 'google-oauth-client-id-for-smoke',
        GOOGLE_OAUTH_CLIENT_SECRET: 'google-oauth-client-secret-for-smoke',
        GOOGLE_OAUTH_REDIRECT_URI: 'https://www.wethus.co.kr/oauth/google/callback',
        GOOGLE_LOGIN_REDIRECT_URI: 'https://www.wethus.co.kr/auth/google/callback',
        NAVER_CLIENT_ID: 'naver-client-id-for-smoke',
        NAVER_CLIENT_SECRET: 'naver-client-secret-for-smoke',
        NAVER_LOGIN_REDIRECT_URI: 'https://www.wethus.co.kr/auth/naver/callback',
        KAKAO_CLIENT_ID: 'kakao-client-id-for-smoke',
        KAKAO_CLIENT_SECRET: 'kakao-client-secret-for-smoke',
        KAKAO_LOGIN_REDIRECT_URI: 'https://www.wethus.co.kr/auth/kakao/callback'
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    child.stdout.on('data', (data) => { logs.text += data.toString(); });
    child.stderr.on('data', (data) => { logs.text += data.toString(); });

    await waitForServer(child, logs);
    await verifyGoogleConfig();
    await verifySocialProviderConfig();
    await verifyGoogleStartRedirect();
    await verifyNaverStartRedirect();
    await verifyKakaoStartRedirect();
    await verifyGoogleCallbackGuard();
  } finally {
    await stopChild(child);
    fs.rmSync(smokeDataDir, { recursive: true, force: true });
  }

  if (errors.length) {
    console.error(errors.map((error) => `- ${error}`).join('\n'));
    process.exit(1);
  }

  console.log('Google OAuth login smoke passed.');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
