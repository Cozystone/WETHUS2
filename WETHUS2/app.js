// WETHUS MVP App State + Gemini integration (dev)
(function () {
  const KEY = 'wethus_v1';
  const DEFAULT_GEMINI_KEY = 'AIzaSyBb5uOh7OMbtR-Mm4GwT6IU2zSwVUqdnL8';

  const seedProjects = [
    {
      id: crypto.randomUUID(),
      title: '청소년 독립영화 단편 제작팀',
      category: 'Film',
      summary: '부산 로케이션 기반 2개월 단편영화 제작',
      status: '모집 중',
      roles: '촬영 1 · 편집 2 · 배우 1',
      founderId: 'system',
      createdAt: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      title: '고등학생 팀 협업 앱 MVP 실험',
      category: 'App',
      summary: '학교 프로젝트 운영 불편을 해결하는 앱 MVP',
      status: '초기 팀 빌딩',
      roles: 'PM 1 · 프론트 1 · 디자이너 1',
      founderId: 'system',
      createdAt: new Date().toISOString()
    }
  ];

  function load() {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const init = {
        users: [],
        projects: seedProjects,
        currentUserId: null,
        devMode: false,
        geminiApiKey: DEFAULT_GEMINI_KEY
      };
      localStorage.setItem(KEY, JSON.stringify(init));
      return init;
    }
    const parsed = JSON.parse(raw);
    if (!parsed.geminiApiKey) parsed.geminiApiKey = DEFAULT_GEMINI_KEY;
    return parsed;
  }

  function save(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function getState() {
    return load();
  }

  function setCurrentUser(userId, devMode = false) {
    const s = load();
    s.currentUserId = userId;
    s.devMode = devMode;
    save(s);
  }

  function logout() {
    const s = load();
    s.currentUserId = null;
    s.devMode = false;
    save(s);
  }

  function currentUser() {
    const s = load();
    return s.users.find(u => u.id === s.currentUserId) || null;
  }

  function registerOrLogin({ name, email, password }) {
    const s = load();
    let user = s.users.find(u => u.email === email);
    if (!user) {
      user = { id: crypto.randomUUID(), name, email, password, bio: '', createdAt: new Date().toISOString() };
      s.users.push(user);
    } else if (user.password !== password) {
      throw new Error('비밀번호가 일치하지 않습니다.');
    }
    s.currentUserId = user.id;
    s.devMode = false;
    save(s);
    return user;
  }

  function addProject(payload) {
    const s = load();
    if (!s.currentUserId && !s.devMode) throw new Error('로그인이 필요합니다.');
    const project = {
      id: crypto.randomUUID(),
      founderId: s.currentUserId || 'dev-temp',
      createdAt: new Date().toISOString(),
      ...payload
    };
    s.projects.unshift(project);
    save(s);
    return project;
  }

  function listProjects() {
    return load().projects;
  }

  function myProjects() {
    const s = load();
    return s.projects.filter(p => p.founderId === s.currentUserId || (s.devMode && p.founderId === 'dev-temp'));
  }

  function requireAuth() {
    const s = load();
    if (!s.currentUserId && !s.devMode) {
      location.href = 'login.html';
    }
  }

  function setGeminiApiKey(apiKey) {
    const s = load();
    s.geminiApiKey = apiKey;
    save(s);
  }

  function getGeminiApiKey() {
    return load().geminiApiKey || DEFAULT_GEMINI_KEY;
  }

  function fakeAiSearch(projects, query) {
    if (!query) return projects;
    const q = query.toLowerCase();
    return projects
      .map(p => {
        const text = `${p.title} ${p.summary} ${p.category} ${p.roles}`.toLowerCase();
        let score = 0;
        if (text.includes(q)) score += 3;
        q.split(/\s+/).forEach(w => { if (w && text.includes(w)) score += 1; });
        return { ...p, _score: score };
      })
      .filter(p => p._score > 0)
      .sort((a, b) => b._score - a._score);
  }

  async function askGemini(prompt) {
    const apiKey = getGeminiApiKey();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.6, maxOutputTokens: 500 }
      })
    });

    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Gemini 호출 실패: ${t.slice(0, 180)}`);
    }

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || '응답이 비어 있습니다.';
  }

  window.WETHUS = {
    getState,
    currentUser,
    registerOrLogin,
    setCurrentUser,
    logout,
    addProject,
    listProjects,
    myProjects,
    requireAuth,
    fakeAiSearch,
    setGeminiApiKey,
    getGeminiApiKey,
    askGemini
  };
})();
