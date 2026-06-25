const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const defaultFeedPath = path.join(repoRoot, 'WETHUS2', 'data', 'opportunity-published.json');
const KST_TIME_ZONE = 'Asia/Seoul';

function formatKstIso(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: KST_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(date).reduce((acc, part) => {
    if (part.type !== 'literal') acc[part.type] = part.value;
    return acc;
  }, {});
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}+09:00`;
}

function kstToday() {
  return formatKstIso(new Date()).slice(0, 10);
}

function parseArgs(argv) {
  const out = {
    input: defaultFeedPath,
    output: defaultFeedPath,
    updatedAt: formatKstIso(new Date()),
    today: null,
    includeExpired: false,
    max: 0
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--input' && argv[i + 1]) out.input = path.resolve(repoRoot, argv[++i]);
    else if (arg === '--output' && argv[i + 1]) out.output = path.resolve(repoRoot, argv[++i]);
    else if (arg === '--updated-at' && argv[i + 1]) out.updatedAt = argv[++i];
    else if (arg === '--today' && argv[i + 1]) out.today = argv[++i];
    else if (arg === '--include-expired') out.includeExpired = true;
    else if (arg === '--max' && argv[i + 1]) out.max = Math.max(0, Number(argv[++i]) || 0);
    else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return out;
}

function printHelp() {
  console.log([
    'Usage: node scripts/publish-opportunity-feed.js [options]',
    '',
    'Options:',
    '  --input <path>       source JSON file (default: WETHUS2/data/opportunity-published.json)',
    '  --output <path>      output JSON file (default: same as input)',
    '  --updated-at <iso>   updatedAt value to write (default: current time)',
    '  --today <yyyy-mm-dd> reference date for status inference',
    '  --include-expired    keep closed opportunities in the published feed',
    '  --max <n>            limit the number of output items after sorting',
    '  --help               show this help'
  ].join('\n'));
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function asString(value) {
  return String(value ?? '').trim();
}

function asArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => asString(item)).filter(Boolean);
  }
  const single = asString(value);
  return single ? [single] : [];
}

function normalizeDate(value) {
  const raw = asString(value);
  if (!raw) return null;
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) return raw;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function dateRank(value) {
  const normalized = normalizeDate(value);
  if (!normalized) return Number.POSITIVE_INFINITY;
  const time = new Date(`${normalized}T23:59:59+09:00`).getTime();
  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time;
}

function inferStatus(item, today) {
  const explicit = asString(item.status).toLowerCase();
  const deadline = normalizeDate(item.deadline || item.applyEnd);
  if (deadline) {
    const deadlineTime = new Date(`${deadline}T23:59:59+09:00`).getTime();
    const todayTime = new Date(`${today}T00:00:00+09:00`).getTime();
    if (!Number.isNaN(deadlineTime) && !Number.isNaN(todayTime)) {
      return deadlineTime < todayTime ? 'closed' : 'open';
    }
  }
  if (explicit === 'candidate') return 'open';
  if (explicit === 'approved' || explicit === 'open') return 'open';
  if (explicit === 'closed') return 'closed';
  return explicit || 'unknown';
}

function slugify(value) {
  return asString(value)
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function normalizeItem(item, index, today) {
  const title = asString(item.title);
  const organizer = asString(item.organizer);
  const deadline = normalizeDate(item.deadline || item.applyEnd);
  const applyStart = normalizeDate(item.applyStart);
  const applyEnd = normalizeDate(item.applyEnd || item.deadline);
  const judgeStart = normalizeDate(item.judgeStart);
  const judgeEnd = normalizeDate(item.judgeEnd);
  const resultDate = normalizeDate(item.resultDate);
  const dedupeKey = asString(item.dedupe_key) || [title, organizer, deadline || 'no-deadline'].join('|');
  const id = asString(item.id) || slugify(dedupeKey) || `opportunity-${index + 1}`;

  return {
    id,
    title,
    organizer,
    deadline,
    type: asString(item.type) || 'startup-support',
    eligibility: Array.isArray(item.eligibility) ? asArray(item.eligibility).join(', ') : asString(item.eligibility),
    teamRequirement: asString(item.teamRequirement),
    tags: asArray(item.tags),
    benefits: asArray(item.benefits),
    official_url: asString(item.official_url),
    source_name: asString(item.source_name),
    source_url: asString(item.source_url || item.official_url),
    summary: asString(item.summary),
    status: inferStatus(item, today),
    dedupe_key: dedupeKey,
    applyStart,
    applyEnd,
    judgeStart,
    judgeEnd,
    resultDate
  };
}

function validItem(item) {
  return item.title && item.organizer && item.official_url;
}

function publish() {
  const args = parseArgs(process.argv.slice(2));
  const today = normalizeDate(args.today) || kstToday();
  const updatedAt = new Date(args.updatedAt);
  if (Number.isNaN(updatedAt.getTime())) {
    throw new Error(`Invalid --updated-at value: ${args.updatedAt}`);
  }

  const source = readJson(args.input);
  const items = Array.isArray(source.items) ? source.items : [];
  const dedupe = new Map();

  items
    .map((item, index) => normalizeItem(item, index, today))
    .filter(validItem)
    .forEach((item) => {
      const key = item.dedupe_key;
      const existing = dedupe.get(key);
      if (!existing) {
        dedupe.set(key, item);
        return;
      }
      if (dateRank(item.deadline) < dateRank(existing.deadline)) {
        dedupe.set(key, item);
      }
    });

  let published = Array.from(dedupe.values())
    .filter((item) => args.includeExpired || item.status !== 'closed')
    .sort((a, b) => {
      const deadlineDelta = dateRank(a.deadline) - dateRank(b.deadline);
      if (deadlineDelta !== 0) return deadlineDelta;
      return a.title.localeCompare(b.title, 'ko');
    });

  if (args.max > 0) {
    published = published.slice(0, args.max);
  }

  const out = {
    version: Number(source.version || 1),
    updatedAt: formatKstIso(updatedAt),
    items: published
  };

  ensureDir(args.output);
  fs.writeFileSync(args.output, `${JSON.stringify(out, null, 2)}\n`);

  const activeCount = published.filter((item) => item.status === 'open').length;
  console.log(`Published ${published.length} opportunities (${activeCount} open) to ${path.relative(repoRoot, args.output)}`);
  console.log(`updatedAt=${out.updatedAt}`);
}

try {
  publish();
} catch (error) {
  console.error(error.message || String(error));
  process.exit(1);
}
