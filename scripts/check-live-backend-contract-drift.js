const { getLaunchScope } = require('./lib/launch-scope');

const API_BASE_URL = (process.env.WETHUS_API_BASE_URL || 'https://wethus-api.onrender.com').replace(/\/$/, '');
const LAUNCH_SCOPE = getLaunchScope();

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

async function run() {
  let hasFailure = false;

  const { res: healthRes, json: health } = await fetchJson(`${API_BASE_URL}/health`);
  console.log('== /health ==');
  console.log(`URL: ${API_BASE_URL}/health`);
  console.log(`HTTP: ${healthRes.status}`);

  if (healthRes.status !== 200 || !health?.ok) {
    console.log('- FAIL: backend health endpoint is unavailable or invalid');
    process.exit(1);
  }

  const healthChecks = [
    ['service identity', health?.service === 'wethus-backend', `service=${health?.service || 'missing'}`],
    ['build metadata', !!health?.build && typeof health.build === 'object', `build=${health?.build ? 'present' : 'missing'}`],
    ['security object', !!health?.security && typeof health.security === 'object', `security=${health?.security ? 'present' : 'missing'}`],
    ['cloudStateRequireSession key', Object.prototype.hasOwnProperty.call(health?.security || {}, 'cloudStateRequireSession'), `value=${health?.security?.cloudStateRequireSession}`],
    ['integrationsRequireActor key', Object.prototype.hasOwnProperty.call(health?.security || {}, 'integrationsRequireActor'), `value=${health?.security?.integrationsRequireActor}`],
    ['integrationsRequireSession key', Object.prototype.hasOwnProperty.call(health?.security || {}, 'integrationsRequireSession'), `value=${health?.security?.integrationsRequireSession}`],
    ['integrationsEnforceLaunchScope key', Object.prototype.hasOwnProperty.call(health?.security || {}, 'integrationsEnforceLaunchScope'), `value=${health?.security?.integrationsEnforceLaunchScope}`],
    ['projectInteractionsRequireSession key', Object.prototype.hasOwnProperty.call(health?.security || {}, 'projectInteractionsRequireSession'), `value=${health?.security?.projectInteractionsRequireSession}`],
    ['projectAccessRequireMembership key', Object.prototype.hasOwnProperty.call(health?.security || {}, 'projectAccessRequireMembership'), `value=${health?.security?.projectAccessRequireMembership}`]
  ];

  for (const [label, ok, detail] of healthChecks) {
    console.log(`- ${ok ? 'OK' : 'DRIFT'}: ${label} (${detail})`);
    if (!ok) hasFailure = true;
  }

  const { res: providerRes, json: providerPayload } = await fetchJson(`${API_BASE_URL}/integrations/providers`);
  console.log('\n== /integrations/providers ==');
  console.log(`URL: ${API_BASE_URL}/integrations/providers`);
  console.log(`HTTP: ${providerRes.status}`);

  if (providerRes.status !== 200 || !providerPayload?.ok || !Array.isArray(providerPayload?.providers)) {
    console.log('- FAIL: provider catalog endpoint is unavailable or invalid');
    process.exit(1);
  }

  const providerMap = new Map(providerPayload.providers.map((row) => [String(row?.key || '').trim(), row]));
  const contractKeys = [...LAUNCH_SCOPE.launchProviders, ...LAUNCH_SCOPE.deferredProviders];

  for (const key of contractKeys) {
    const row = providerMap.get(key);
    if (!row) {
      console.log(`- DRIFT: missing provider row for ${key}`);
      hasFailure = true;
      continue;
    }

    const expectedPhase = expectedProviderPhase(key);
    const expectedIncluded = expectedPhase === 'launch';
    const checks = [
      ['launchPhase', row.launchPhase === expectedPhase, `expected=${expectedPhase} actual=${row.launchPhase || 'missing'}`],
      ['launchIncluded', row.launchIncluded === expectedIncluded, `expected=${expectedIncluded} actual=${String(row.launchIncluded)}`],
      ['launchNote', !!String(row.launchNote || '').trim(), `actual=${String(row.launchNote || '').trim() ? 'present' : 'missing'}`]
    ];

    for (const [label, ok, detail] of checks) {
      console.log(`- ${ok ? 'OK' : 'DRIFT'}: ${key}.${label} (${detail})`);
      if (!ok) hasFailure = true;
    }
  }

  if (hasFailure) process.exit(1);
  console.log('\nLive backend contract drift check passed.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
