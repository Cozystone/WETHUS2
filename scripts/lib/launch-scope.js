const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const configPath = path.join(repoRoot, 'WETHUS2', 'config', 'launch-scope.json');

function normalizeList(value) {
  if (Array.isArray(value)) {
    return Array.from(new Set(value.map((item) => String(item || '').trim()).filter(Boolean)));
  }
  if (typeof value === 'string') {
    return Array.from(new Set(value.split(',').map((item) => String(item || '').trim()).filter(Boolean)));
  }
  return [];
}

function readLaunchScopeConfig() {
  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(raw);
  } catch (_) {
    return {};
  }
}

function getLaunchScope() {
  const config = readLaunchScopeConfig();
  const envLaunchProviders = normalizeList(process.env.WETHUS_LAUNCH_PROVIDERS || '');
  const envDeferredProviders = normalizeList(process.env.WETHUS_DEFERRED_PROVIDERS || '');

  const launchProviders = envLaunchProviders.length
    ? envLaunchProviders
    : normalizeList(config.launchProviders);
  const deferredProviders = envDeferredProviders.length
    ? envDeferredProviders
    : normalizeList(config.deferredProviders);
  const notes = normalizeList(config.notes);

  return {
    launchProviders,
    deferredProviders,
    notes,
    configPath
  };
}

module.exports = {
  getLaunchScope
};
