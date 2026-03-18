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
    },
    {
      id: uid(),
      title: '청소년 사회문제 인터랙티브 웹다큐 팀',
      category: 'Film',
      summary: '인터뷰와 데이터 시각화를 결합한 웹다큐 제작.',
      desc: '기획-취재-편집을 3스프린트로 나눠 진행하며 최종 웹다큐 페이지 공개를 목표로 합니다.',
      status: '기획 중',
      teamSize: '3인',
      roles: '취재 1 · 편집 1 · 개발 1',
      duration: '7주',
      image: 'https://picsum.photos/seed/wethus-webdoc/1200/700',
      founderId: 'system',
      createdAt: new Date().toISOString()
    },
    {
      id: uid(),
      title: '청소년 로컬 상권 데이터랩',
      category: 'Policy',
      summary: '지역 상권 데이터를 수집·분석해 정책 인사이트 제안.',
      desc: '현장 인터뷰와 공공데이터 분석으로 청소년 관점의 제안 리포트를 제작합니다.',
      status: '모집 중',
      teamSize: '2인',
      roles: '데이터 1 · 리서치 1 · 문서 1',
      duration: '6주',
      image: 'https://picsum.photos/seed/wethus-datalab/1200/700',
      founderId: 'system',
      createdAt: new Date().toISOString()
    },
    {
      id: uid(),
      title: '청소년 커뮤니티 서비스 브랜딩 스프린트',
      category: 'Startup',
      summary: '서비스 포지셔닝과 브랜드 키트 제작 단기 스프린트.',
      desc: '문제정의-브랜드메시지-랜딩검증까지 4주 스프린트로 빠르게 실험합니다.',
      status: '진행 중',
      teamSize: '3인',
      roles: '브랜딩 1 · 콘텐츠 1 · 운영 1',
      duration: '4주',
      image: 'https://picsum.photos/seed/wethus-brand/1200/700',
      founderId: 'system',
      createdAt: new Date().toISOString()
    }
  ];

  const seedNotifications = [
    {
      id: uid(),
      type: 'founder_submitted',
      title: 'Founder 신청이 접수되었습니다',
      body: '운영자 검토 후 승인 여부가 안내됩니다.',
      sender: 'WETHUS',
      href: 'founder.html',
      unread: true,
      createdAt: new Date().toISOString(),
      userId: null
    },
    {
      id: uid(),
      type: 'team_request',
      title: '새 팀 참여 요청이 도착했습니다',
      body: '프로젝트 지원서를 확인해보세요.',
      sender: 'WETHUS',
      href: 'profile.html',
      unread: true,
      createdAt: new Date(Date.now() - 3600 * 1000 * 6).toISOString(),
      userId: null
    }
  ];

  function normalizeStatus(status) {
    const s = String(status || '').replace(/\s+/g, '');
    if (s === '구인중' || s === '모집중') return '모집 중';
    if (s === '팀빌딩' || s === '기획중' || s === '초기팀빌딩' || s === '검토대기') return '기획 중';
    if (s === '진행중') return '진행 중';
    if (s === '피보팅') return '피보팅';
    return '기획 중';
  }

  function addDays(dateStr, days) {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '';
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
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
        applications: [],
        notifications: seedNotifications,
        dmThreads: [
          {
            id: uid(),
            targetName: '운영팀',
            messages: [{ id: uid(), from: 'WETHUS', text: 'WETHUS에 오신 걸 환영합니다. 최신 공지와 승인은 여기로 안내됩니다.', createdAt: new Date().toISOString() }]
          }
        ],
        geminiApiKey: DEFAULT_GEMINI_KEY
      };
      localStorage.setItem(KEY, JSON.stringify(init));
      return init;
    }
    const parsed = JSON.parse(raw);
    if (!parsed.geminiApiKey) parsed.geminiApiKey = DEFAULT_GEMINI_KEY;
    if (!Array.isArray(parsed.applications)) parsed.applications = [];
    if (!Array.isArray(parsed.notifications)) parsed.notifications = [];
    if (!parsed.notifications.length) {
      parsed.notifications = seedNotifications.slice();
    }

    if (!Array.isArray(parsed.dmThreads)) parsed.dmThreads = [];
    if (!parsed.dmThreads.length) {
      parsed.dmThreads = [
        {
          id: uid(),
          targetName: '운영팀',
          messages: [{ id: uid(), from: 'WETHUS', text: 'WETHUS에 오신 걸 환영합니다. 최신 공지와 승인은 여기로 안내됩니다.', createdAt: new Date().toISOString() }]
        }
      ];
    }

    if (!Array.isArray(parsed.projects)) parsed.projects = [];
    const existingTitles = new Set(parsed.projects.map(p => p.title));
    let changed = false;
    seedProjects.forEach(sp => {
      if (!existingTitles.has(sp.title)) {
        parsed.projects.push(sp);
        changed = true;
      }
    });

    if (Array.isArray(parsed.users)) {
      parsed.users = parsed.users.map(u => {
        const next = { ...u };
        if (!next.plan) next.plan = 'free';
        // 기존 사용자 데이터(과거 버전)는 온보딩 완료로 간주해 강제 리다이렉트를 방지
        if (next.onboardingComplete === undefined) next.onboardingComplete = true;
        if (next.age === undefined) next.age = null;
        if (next.school === undefined) next.school = '';
        if (next.careerRaw === undefined) next.careerRaw = '';
        if (next.careerSummary === undefined) next.careerSummary = '';
        return next;
      });
    }

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
      if (!next.startDate) {
        next.startDate = String(next.createdAt || new Date().toISOString()).slice(0, 10);
        changed = true;
      }
      if (typeof next.ongoingNow !== 'boolean') {
        if (next.endDate) {
          next.ongoingNow = false;
        } else if (next.status === '진행 중' || next.status === '피보팅') {
          next.ongoingNow = true;
        } else {
          next.endDate = addDays(next.startDate, 56);
          next.ongoingNow = false;
        }
        changed = true;
      }
      if (next.ongoingNow && next.endDate) {
        next.endDate = null;
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

  function currentPlan() {
    const u = currentUser();
    return u?.plan || 'free';
  }

  function setCurrentUserPlan(plan) {
    const s = load();
    const u = s.users.find(x => x.id === s.currentUserId);
    if (!u) return false;
    const p = String(plan || 'free').toLowerCase();
    if (p === 'premium') u.plan = 'premium';
    else if (p === 'master' || p === 'pro') u.plan = 'master';
    else u.plan = 'free';
    save(s);
    return true;
  }

  function oauthLoginGoogle({ sub, email, name, picture }) {
    const s = load();
    let isNew = false;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    let user = s.users.find(u => (u.googleSub && u.googleSub === sub) || (u.email && String(u.email).toLowerCase() === normalizedEmail));
    if (!user) {
      isNew = true;
      user = {
        id: uid(),
        name: name || email?.split('@')[0] || 'Google User',
        nickname: (name || email?.split('@')[0] || 'google_user').replace(/\s+/g, ''),
        email: normalizedEmail,
        password: '',
        bio: '',
        founderVerified: false,
        profileImage: picture || '',
        plan: 'free',
        googleSub: sub,
        age: null,
        school: '',
        careerRaw: '',
        careerSummary: '',
        onboardingComplete: false,
        createdAt: new Date().toISOString()
      };
      s.users.push(user);
    } else {
      user.googleSub = sub || user.googleSub;
      user.name = name || user.name;
      user.profileImage = picture || user.profileImage;
    }
    s.currentUserId = user.id;
    s.devMode = false;
    save(s);
    return { user, isNew };
  }

  function registerUser({ name, nickname, email, password }) {
    const s = load();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const exists = s.users.find(u => String(u.email || '').toLowerCase() === normalizedEmail);
    if (exists) throw new Error('이미 가입된 이메일입니다.');
    if (String(password || '').length < 8) throw new Error('비밀번호는 8자 이상이어야 합니다.');
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) throw new Error('비밀번호는 영문+숫자를 포함해야 합니다.');
    if (s.users.some(u => u.password === password)) throw new Error('이미 사용 중인 비밀번호입니다. 다른 비밀번호를 사용해주세요.');
    const user = {
      id: uid(),
      name,
      nickname: nickname || name,
      email: normalizedEmail,
      password,
      bio: '',
      founderVerified: false,
      profileImage: '',
      plan: 'free',
      age: null,
      school: '',
      careerRaw: '',
      careerSummary: '',
      onboardingComplete: false,
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
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const user = s.users.find(u => String(u.email || '').toLowerCase() === normalizedEmail);
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
    s.notifications = s.notifications || [];
    s.notifications.unshift({
      id: uid(),
      type: 'founder_submitted',
      title: 'Founder 신청이 완료되었습니다',
      body: '운영자 검토 후 승인 여부가 알림으로 전달됩니다.',
      href: 'notifications.html',
      sender: 'WETHUS',
      unread: true,
      createdAt: new Date().toISOString(),
      userId: s.currentUserId || 'dev-temp'
    });
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

  function goLoginIfGuest() {
    const actor = currentActorId();
    if (actor) return false;
    if (typeof location !== 'undefined') location.href = 'login.html';
    return true;
  }

  function toggleLike(projectId) {
    const s = load();
    const target = s.projects.find(p => p.id === projectId);
    if (!target) return null;

    const actorId = s.currentUserId || (s.devMode ? 'dev-temp' : null);
    if (!actorId) {
      goLoginIfGuest();
      return { likes: target.likes || 0, liked: false };
    }

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
    if (goLoginIfGuest()) throw new Error('로그인이 필요합니다.');
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

  function updateCurrentUserProfile(patch) {
    const s = load();
    const u = s.users.find(x => x.id === s.currentUserId);
    if (!u) return null;
    Object.assign(u, patch || {});
    save(s);
    return u;
  }

  function listNotifications(limit = 30) {
    const s = load();
    const actor = currentActorId();
    if (!actor) return [];
    return (s.notifications || [])
      .filter(n => n.userId === actor || n.userId == null)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  }

  function unreadNotificationCount() {
    return listNotifications(200).filter(n => n.unread).length;
  }

  function addNotification(payload) {
    const s = load();
    const actor = currentActorId();
    const item = {
      id: uid(),
      type: payload?.type || 'general',
      title: payload?.title || '새 알림',
      body: payload?.body || '',
      href: payload?.href || 'notifications.html',
      sender: payload?.sender || 'WETHUS',
      unread: payload?.unread !== false,
      createdAt: new Date().toISOString(),
      userId: payload?.userId === undefined ? actor : payload.userId
    };
    s.notifications.unshift(item);
    save(s);
    return item;
  }

  function markNotificationRead(id) {
    const s = load();
    const target = (s.notifications || []).find(n => n.id === id);
    if (!target) return false;
    target.unread = false;
    save(s);
    return true;
  }

  function markAllNotificationsRead() {
    const s = load();
    const actor = currentActorId();
    (s.notifications || []).forEach(n => {
      if (!n.userId || n.userId === actor) n.unread = false;
    });
    save(s);
  }

  function listDmThreads() {
    const s = load();
    return s.dmThreads || [];
  }

  function listDmMessages(threadId) {
    const s = load();
    const t = (s.dmThreads || []).find(x => x.id === threadId);
    return t?.messages || [];
  }

  function sendDm(threadId, text) {
    const s = load();
    const actor = currentActorId();
    const u = s.users.find(x => x.id === s.currentUserId);
    const plan = (u?.plan || 'free').toLowerCase();
    if (plan === 'free') throw new Error('Free 플랜은 DM 수신만 가능합니다.');
    const t = (s.dmThreads || []).find(x => x.id === threadId);
    if (!t) throw new Error('대화방을 찾을 수 없습니다.');
    if ((t.targetRole === 'mentor') && plan !== 'master') {
      throw new Error('멘토에게 먼저 메시지를 보내려면 Master 플랜이 필요합니다.');
    }
    t.messages.push({ id: uid(), from: u?.nickname || u?.name || actor || 'Me', text: text || '', createdAt: new Date().toISOString() });
    save(s);
    return t.messages;
  }

  function currentActorId() {
    const s = load();
    return s.currentUserId || (s.devMode ? 'dev-temp' : null);
  }

  function hasApplied(projectId) {
    const s = load();
    const actor = currentActorId();
    if (!actor) return false;
    return s.applications.some(a => a.projectId === projectId && a.userId === actor && a.status === 'applied');
  }

  function applyToProject(projectId, motivation) {
    const s = load();
    const actor = currentActorId();
    if (!actor) {
      goLoginIfGuest();
      throw new Error('로그인이 필요합니다.');
    }
    const exists = s.applications.find(a => a.projectId === projectId && a.userId === actor && a.status === 'applied');
    if (exists) return exists;
    const app = { id: uid(), projectId, userId: actor, motivation: motivation || '', status: 'applied', createdAt: new Date().toISOString() };
    s.applications.push(app);
    const project = s.projects.find(p => p.id === projectId);
    if (project) {
      s.notifications = s.notifications || [];
      const applicant = s.users.find(u => u.id === actor);
      s.notifications.unshift({
        id: uid(),
        type: 'team_request',
        title: '새 팀 참여 요청이 도착했습니다',
        body: `${project.title} 프로젝트에 새로운 지원이 들어왔어요.`,
        sender: applicant?.nickname || applicant?.name || '다른 이용자',
        href: 'notifications.html',
        unread: true,
        createdAt: new Date().toISOString(),
        userId: project.founderId || null
      });
    }
    save(s);
    return app;
  }

  function cancelApplication(projectId) {
    const s = load();
    const actor = currentActorId();
    const target = s.applications.find(a => a.projectId === projectId && a.userId === actor && a.status === 'applied');
    if (!target) return false;
    target.status = 'cancelled';
    target.cancelledAt = new Date().toISOString();
    save(s);
    return true;
  }

  function myParticipatingProjects() {
    const s = load();
    const actor = currentActorId();
    if (!actor) return [];
    const ids = new Set(s.applications.filter(a => a.userId===actor && a.status==='applied').map(a => a.projectId));
    return s.projects.filter(p => ids.has(p.id));
  }

  function projectsByMemberName(name) {
    const s = load();
    return s.projects.filter(p => Array.isArray(p.teamMembers) && p.teamMembers.some(m => m.name === name));
  }
  function requireAuth() {
    const s = load();
    if (!s.currentUserId && !s.devMode) {
      location.href = 'login.html';
      return;
    }
    // 온보딩 진입은 회원가입/신규 소셜로그인 직후 profile.html?onboarding=1로 유도한다.
    // 페이지 공통 가드에서 강제 리다이렉트하면 기존 사용자 흐름이 꼬일 수 있어 여기서는 로그인만 검사.
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
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    async function once(timeoutMs = 15000) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 320 }
          })
        });

        if (!res.ok) {
          const t = await res.text();
          throw new Error(`Gemini 호출 실패: ${t.slice(0, 180)}`);
        }

        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (!text) throw new Error('응답이 비어 있습니다.');
        return text;
      } finally {
        clearTimeout(timeout);
      }
    }

    let lastErr;
    const delays = [0, 500, 1200];
    for (let i = 0; i < delays.length; i++) {
      try {
        if (delays[i]) await new Promise(r => setTimeout(r, delays[i]));
        return await once(15000 + i * 3000);
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr || new Error('Gemini 호출 실패');
  }

  function formatTimeAgo(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return '방금 전';
    if (m < 60) return `${m}분 전`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}시간 전`;
    const d = Math.floor(h / 24);
    return `${d}일 전`;
  }

  function ensureUiDialog() {
    let el = document.getElementById('uiDialog');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'uiDialog';
    el.className = 'modal';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = `
      <div class="modal-backdrop" data-ui-close="true"></div>
      <article class="modal-panel" style="max-width:420px;">
        <div class="modal-content">
          <h3 id="uiDialogTitle" style="margin:0 0 8px;">확인</h3>
          <p id="uiDialogMsg" style="margin:0 0 14px;color:#d6d6d6;"></p>
          <div style="display:flex;justify-content:flex-end;gap:8px;">
            <button id="uiDialogCancel" class="btn btn--secondary" type="button">취소</button>
            <button id="uiDialogOk" class="btn btn--primary" type="button">확인</button>
          </div>
        </div>
      </article>
    `;
    document.body.appendChild(el);
    return el;
  }

  function uiConfirm(message, opts = {}) {
    return new Promise((resolve) => {
      const el = ensureUiDialog();
      const okBtn = el.querySelector('#uiDialogOk');
      const cancelBtn = el.querySelector('#uiDialogCancel');
      const msg = el.querySelector('#uiDialogMsg');
      const title = el.querySelector('#uiDialogTitle');
      title.textContent = opts.title || '확인';
      msg.textContent = message || '';
      okBtn.textContent = opts.confirmText || '확인';
      cancelBtn.textContent = opts.cancelText || '취소';

      const close = (v) => {
        el.classList.remove('open');
        el.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        resolve(v);
      };

      okBtn.onclick = () => close(true);
      cancelBtn.onclick = () => close(false);
      el.onclick = (e) => {
        if (e.target && e.target.getAttribute('data-ui-close') === 'true') close(false);
      };

      el.classList.add('open');
      el.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    });
  }

  function uiAlert(message, opts = {}) {
    return uiConfirm(message, { ...opts, cancelText: '', confirmText: opts.confirmText || '확인' });
  }

  function initNotificationNav() {
    const navs = document.querySelectorAll('.nav-links');
    if (!navs.length) return;
    const actor = currentActorId();

    navs.forEach(nav => {
      const firstLink = nav.querySelector('a.nav-link');
      if (!Array.from(nav.querySelectorAll('a')).some(a => (a.textContent || '').trim() === '홈')) {
        const home = document.createElement('a');
        home.href = 'index.html';
        home.className = 'nav-link';
        home.textContent = '홈';
        nav.insertBefore(home, firstLink || nav.firstChild);
      }

      const state = getState();
      if (state.devMode && !Array.from(nav.querySelectorAll('a')).some(a => (a.textContent || '').includes('WETHUS 1.0'))) {
        const legacy = document.createElement('a');
        legacy.href = 'explore_v1.html';
        legacy.className = 'nav-link';
        legacy.textContent = 'WETHUS 1.0';
        nav.appendChild(legacy);
      }

      // 기존 로그인 링크는 로그인 상태에서 숨긴다 (로그아웃은 프로필 드롭다운으로 통합)
      const authLink = nav.querySelector('.js-auth-link');
      if (actor && authLink) authLink.style.display = 'none';

      if (!actor) return;
      if (nav.querySelector('.js-profile-chip')) return;

      const u = currentUser() || { name: 'User', nickname: 'user', profileImage: '', plan: 'free' };
      const profileAnchor = Array.from(nav.querySelectorAll('a')).find(a => (a.textContent || '').trim() === '프로필');
      if (profileAnchor) profileAnchor.style.display = 'none';

      const chipWrap = document.createElement('div');
      chipWrap.className = 'notify-wrap js-profile-chip';
      const avatarHtml = u.profileImage
        ? `<img src="${u.profileImage}" alt="avatar" class="profile-chip-avatar"/>`
        : `<span class="profile-chip-avatar-fallback">${(u.name || 'U').slice(0, 1)}</span>`;
      const plan = (u.plan || 'free').toLowerCase();
      const planClass = plan === 'premium' ? 'profile-chip-btn--premium' : (plan === 'master' ? 'profile-chip-btn--master' : '');
      chipWrap.innerHTML = `
        <button class="profile-chip-btn ${planClass}" type="button" aria-label="프로필 메뉴">
          ${avatarHtml}
          <span class="profile-chip-texts"><strong>${u.name || '사용자'}</strong><em>${(u.plan || 'free').toUpperCase()}</em></span>
        </button>
        <div class="notify-dropdown profile-chip-dropdown" style="display:none;">
          <a class="notify-item" href="pricing.html"><strong>요금제</strong><p>${(u.plan || 'free').toUpperCase()} Plan</p></a>
          <a class="notify-item" href="profile.html"><strong>프로필</strong><p>내 프로필 보기 및 수정</p></a>
          <button class="notify-more logout-btn" type="button" id="chipLogoutBtn">로그아웃</button>
        </div>
      `;

      const menuWrap = document.createElement('div');
      menuWrap.className = 'notify-wrap js-side-menu';
      menuWrap.innerHTML = `
        <button class="menu-icon-btn" type="button" aria-label="빠른 메뉴 열기" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
        <aside class="side-drawer" style="display:none;">
          <a href="dm.html" class="side-drawer-item">
            <span class="nav-icon-svg" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></span>
            <span>DM</span>
          </a>
          <a href="notifications.html" class="side-drawer-item">
            <span class="nav-icon-svg" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5"/><path d="M9 17a3 3 0 0 0 6 0"/></svg></span>
            <span>알림</span>
            <span class="notify-badge side-badge" style="display:none;">0</span>
          </a>
        </aside>
      `;

      nav.appendChild(chipWrap);
      nav.appendChild(menuWrap);

      const chipDrop = chipWrap.querySelector('.profile-chip-dropdown');
      const chipBtn = chipWrap.querySelector('.profile-chip-btn');
      const chipLogoutBtn = chipWrap.querySelector('#chipLogoutBtn');
      let closeTimer = null;
      const openDrop = () => {
        if (closeTimer) clearTimeout(closeTimer);
        chipDrop.style.display = 'block';
      };
      const closeDrop = () => {
        if (closeTimer) clearTimeout(closeTimer);
        closeTimer = setTimeout(() => { chipDrop.style.display = 'none'; }, 140);
      };
      chipBtn?.addEventListener('mouseenter', openDrop);
      chipWrap?.addEventListener('mouseenter', openDrop);
      chipWrap?.addEventListener('mouseleave', closeDrop);
      chipLogoutBtn?.addEventListener('click', () => {
        logout();
        location.href = 'login.html';
      });

      const drawer = menuWrap.querySelector('.side-drawer');
      const openBtn = menuWrap.querySelector('.menu-icon-btn');
      const sideBadge = menuWrap.querySelector('.side-badge');
      const unread = listNotifications(99).filter(n => n.unread).length;
      sideBadge.textContent = unread > 99 ? '99+' : String(unread);
      sideBadge.style.display = unread ? 'inline-flex' : 'none';

      const toggleDrawer = () => {
        const isOpen = drawer.style.display === 'block';
        drawer.style.display = isOpen ? 'none' : 'block';
        openBtn?.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
      };
      openBtn?.addEventListener('click', toggleDrawer);
    });
  }

  function initGuestNavGuard() {
    const actor = currentActorId();
    if (actor) return;
    const protectedHrefs = new Set(['explore.html', 'founder.html', 'mentor.html', 'profile.html', 'notifications.html', 'dm.html']);
    document.querySelectorAll('.nav-links a[href]').forEach(a => {
      const href = a.getAttribute('href') || '';
      if (protectedHrefs.has(href)) a.setAttribute('href', 'login.html');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initGuestNavGuard();
      initNotificationNav();
    });
  } else {
    initGuestNavGuard();
    initNotificationNav();
  }

  window.WETHUS = {
    getState,
    currentUser,
    registerUser,
    loginUser,
    registerOrLogin,
    oauthLoginGoogle,
    setCurrentUser,
    logout,
    addProject,
    listProjects,
    myProjects,
    toggleLike,
    addComment,
    updateProject,
    updateCurrentUserProfile,
    currentPlan,
    setCurrentUserPlan,
    listNotifications,
    unreadNotificationCount,
    addNotification,
    markNotificationRead,
    markAllNotificationsRead,
    listDmThreads,
    listDmMessages,
    sendDm,
    uiConfirm,
    uiAlert,
    hasApplied,
    applyToProject,
    cancelApplication,
    myParticipatingProjects,
    projectsByMemberName,
    requireAuth,
    fakeAiSearch,
    setGeminiApiKey,
    getGeminiApiKey,
    askGemini
  };
})();
