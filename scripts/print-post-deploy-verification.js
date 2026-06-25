const verificationEnv = {
  REQUIRE_WETHUS_API_SECURITY_HEADERS: 'true',
  REQUIRE_WETHUS_API_HEALTH_METADATA: 'true',
  REQUIRE_WETHUS_API_SECURITY_FLAGS: 'true',
  REQUIRE_WETHUS_BACKEND_CONTRACTS: 'true',
  REQUIRE_WETHUS_FRONTEND_HUB_CONTRACTS: 'true',
  WETHUS_GATE_STRICT_PRODUCTION: 'true'
};

function printHeader(title) {
  console.log(`\n## ${title}`);
}

function printLines(lines) {
  lines.forEach((line) => console.log(`- ${line}`));
}

function printPowerShellEnv(env) {
  for (const [key, value] of Object.entries(env)) {
    console.log(`$env:${key}='${value}'`);
  }
}

console.log('WETHUS post-deploy verification');
console.log('Use this checklist immediately after a frontend deploy, backend deploy, or security-flag rollout.');

printHeader('1. Fast drift checks');
printLines([
  'node scripts/check-live-frontend-drift.js',
  'node scripts/check-live-backend-contract-drift.js',
  'Pass condition: both commands report clean parity on every checked page and backend surface.'
]);

printHeader('2. Production smoke');
printLines([
  'node scripts/smoke-production.js',
  'Pass condition: homepage, explore, backend health, provider metadata, and required security headers all pass.'
]);

printHeader('3. Commercialization audit');
printLines([
  'node scripts/audit-commercial-readiness.js',
  'node scripts/print-production-rollout-status.js',
  'Pass condition: no blockers remain, and rollout status no longer recommends missing deploys or disabled flags.'
]);

printHeader('4. Strict launch-grade gate');
printLines([
  'Set the strict verification env vars below, then run node scripts/run-commercial-gate.js',
  'Pass condition: deploy-source readiness, local validation, live frontend parity, live backend parity, commercialization audit, and strict production smoke all pass in one run.'
]);

console.log('\nPowerShell:');
printPowerShellEnv(verificationEnv);
console.log('node scripts\\run-commercial-gate.js');

console.log('\nBash:');
console.log(
  Object.entries(verificationEnv)
    .map(([key, value]) => `${key}=${value}`)
    .join(' ') + ' node scripts/run-commercial-gate.js'
);

printHeader('5. Browser acceptance follow-up');
printLines([
  'Verify founder submit -> moderation -> explore visibility -> home gallery reflection.',
  'Verify login return flow from login.html and project-hub.html.',
  'Verify likes, bookmarks, comments, applications, and leader review actions with at least two accounts.',
  'Verify deferred providers remain blocked and launch providers remain connectable.'
]);
