const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const envExamplePath = path.join(repoRoot, 'WETHUS2', 'backend', '.env.example');
const renderYamlPath = path.join(repoRoot, 'render.yaml');

const requiredKeys = [
  'JWT_SECRET',
  'TOKEN_ENCRYPTION_KEY',
  'ADMIN_EMAIL',
  'ADMIN_BOOTSTRAP_PASSWORD',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'ALLOWED_ORIGINS',
  'AI_PROVIDER',
  'OPENAI_API_KEY',
  'OPENAI_MODEL',
  'INTEGRATION_APP_URL',
  'GOOGLE_OAUTH_CLIENT_ID',
  'GOOGLE_OAUTH_CLIENT_SECRET',
  'GOOGLE_OAUTH_REDIRECT_URI',
  'GOOGLE_OAUTH_REDIRECT_URIS',
  'GOOGLE_LOGIN_REDIRECT_URI',
  'GOOGLE_LOGIN_REDIRECT_URIS',
  'NAVER_CLIENT_ID',
  'NAVER_CLIENT_SECRET',
  'NAVER_LOGIN_REDIRECT_URI',
  'NAVER_LOGIN_REDIRECT_URIS',
  'KAKAO_CLIENT_ID',
  'KAKAO_CLIENT_SECRET',
  'KAKAO_LOGIN_REDIRECT_URI',
  'KAKAO_LOGIN_REDIRECT_URIS',
  'NOTION_CLIENT_ID',
  'NOTION_CLIENT_SECRET',
  'NOTION_REDIRECT_URI',
  'SLACK_CLIENT_ID',
  'SLACK_CLIENT_SECRET',
  'SLACK_REDIRECT_URI',
  'FIGMA_CLIENT_ID',
  'FIGMA_CLIENT_SECRET',
  'FIGMA_REDIRECT_URI',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'GITHUB_REDIRECT_URI',
  'DISCORD_CLIENT_ID',
  'DISCORD_CLIENT_SECRET',
  'DISCORD_REDIRECT_URI',
  'GOOGLE_CALENDAR_CLIENT_ID',
  'GOOGLE_CALENDAR_CLIENT_SECRET',
  'GOOGLE_CALENDAR_REDIRECT_URI',
  'AIRTABLE_CLIENT_ID',
  'AIRTABLE_CLIENT_SECRET',
  'AIRTABLE_REDIRECT_URI',
  'WETHUS_LAUNCH_PROVIDERS',
  'WETHUS_DEFERRED_PROVIDERS',
  'CLOUD_STATE_REQUIRE_SESSION',
  'INTEGRATIONS_REQUIRE_ACTOR',
  'INTEGRATIONS_REQUIRE_SESSION',
  'INTEGRATIONS_ENFORCE_LAUNCH_SCOPE',
  'PROJECT_INTERACTIONS_REQUIRE_SESSION',
  'PROJECT_ACCESS_REQUIRE_MEMBERSHIP',
  'DM_REQUIRE_SESSION'
];

function readEnvKeys(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  return new Set(
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => line.split('=')[0].trim())
      .filter(Boolean)
  );
}

function readRenderKeys(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  return new Set(
    [...text.matchAll(/^\s*-\s+key:\s+([A-Z0-9_]+)/gm)]
      .map((match) => String(match[1] || '').trim())
      .filter(Boolean)
  );
}

const envKeys = readEnvKeys(envExamplePath);
const renderKeys = readRenderKeys(renderYamlPath);
const errors = [];
const warnings = [];

for (const key of requiredKeys) {
  if (!envKeys.has(key)) errors.push(`.env.example is missing required key ${key}`);
  if (!renderKeys.has(key)) errors.push(`render.yaml is missing required key ${key}`);
}

for (const key of renderKeys) {
  if (!envKeys.has(key) && key !== 'NODE_ENV') {
    warnings.push(`render.yaml declares ${key} but .env.example does not mention it`);
  }
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exit(1);
}

if (warnings.length) {
  console.warn(warnings.map((warning) => `- WARNING: ${warning}`).join('\n'));
}

console.log('Deploy config parity passed.');
