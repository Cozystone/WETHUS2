const fs = require('fs');
const path = require('path');
const vm = require('vm');
const nodeCrypto = require('crypto');

const repoRoot = path.resolve(__dirname, '..');
const appPath = path.join(repoRoot, 'WETHUS2', 'app.js');
const errors = [];

function fail(message) {
  errors.push(message);
}

function makeStorage() {
  const map = new Map();
  return {
    getItem(key) {
      return map.has(String(key)) ? map.get(String(key)) : null;
    },
    setItem(key, value) {
      map.set(String(key), String(value));
    },
    removeItem(key) {
      map.delete(String(key));
    },
    clear() {
      map.clear();
    },
    key(index) {
      return Array.from(map.keys())[index] || null;
    },
    get length() {
      return map.size;
    }
  };
}

function buildContext() {
  const localStorage = makeStorage();
  const sessionStorage = makeStorage();
  const document = {
    readyState: 'loading',
    addEventListener() {},
    querySelectorAll() { return []; },
    querySelector() { return null; },
    head: { appendChild() {} },
    createElement() {
      return {
        setAttribute() {},
        getAttribute() { return ''; }
      };
    }
  };

  const context = {
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    Math,
    Date,
    JSON,
    URL,
    URLSearchParams,
    encodeURIComponent,
    decodeURIComponent,
    localStorage,
    sessionStorage,
    document,
    location: {
      hostname: '127.0.0.1',
      protocol: 'http:',
      pathname: '/explore_theme.html'
    },
    crypto: {
      randomUUID: () => nodeCrypto.randomUUID()
    }
  };
  context.window = context;
  context.globalThis = context;
  context.fetch = async () => {
    throw new Error('fetch should not be called in discovery visibility smoke');
  };
  return context;
}

function loadWethus() {
  const source = fs.readFileSync(appPath, 'utf8');
  const context = buildContext();
  vm.createContext(context);
  new vm.Script(source, { filename: 'app.js' }).runInContext(context);
  return context;
}

function seedState(context) {
  const now = Date.now();
  const daysAgo = (days) => new Date(now - days * 86400000).toISOString();
  const state = {
    currentUserId: 'founder-1',
    devMode: false,
    users: [
      { id: 'founder-1', email: 'founder@example.com', name: 'Founder', nickname: 'Founder' },
      { id: 'other-1', email: 'other@example.com', name: 'Other', nickname: 'Other' }
    ],
    projects: [
      {
        id: 'approved-fresh',
        title: 'Approved Fresh',
        founderId: 'other-1',
        founderEmail: 'other@example.com',
        category: 'Startup',
        summary: 'Fresh approved project',
        moderationStatus: 'approved',
        moderationReviewedAt: daysAgo(1),
        createdAt: daysAgo(2),
        comments: [],
        likedBy: [],
        likes: 0
      },
      {
        id: 'approved-old',
        title: 'Approved Old',
        founderId: 'other-1',
        founderEmail: 'other@example.com',
        category: 'Startup',
        summary: 'Old approved project',
        moderationStatus: 'approved',
        moderationReviewedAt: daysAgo(20),
        createdAt: daysAgo(30),
        comments: [],
        likedBy: [],
        likes: 0
      },
      {
        id: 'mine-review',
        title: 'My Review Project',
        founderId: 'founder-1',
        founderEmail: 'founder@example.com',
        category: 'Science',
        summary: 'Needs manual review',
        moderationStatus: 'manual_review',
        createdAt: daysAgo(1),
        comments: [],
        likedBy: [],
        likes: 0
      },
      {
        id: 'mine-rejected',
        title: 'My Rejected Project',
        founderId: 'founder-1',
        founderEmail: 'founder@example.com',
        category: 'Policy',
        summary: 'Rejected submission',
        moderationStatus: 'rejected',
        createdAt: daysAgo(3),
        comments: [],
        likedBy: [],
        likes: 0
      },
      {
        id: 'other-review',
        title: 'Other Review Project',
        founderId: 'other-1',
        founderEmail: 'other@example.com',
        category: 'Creative',
        summary: 'Another review project',
        moderationStatus: 'manual_review',
        createdAt: daysAgo(2),
        comments: [],
        likedBy: [],
        likes: 0
      }
    ],
    bookmarks: [],
    applications: [],
    notifications: [],
    projectViews: []
  };
  context.localStorage.setItem('wethus_v1', JSON.stringify(state));
}

function expectExploreVisibility(context) {
  const visible = context.window.WETHUS.listExploreProjects();
  const ids = visible.map((project) => String(project?.id || ''));
  if (!ids.includes('approved-fresh') || !ids.includes('approved-old')) {
    fail('explore visibility should include approved projects');
  }
  if (!ids.includes('mine-review')) {
    fail('explore visibility should include the current founder manual_review project');
  }
  if (!ids.includes('mine-rejected')) {
    fail('explore visibility should include the current founder rejected project for self-view');
  }
  if (ids.includes('other-review')) {
    fail('explore visibility should not include another user manual_review project');
  }
}

function expectRecommendationFreshness(context) {
  const recommended = context.window.WETHUS.getRecommendedProjects(6);
  const ids = recommended.map((project) => String(project?.id || ''));
  if (ids.includes('mine-review') || ids.includes('mine-rejected') || ids.includes('other-review')) {
    fail('recommendations should include approved projects only');
  }
  if (ids.indexOf('approved-fresh') === -1 || ids.indexOf('approved-old') === -1) {
    fail('recommendations should include approved projects');
    return;
  }
  if (ids.indexOf('approved-fresh') > ids.indexOf('approved-old')) {
    fail('recommendations should rank the more recently approved project ahead of the stale one when popularity is equal');
  }
}

try {
  const context = loadWethus();
  seedState(context);
  expectExploreVisibility(context);
  expectRecommendationFreshness(context);
} catch (error) {
  fail(error?.stack || error?.message || String(error));
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exit(1);
}

console.log('Discovery visibility smoke passed.');
