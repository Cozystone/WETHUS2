const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const appRoot = path.join(repoRoot, 'WETHUS2');
const errors = [];

function fail(message) {
  errors.push(message);
}

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function countMatches(text, pattern) {
  return (text.match(pattern) || []).length;
}

function activeOpportunityCount(items) {
  const now = Date.now();
  return items.filter(item => {
    const raw = String(item?.deadline || item?.applyEnd || '').trim();
    const date = raw ? new Date(`${raw}T23:59:59+09:00`) : null;
    return date && !Number.isNaN(date.getTime()) && date.getTime() >= now;
  }).length;
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name === 'node_modules') continue;
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function validateRenderBlueprint() {
  const file = path.join(repoRoot, 'render.yaml');
  if (!fs.existsSync(file)) {
    fail('render.yaml must exist at repo root to pin the Render backend deploy root');
    return;
  }

  const text = read(file);
  const requiredSnippets = [
    'services:',
    'type: web',
    'name: wethus-api',
    'runtime: node',
    'rootDir: WETHUS2/backend',
    'buildCommand: npm ci',
    'startCommand: npm start',
    'healthCheckPath: /health',
    'key: NODE_ENV',
    'value: production',
    'key: ALLOWED_ORIGINS',
    'https://wethus.co.kr,https://www.wethus.co.kr'
  ];
  for (const snippet of requiredSnippets) {
    if (!text.includes(snippet)) fail(`render.yaml must include: ${snippet}`);
  }

  const secretKeys = [
    'JWT_SECRET',
    'ADMIN_BOOTSTRAP_PASSWORD',
    'GOOGLE_CLIENT_ID',
    'OPENAI_API_KEY'
  ];
  for (const key of secretKeys) {
    const blockMatch = text.match(new RegExp(`-\\s+key:\\s*${key}\\n((?:\\s{8}.+\\n?)*)`));
    const block = blockMatch ? blockMatch[0] : '';
    if (!block) {
      fail(`render.yaml must declare secret ${key}`);
      continue;
    }
    if (!/sync:\s*false/.test(block)) fail(`render.yaml secret ${key} must use sync: false`);
    if (/\n\s+value:\s*/.test(block)) fail(`render.yaml secret ${key} must not have a committed value`);
  }
}

validateRenderBlueprint();

if (!fs.existsSync(appRoot)) {
  fail(`Missing app root: ${path.relative(repoRoot, appRoot)}`);
} else {
  const exposedBackups = path.join(appRoot, 'backups');
  if (fs.existsSync(exposedBackups)) {
    fail('WETHUS2/backups must not exist under the deploy root');
  }

  for (const name of fs.readdirSync(appRoot)) {
    if (/\.bak_|\.bak$/.test(name)) {
      fail(`Backup artifact is exposed from deploy root: WETHUS2/${name}`);
    }
  }

  for (const file of walk(appRoot)) {
    const rel = path.relative(repoRoot, file).replace(/\\/g, '/');
    if (rel.includes('/docs/change-log/')) continue;
    if (/\.bak_|\.bak$/.test(path.basename(file))) {
      fail(`Backup artifact is exposed from deploy root: ${rel}`);
      continue;
    }

    if (file.endsWith('.json')) {
      try {
        JSON.parse(read(file));
      } catch (err) {
        fail(`Invalid JSON in ${rel}: ${err.message}`);
      }
    }

    if (file.endsWith('.html')) {
      const text = read(file);
      const htmlClose = countMatches(text, /^\s*<\/html>\s*$/gm);
      const bodyClose = countMatches(text, /^\s*<\/body>\s*$/gm);
      if (htmlClose !== 1) fail(`${rel} must contain exactly one </html>; found ${htmlClose}`);
      if (bodyClose !== 1) fail(`${rel} must contain exactly one </body>; found ${bodyClose}`);

      const afterHtml = text.slice(text.lastIndexOf('</html>') + '</html>'.length).trim();
      if (afterHtml) fail(`${rel} has trailing content after </html>`);

      if (/^\s*tGoogleSignIn\(|^\s*nce: true\}\);/m.test(text)) {
        fail(`${rel} contains known leaked script fragments`);
      }
    }
  }

  const login = path.join(appRoot, 'login.html');
  if (fs.existsSync(login)) {
    const text = read(login);
    if (!/id="devModeRow"\s+style="display:none;"/.test(text)) {
      fail('login.html must keep dev mode hidden by default in production markup');
    }
    if (!/const allowDevMode = isLocalHost \|\| window\.WETHUS_ENABLE_DEV_MODE === true;/.test(text)) {
      fail('login.html must gate dev mode to localhost or explicit opt-in');
    }
  }

  const opportunities = path.join(appRoot, 'opportunities.html');
  if (fs.existsSync(opportunities)) {
    const text = read(opportunities);
    if (!text.includes('id="includeClosedToggle"')) {
      fail('opportunities.html must expose the expired-opportunity toggle');
    }
    if (!text.includes('includeClosed:false')) {
      fail('opportunities.html must hide expired opportunities by default');
    }
    if (!text.includes('!state.includeClosed&&isClosed(o)')) {
      fail('opportunities.html must filter expired opportunities unless opted in');
    }
  }

  const publishedFeed = path.join(appRoot, 'data', 'opportunity-published.json');
  if (fs.existsSync(publishedFeed)) {
    const data = JSON.parse(read(publishedFeed));
    const items = Array.isArray(data.items) ? data.items : [];
    const activeCount = activeOpportunityCount(items);
    if (activeCount < 1) {
      fail('opportunity-published.json must contain at least one non-expired opportunity');
    }
  }
}

if (errors.length) {
  console.error(errors.map(error => `- ${error}`).join('\n'));
  process.exit(1);
}

console.log('Static validation passed.');
