const { spawnSync } = require('child_process');
const { analyzeRenderEnvSync } = require('./lib/render-env-sync');

const API_BASE_URL = (process.env.WETHUS_API_BASE_URL || 'https://wethus-api.onrender.com').replace(/\/$/, '');

function runGit(args) {
  const result = spawnSync('git', args, {
    cwd: require('path').resolve(__dirname, '..'),
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

(async () => {
  const sourceHead = runGit(['rev-parse', 'HEAD']);
  const { res, json } = await fetchJson(`${API_BASE_URL}/health`);
  if (!res.ok || !json?.ok) {
    console.error(`- unable to read ${API_BASE_URL}/health`);
    process.exit(1);
  }

  const analysis = analyzeRenderEnvSync(json.security || {}, json?.build?.commit || '', sourceHead);

  console.log(`Render env sync check for ${API_BASE_URL}`);
  console.log(`- source HEAD: ${sourceHead}`);
  console.log(`- live build: ${json?.build?.ref || '-'} ${json?.build?.commit || '-'}`);
  console.log(`- build matches source: ${analysis.buildMatchesSource ? 'yes' : 'no'}`);

  if (!analysis.mismatches.length) {
    console.log('- render.yaml security defaults match live /health flags');
    process.exit(0);
  }

  analysis.mismatches.forEach((item) => {
    console.log(`- DRIFT: ${item.envKey} desired=${item.desired} actual=${item.actual}`);
  });

  if (analysis.envSyncPending) {
    console.log('- ACTION: live backend code is current, but Render env values are not yet synced to the render.yaml blueprint');
    console.log('- ACTION: update the saved Render service env values or resync blueprint settings, then redeploy');
  }

  process.exit(1);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
