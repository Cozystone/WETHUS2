// WETHUS MVP App State + Gemini integration (dev)
(function () {
  const KEY = 'wethus_v1';
  const DEFAULT_GEMINI_KEY = 'AIzaSyBb5uOh7OMbtR-Mm4GwT6IU2zSwVUqdnL8';

  function uid() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  const seedProjects = [
    {
      id: uid(),
      title: '청소년 독립영화 단편 제작팀',
      category: 'Film',
      summary: '부산 로케이션 기반으로 2개월 내 단편영화 완성.',
      desc: '촬영 전 프리프로덕션 2주, 촬영 3주, 후반 3주로 운영합니다. 팀 내부에 제작/촬영/편집 파트를 나누고 주 2회 오프라인 스프린트를 진행합니다.\n\n현재 시나리오 리딩과 로케이션 리서치가 진행 중이며, 합류 후 첫 2주에는 쇼트리스트 작성과 장비 테스트를 함께 진행합니다.',
      status: '모집 중',
      teamSize: '4인이상',
      roles: '촬영 1 · 편집 2 · 배우 1',
      duration: '8주',
      image: 'https://picsum.photos/seed/wethus-film/1200/700',
      founderId: 'system',
      createdAt: new Date().toISOString()
    },
    {
      id: uid(),
      title: '고등학생 팀 협업 앱 MVP 실험',
      category: 'App',
      summary: '학교 프로젝트 운영 불편을 해결하는 앱 MVP 제작.',
      desc: '초기 인터뷰 10건을 통해 문제를 정의하고, 2주 단위로 기능 실험을 반복합니다. MVP 범위는 팀 모집/할 일/진행 체크 기능까지로 제한합니다.\n\n첫 스프린트는 사용자 플로우 설계, 두 번째 스프린트는 실제 프로토타입 배포를 목표로 합니다.',
      status: '기획 중',
      teamSize: '3인',
      roles: 'PM 1 · 프론트 1 · 디자이너 1',
      duration: '6주',
      image: 'https://picsum.photos/seed/wethus-app/1200/700',
      founderId: 'system',
      createdAt: new Date().toISOString()
    },
    {
      id: uid(),
      title: '청소년 교통비 정책 제안 프로젝트',
      category: 'Policy',
      summary: '데이터 리서치 기반 정책 제안서와 발표 자료 제작.',
      desc: '청소년 교통비 부담 데이터를 수집·시각화하고 지역의회 제안용 문서를 제작합니다. 인터뷰/리서치/문서/발표 파트를 나눠 실행합니다.\n\n산출물은 제안서 PDF, 발표 슬라이드, 요약 인포그래픽 3종입니다.',
      status: '기획 중',
      teamSize: '2인',
      roles: '리서처 2 · 문서 1 · 발표 1',
      duration: '5주',
      image: 'https://picsum.photos/seed/wethus-policy/1200/700',
      founderId: 'system',
      createdAt: new Date().toISOString()
    },
    {
      id: uid(),
      title: '지역 문제 해결 캠페인 미디어팀',
      category: 'Campaign',
      summary: '청소년이 직접 기획하는 지역 인식개선 캠페인.',
      desc: '캠페인 메시지 설계, 숏폼 제작, 오프라인 부스 운영까지 통합 진행합니다.\n\n콘텐츠 기획과 촬영 가능한 팀원을 우선 모집합니다.',
      status: '진행 중',
      teamSize: '4인이상',
      roles: '기획 1 · 영상 2 · 운영 1',
      duration: '7주',
      image: 'https://picsum.photos/seed/wethus-campaign/1200/700',
      founderId: 'system',
      createdAt: new Date().toISOString()
    },
    {
      id: uid(),
      title: '청소년 로컬 브랜드 런칭 실험',
      category: 'Startup',
      summary: '작은 제품을 실제 판매까지 연결하는 창업 실험.',
      desc: '아이템 선정부터 브랜딩, 판매 채널 테스트까지 6주 내 완료를 목표로 합니다.\n\n운영/디자인/콘텐츠 제작 역할을 모집합니다.',
      status: '피보팅',
      teamSize: '3인',
      roles: '브랜딩 1 · 운영 1 · 콘텐츠 2',
      duration: '6주',
      image: 'https://picsum.photos/seed/wethus-startup/1200/700',
      founderId: 'system',
      createdAt: new Date().toISOString()
    },
    {
      id: uid(),
      title: '청소년 전시/출판 크리에이티브 프로젝트',
      category: 'Creative',
      summary: '인터뷰 기반 아카이브 전시와 소책자 제작.',
      desc: '주제 리서치, 인터뷰, 에디토리얼 디자인, 전시 설치까지 경험하는 프로젝트입니다.\n\n글/디자인/촬영 파트가 함께 작업합니다.',
      status: '모집 중',
      teamSize: '1인',
      roles: '에디터 1 · 디자이너 1 · 촬영 1',
      duration: '8주',
      image: 'https://picsum.photos/seed/wethus-creative/1200/700',
      founderId: 'system',
      createdAt: new Date().toISOString()
    }
  ];

  function normalizeStatus(status) {
    const s = String(status || '').replace(/\s+/g, '');
    if (s === '구인중' || s === '모집중') return '모집 중';
    if (s === '팀빌딩' || s === '기획중') return '기획 중';
    if (s === '진행중') return '진행 중';
    if (s === '피보팅') return '피보팅';
    return status || '기획 중';
  }

  function defaultTeamForProject(title, founderName) {
    const leader = { id: uid(), name: founderName || '대표', role: '대표', bio: '프로젝트 리딩 및 의사결정', isLeader: true };
    const presets = {
      '청소년 독립영화 단편 제작팀': [
        leader,
        { id: uid(), name: '서진', role: '촬영', bio: '다큐/숏폼 촬영 경험' },
        { id: uid(), name: '민재', role: '편집', bio: '프리미어/다빈치 편집' },
        { id: uid(), name: '하린', role: '배우', bio: '연기 워크숍 참여' }
      ],
      '고등학생 팀 협업 앱 MVP 실험': [
        leader,
        { id: uid(), name: '유진', role: '디자인', bio: '모바일 UX 설계' },
        { id: uid(), name: '도윤', role: '프론트', bio: 'React/Next 개발' }
      ],
      '청소년 교통비 정책 제안 프로젝트': [
        leader,
        { id: uid(), name: '지우', role: '리서치', bio: '데이터 정리/인터뷰' },
        { id: uid(), name: '현서', role: '문서', bio: '보고서 작성/편집' }
      ]
    };
    return presets[title] || [
      leader,
      { id: uid(), name: '가온', role: '운영', bio: '프로젝트 운영 지원' },
      { id: uid(), name: '로아', role: '콘텐츠', bio: '콘텐츠 기획/제작' }
    ];
  }

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

    if (!Array.isArray(parsed.projects)) parsed.projects = [];
    const existingTitles = new Set(parsed.projects.map(p => p.title));
    let changed = false;
    seedProjects.forEach(sp => {
      if (!existingTitles.has(sp.title)) {
        parsed.projects.push(sp);
        changed = true;
      }
    });

    const likePreset = {
      '청소년 독립영화 단편 제작팀': 42,
      '고등학생 팀 협업 앱 MVP 실험': 35,
      '청소년 교통비 정책 제안 프로젝트': 28,
      '지역 문제 해결 캠페인 미디어팀': 24,
      '청소년 로컬 브랜드 런칭 실험': 20,
      '청소년 전시/출판 크리에이티브 프로젝트': 18
    };

    parsed.projects = parsed.projects.map(p => {
      const next = { ...p };
      if (typeof next.likes !== 'number') {
        next.likes = likePreset[next.title] ?? Math.floor(Math.random() * 12) + 3;
        changed = true;
      }
      if (!Array.isArray(next.comments)) {
        next.comments = [];
        changed = true;
      }
      if (!Array.isArray(next.likedBy)) {
        next.likedBy = [];
        changed = true;
      }
      if (!Array.isArray(next.teamMembers) || !next.teamMembers.length) {
        next.teamMembers = defaultTeamForProject(next.title, '대표');
        changed = true;
      }
      if (!next.teamSize) {
        const pool = ['1인', '2인', '3인', '4인이상'];
        next.teamSize = pool[Math.floor(Math.random() * pool.length)];
        changed = true;
      }
      const normalized = normalizeStatus(next.status);
      if (normalized !== next.status) {
        next.status = normalized;
        changed = true;
      }
      if (!next.status) {
        const stages = ['모집 중', '기획 중', '진행 중', '피보팅'];
        next.status = stages[Math.floor(Math.random() * stages.length)];
        changed = true;
      }
      return next;
    });

    if (changed) localStorage.setItem(KEY, JSON.stringify(parsed));

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

  function registerUser({ name, nickname, email, password }) {
    const s = load();
    const exists = s.users.find(u => u.email === email);
    if (exists) throw new Error('이미 가입된 이메일입니다.');
    if (String(password || '').length < 8) throw new Error('비밀번호는 8자 이상이어야 합니다.');
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) throw new Error('비밀번호는 영문+숫자를 포함해야 합니다.');
    if (s.users.some(u => u.password === password)) throw new Error('이미 사용 중인 비밀번호입니다. 다른 비밀번호를 사용해주세요.');
    const user = {
      id: uid(),
      name,
      nickname: nickname || name,
      email,
      password,
      bio: '',
      founderVerified: false,
      profileImage: '',
      createdAt: new Date().toISOString()
    };
    s.users.push(user);
    s.currentUserId = user.id;
    s.devMode = false;
    save(s);
    return user;
  }

  function loginUser({ email, password }) {
    const s = load();
    const user = s.users.find(u => u.email === email);
    if (!user) throw new Error('가입된 계정이 없습니다.');
    if (user.password !== password) throw new Error('비밀번호가 일치하지 않습니다.');
    s.currentUserId = user.id;
    s.devMode = false;
    save(s);
    return user;
  }

  function registerOrLogin(payload) {
    const s = load();
    const user = s.users.find(u => u.email === payload.email);
    if (user) return loginUser({ email: payload.email, password: payload.password });
    return registerUser(payload);
  }

  function addProject(payload) {
    const s = load();
    if (!s.currentUserId && !s.devMode) throw new Error('로그인이 필요합니다.');
    const me = s.users.find(u => u.id === s.currentUserId);
    const project = {
      id: uid(),
      founderId: s.currentUserId || 'dev-temp',
      teamMembers: [{ id: uid(), name: me?.nickname || me?.name || '대표', role: '대표', bio: '프로젝트 대표', isLeader: true }],
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

  function toggleLike(projectId) {
    const s = load();
    const target = s.projects.find(p => p.id === projectId);
    if (!target) return null;

    const actorId = s.currentUserId || (s.devMode ? 'dev-temp' : null);
    if (!actorId) return { likes: target.likes || 0, liked: false };

    if (!Array.isArray(target.likedBy)) target.likedBy = [];
    const idx = target.likedBy.indexOf(actorId);
    const liked = idx === -1;

    if (liked) {
      target.likedBy.push(actorId);
      target.likes = (target.likes || 0) + 1;
    } else {
      target.likedBy.splice(idx, 1);
      target.likes = Math.max(0, (target.likes || 0) - 1);
    }

    target._liked = liked;
    save(s);
    return { likes: target.likes, liked };
  }

  function addComment(projectId, text) {
    const s = load();
    const target = s.projects.find(p => p.id === projectId);
    if (!target) return null;
    const author = currentUser()?.nickname || currentUser()?.name || '익명';
    if (!Array.isArray(target.comments)) target.comments = [];
    target.comments.push({ id: uid(), author, text, createdAt: new Date().toISOString() });
    save(s);
    return target.comments;
  }

  function updateProject(projectId, patch) {
    const s = load();
    const target = s.projects.find(p => p.id === projectId);
    if (!target) return null;
    Object.assign(target, patch || {});
    save(s);
    return target;
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
    registerUser,
    loginUser,
    registerOrLogin,
    setCurrentUser,
    logout,
    addProject,
    listProjects,
    myProjects,
    toggleLike,
    addComment,
    updateProject,
    requireAuth,
    fakeAiSearch,
    setGeminiApiKey,
    getGeminiApiKey,
    askGemini
  };
})();
