const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const stylesFile = path.join(repoRoot, 'WETHUS2', 'styles.css');
const hubFile = path.join(repoRoot, 'WETHUS2', 'project-hub.html');
const failures = [];

function fail(message) {
  failures.push(message);
}

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function expectRegex(text, regex, message) {
  if (!regex.test(text)) fail(message);
}

const styles = read(stylesFile);
const hub = read(hubFile);

expectRegex(
  styles,
  /@media\s*\(max-width:\s*760px\)\s*\{[\s\S]*?\.nav-links\s*\{[\s\S]*?row-gap:\s*10px;[\s\S]*?flex-wrap:\s*wrap;[\s\S]*?overflow:\s*visible;[\s\S]*?padding-bottom:\s*0;/,
  'styles.css mobile nav breakpoint must wrap nav links instead of relying on horizontal scrolling'
);

expectRegex(
  styles,
  /@media\s*\(max-width:\s*760px\)\s*\{[\s\S]*?\.nav-links\s+\.js-profile-chip,\s*[\s\S]*?\.nav-links\s+\.js-side-menu\s*\{[\s\S]*?margin-left:\s*0;[\s\S]*?margin-right:\s*0;/,
  'styles.css mobile nav breakpoint must reset injected profile/menu margins'
);

expectRegex(
  hub,
  /\.hub-item--project\{display:flex;gap:10px;align-items:flex-start;min-width:0\}/,
  'project-hub.html must define the responsive project-list card shell'
);

expectRegex(
  hub,
  /\.hub-item-summary\{margin:0;color:#d4d4d4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap\}/,
  'project-hub.html must define the project-list summary clamp base style'
);

expectRegex(
  hub,
  /@media\s*\(max-width:640px\)\s*\{[\s\S]*?\.hub-head-left\{flex-direction:column;align-items:stretch;min-width:0\}[\s\S]*?\.hub-actions\{grid-template-columns:1fr\}[\s\S]*?\.hub-item--project\{flex-direction:column\}/,
  'project-hub.html mobile breakpoint must stack the detail header and project cards vertically'
);

expectRegex(
  hub,
  /hubProjectList\.innerHTML\s*=\s*list\.map\(p=>`<article class="hub-item hub-item--project"/,
  'project-hub.html project-list renderer must use the responsive project card classes'
);

if (failures.length) {
  console.error('Mobile commercial UI smoke failures:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Mobile commercial UI smoke passed.');
