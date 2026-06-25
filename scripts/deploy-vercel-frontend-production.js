const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const rootVercelDir = path.join(repoRoot, '.vercel');
const appVercelDir = path.join(repoRoot, 'WETHUS2', '.vercel');
const gitignorePath = path.join(repoRoot, '.gitignore');

const scope = String(process.env.WETHUS_VERCEL_SCOPE || 'anthony-kims-projects-bc874109').trim();
const project = String(process.env.WETHUS_VERCEL_PROJECT || 'wethus-2').trim();
const skipVerify = String(process.env.WETHUS_SKIP_LIVE_FRONTEND_VERIFY || 'false').toLowerCase() === 'true';
const dryRun = String(process.env.WETHUS_VERCEL_DEPLOY_DRY_RUN || 'false').toLowerCase() === 'true';

function runCommand(command, args, options = {}) {
  let resolvedCommand = command;
  let resolvedArgs = args;
  if (process.platform === 'win32' && command === 'vercel') {
    const quote = (value) => {
      const text = String(value || '');
      return /[\s"]/g.test(text) ? `"${text.replace(/"/g, '\\"')}"` : text;
    };
    resolvedCommand = 'cmd.exe';
    resolvedArgs = ['/d', '/s', '/c', ['vercel', ...args].map(quote).join(' ')];
  }
  const result = spawnSync(resolvedCommand, resolvedArgs, {
    cwd: options.cwd || repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
    env: { ...process.env, ...(options.env || {}) }
  });
  const stdout = String(result.stdout || '');
  const stderr = String(result.stderr || '');
  if (stdout.trim()) process.stdout.write(stdout);
  if (stderr.trim()) process.stderr.write(stderr);
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status}`);
  }
  return { stdout, stderr };
}

function removeDirIfExists(target) {
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
  }
}

function main() {
  const rootVercelExisted = fs.existsSync(rootVercelDir);
  const appVercelExisted = fs.existsSync(appVercelDir);
  const originalGitignore = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf8') : null;

  console.log('WETHUS Vercel frontend production deploy');
  console.log(`repo root: ${repoRoot}`);
  console.log(`project: ${scope}/${project}`);
  console.log(`mode: ${dryRun ? 'dry-run' : 'production deploy'}`);

  try {
    runCommand('vercel', ['--version']);
    runCommand('vercel', ['whoami']);
    runCommand('vercel', ['project', 'inspect', project, '--scope', scope]);

    if (!fs.existsSync(path.join(rootVercelDir, 'project.json'))) {
      console.log('\nLinking repo root to the Vercel project...');
      runCommand('vercel', ['link', '--yes', '--project', project, '--scope', scope], { cwd: repoRoot });
    } else {
      console.log('\nExisting repo-root Vercel link detected.');
    }

    if (!dryRun) {
      console.log('\nDeploying current repo root to Vercel production...');
      runCommand('vercel', ['deploy', '--prod', '--yes', '--scope', scope], { cwd: repoRoot });
    } else {
      console.log('\nDry-run enabled: skipping `vercel deploy --prod`.');
    }

    if (!skipVerify) {
      console.log('\nVerifying live frontend drift...');
      runCommand(process.execPath, ['scripts/check-live-frontend-drift.js'], { cwd: repoRoot });
    } else {
      console.log('\nLive frontend drift verification skipped by env.');
    }

    console.log('\nFrontend production deploy flow completed.');
  } finally {
    if (!rootVercelExisted) removeDirIfExists(rootVercelDir);
    if (!appVercelExisted) removeDirIfExists(appVercelDir);
    if (originalGitignore !== null && fs.existsSync(gitignorePath)) {
      const currentGitignore = fs.readFileSync(gitignorePath, 'utf8');
      if (currentGitignore !== originalGitignore) {
        fs.writeFileSync(gitignorePath, originalGitignore, 'utf8');
      }
    }
  }
}

try {
  main();
} catch (error) {
  console.error(error.message || error);
  process.exit(1);
}
