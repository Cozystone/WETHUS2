// WETHUS MVP App State + Gemini integration (dev)
(function () {
  const KEY = 'wethus_v1';
  const DEFAULT_GEMINI_KEY = 'AIzaSyBb5uOh7OMbtR-Mm4GwT6IU2zSwVUqdnL8';
  const DEFAULT_OPENAI_KEY = '';
  const ADMIN_MODE_USER_ID = 'admin-mode';
  const CLOUD_BASE_CANDIDATES = [
    (typeof window !== 'undefined' && window.WETHUS_API_BASE) ? window.WETHUS_API_BASE : '',
    'https://wethus-api.onrender.com/api',
    'https://wethus-api.onrender.com',
    (typeof location !== 'undefined' && ['localhost', '127.0.0.1'].includes(location.hostname)) ? `${location.protocol}//${location.hostname}:8787` : ''
  ].filter(Boolean).map(x => String(x).replace(/\/$/, '').replace(/\/api$/, ''));
  let cloudSyncTimer = null;
  let cloudAutoPullTimer = null;

  function sanitizeCategoryName(raw) {
    const cleaned = String(raw || '')
      .replace(/\byouth\b/ig, '')
      .replace(/youth/ig, '')
      .replace(/[-_/|]+$/g, '')
      .trim();
    const key = cleaned.toLowerCase();
    const map = {
      film: 'Film',
      startup: 'Startup',
      science: 'Science',
      policy: 'Policy',
      campaign: 'Campaign',
      creative: 'Creative',
      app: 'App',
      artculture: 'ArtCulture',
      art: 'Art',
      culture: 'Culture'
    };
    return map[key] || cleaned;
  }

  function isYouthByAge(age, verifiedAt) {
    const n = Number(age);
    if (!Number.isFinite(n)) return false;
    if (!verifiedAt) return false;
    return n < 19;
  }

  function normalizeYouthTag(user = {}) {
    const byAge = isYouthByAge(user.age, user.ageVerifiedAt);
    return !!(user.youthTag || byAge);
  }

  function getUserTrack(user = {}) {
    return normalizeYouthTag(user) ? 'Youth' : 'Open';
  }

  function isYouthProject(project, users = []) {
    const founder = users.find(u => u.id === project?.founderId);
    return !!(project?.youthProjectTag || (founder && normalizeYouthTag(founder)));
  }

  function uid() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  const seedProjects = [
    {
      id: uid(),
      title: '지역상점 숏다큐 스튜디오 파일럿',
      category: 'Film',
      summary: '로컬 상점을 주제로 6주 안에 숏다큐 3편 제작·배포.',
      desc: '로컬 상점의 문제와 이야기를 짧은 다큐 형식으로 제작해 인스타·유튜브 쇼츠로 배포합니다. 프리프로덕션 2주, 촬영 2주, 후반/배포 2주로 운영합니다.\n\n단순 영상 제작이 아니라 조회·완시율·문의 전환 같은 반응 데이터를 함께 수집해 다음 포맷을 개선합니다.',
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
      title: '교실 공기질 센서 데이터랩',
      category: 'Science',
      summary: '교실 CO2·미세먼지 측정 후 시각화 대시보드와 개선 제안 제작.',
      desc: '교실/복도/강당의 공기질 데이터를 직접 측정하고 시간대별 패턴을 분석합니다.\n\n최종 산출물은 시각화 리포트, 개선 액션 제안, 발표 자료 3종이며 학교 적용 가능성을 검증합니다.',
      status: '기획 중',
      teamSize: '3인',
      roles: '실험 1 · 데이터 1 · 문서 1',
      duration: '5주',
      image: 'https://picsum.photos/seed/wethus-science/1200/700',
      founderId: 'system',
      createdAt: new Date().toISOString()
    },
    {
      id: uid(),
      title: '통학 안전 데이터 제안팀',
      category: 'Policy',
      summary: '등하교 위험구간 데이터를 수집해 학교·지자체 제안서로 연결.',
      desc: '학생 제보, 지도 데이터, 현장 사진을 결합해 통학 위험구간을 지도화합니다. 인터뷰/리서치/문서/발표 파트를 나눠 실행합니다.\n\n산출물은 제안서 PDF, 발표 슬라이드, 위험구간 인포그래픽 3종입니다.',
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
      title: '교내 플라스틱 저감 실행 캠페인팀',
      category: 'Campaign',
      summary: '텀블러/리필 스테이션 실험으로 교내 플라스틱 사용량 감축 도전.',
      desc: '캠페인 메시지 설계, 참여형 챌린지, 오프라인 부스 운영까지 통합 진행합니다.\n\n주차별로 참여율과 감축량을 추적해 실제 행동 변화가 있는지 검증합니다.',
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
      title: '동네 소상공인 방문경험 개선 스쿼드',
      category: 'Policy',
      summary: '학생 소비자 관점 인터뷰 기반으로 상점 방문경험 개선안 도출.',
      desc: '현장 인터뷰와 간단한 고객 여정 분석을 통해 동네 상점의 불편 포인트를 정리합니다.\n\n리포트와 함께 바로 실행 가능한 개선 체크리스트를 상점에 제안합니다.',
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
      createdAt: new Date().toISOString(),
      youthProjectTag: true,
      projectTrack: 'Youth'
    },
    {
      id: uid(),
      title: '청소년 다큐 사운드 디자인 랩',
      category: 'Film',
      summary: '현장음 수집과 사운드 편집 중심 단편 오디오팀',
      desc: '인터뷰 기반 다큐 프로젝트의 사운드 파트를 집중 운영합니다.',
      status: '모집 중',
      teamSize: '2인',
      roles: '사운드 1 · 편집 1',
      duration: '4주',
      image: 'https://picsum.photos/seed/wethus-film2/1200/700',
      founderId: 'system',
      createdAt: new Date().toISOString(),
      youthProjectTag: true,
      projectTrack: 'Youth'
    },
    {
      id: uid(),
      title: '청소년 지역문제 해결 앱 스쿼드',
      category: 'App',
      summary: '지역 불편 신고와 해결 추적 앱 MVP 팀',
      desc: '기획-디자인-프론트 개발로 1차 MVP를 5주 내 배포합니다.',
      status: '기획 중',
      teamSize: '3인',
      roles: '기획 1 · 디자인 1 · 개발 1',
      duration: '5주',
      image: 'https://picsum.photos/seed/wethus-app2/1200/700',
      founderId: 'system',
      createdAt: new Date().toISOString(),
      youthProjectTag: true,
      projectTrack: 'Youth'
    },
    {
      id: uid(),
      title: '청소년 기후데이터 실험실',
      category: 'Science',
      summary: '기후 데이터 수집·시각화 기반 탐구 보고서 팀',
      desc: '센서 측정 데이터와 공공데이터를 결합해 인사이트를 도출합니다.',
      status: '모집 중',
      teamSize: '3인',
      roles: '데이터 1 · 실험 1 · 문서 1',
      duration: '6주',
      image: 'https://picsum.photos/seed/wethus-science2/1200/700',
      founderId: 'system',
      createdAt: new Date().toISOString(),
      youthProjectTag: true,
      projectTrack: 'Youth'
    },
    {
      id: uid(),
      title: '청소년 복지정책 리서치 워킹그룹',
      category: 'Policy',
      summary: '현장 인터뷰 기반 청소년 복지 개선 제안팀',
      desc: '학교/지역 인터뷰를 토대로 정책 제안서와 요약 브리프를 제작합니다.',
      status: '기획 중',
      teamSize: '2인',
      roles: '리서치 1 · 문서 1',
      duration: '5주',
      image: 'https://picsum.photos/seed/wethus-policy2/1200/700',
      founderId: 'system',
      createdAt: new Date().toISOString(),
      youthProjectTag: true,
      projectTrack: 'Youth'
    },
    {
      id: uid(),
      title: '청소년 학교연계 인식개선 캠페인팀',
      category: 'Campaign',
      summary: '학교와 지역을 연결하는 오프라인 캠페인 프로젝트',
      desc: '캠페인 메시지 설계부터 콘텐츠 제작, 현장 운영까지 진행합니다.',
      status: '모집 중',
      teamSize: '4인이상',
      roles: '기획 1 · 콘텐츠 2 · 운영 1',
      duration: '6주',
      image: 'https://picsum.photos/seed/wethus-campaign2/1200/700',
      founderId: 'system',
      createdAt: new Date().toISOString(),
      youthProjectTag: true,
      projectTrack: 'Youth'
    },
    {
      id: uid(),
      title: '청소년 로컬굿즈 스타트업 프리팀',
      category: 'Startup',
      summary: '지역 스토리 기반 굿즈 실험 판매 프로젝트',
      desc: '브랜딩-제작-판매 테스트까지 작게 실행하는 창업 예비팀입니다.',
      status: '기획 중',
      teamSize: '3인',
      roles: '브랜딩 1 · 운영 1 · 제작 1',
      duration: '6주',
      image: 'https://picsum.photos/seed/wethus-startup2/1200/700',
      founderId: 'system',
      createdAt: new Date().toISOString(),
      youthProjectTag: true,
      projectTrack: 'Youth'
    },
    {
      id: uid(),
      title: '학생 창작 굿즈 마켓 파일럿',
      category: 'Creative',
      summary: '학생 창작물을 굿즈로 제작해 소규모 판매까지 검증하는 팀',
      desc: '일러스트·사진·문구 콘텐츠를 굿즈로 제작하고, 교내/플리마켓에서 실제 판매 반응을 테스트합니다.',
      status: '모집 중',
      teamSize: '3인',
      roles: '에디터 1 · 디자이너 1 · 촬영 1',
      duration: '7주',
      image: 'https://picsum.photos/seed/wethus-creative2/1200/700',
      founderId: 'system',
      createdAt: new Date().toISOString(),
      youthProjectTag: true,
      projectTrack: 'Youth'
    }
  ];

  const seedNotifications = [
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

  function normalizeCategory(category, title = '', summary = '') {
    const raw = String(category || '').trim();
    const c = raw.toLowerCase();
    const blob = `${String(title || '').toLowerCase()} ${String(summary || '').toLowerCase()}`;

    if (/^(startup|스타트업|창업|business|비즈니스|app|앱)$/i.test(raw)) return 'Startup';
    if (/^(film|영상|영화|creative|크리에이티브|art|예술|culture|문화|전시|출판)$/i.test(raw)) return 'Film';
    if (/^(policy|정책|law|법|society|사회)$/i.test(raw)) return 'Policy';
    if (/^(campaign|캠페인)$/i.test(raw)) return 'Campaign';
    if (/^(math|sci|science|research|data|수학|과학|연구|데이터)$/i.test(raw)) return 'Science';

    if (/(스타트업|창업|비즈니스|app|앱|mvp|startup|business)/.test(c)) return 'Startup';
    if (/(film|creative|art|culture|영화|영상|전시|출판|예술|문화)/.test(c)) return 'Film';
    if (/(policy|law|society|정책|법|사회)/.test(c)) return 'Policy';
    if (/(campaign|캠페인)/.test(c)) return 'Campaign';
    if (/(math|sci|science|research|data|수학|과학|연구|데이터|경진대회)/.test(c)) return 'Science';

    if (/(스타트업|창업|비즈니스|app|앱|mvp|startup|business)/.test(blob)) return 'Startup';
    if (/(영화|영상|전시|출판|예술|문화|film|creative|art|culture)/.test(blob)) return 'Film';
    if (/(정책|법|사회|policy|law|society)/.test(blob)) return 'Policy';
    if (/(캠페인|campaign)/.test(blob)) return 'Campaign';
    if (/(수학|과학|연구|데이터|경진대회|math|sci|science|research|data)/.test(blob)) return 'Science';

    return 'Startup';
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
      '지역상점 숏다큐 스튜디오 파일럿': [
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
      '통학 안전 데이터 제안팀': [
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
        bookmarks: [],
        notifications: seedNotifications,
        dmThreads: [
          {
            id: uid(),
            targetName: '운영팀',
            messages: [{ id: uid(), from: 'WETHUS', text: 'WETHUS에 오신 걸 환영합니다. 최신 공지와 승인은 여기로 안내됩니다.', createdAt: new Date().toISOString() }]
          }
        ],
        agents: [],
        agentActivityLogs: [],
        geminiApiKey: DEFAULT_GEMINI_KEY
      };
      localStorage.setItem(KEY, JSON.stringify(init));
      return init;
    }
    const parsed = JSON.parse(raw);
    if (!parsed.geminiApiKey) parsed.geminiApiKey = DEFAULT_GEMINI_KEY;
    if (!Array.isArray(parsed.applications)) parsed.applications = [];
    if (!Array.isArray(parsed.bookmarks)) parsed.bookmarks = [];
    if (!Array.isArray(parsed.notifications)) parsed.notifications = [];
    parsed.notifications = parsed.notifications.filter(n => !(n?.type === 'founder_submitted' && n?.userId == null));
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

    if (!Array.isArray(parsed.agents)) parsed.agents = [];
    if (!Array.isArray(parsed.agentActivityLogs)) parsed.agentActivityLogs = [];

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
        if (next.plan === 'master') next.plan = 'pro';
        // 기존 사용자 데이터(과거 버전)는 온보딩 완료로 간주해 강제 리다이렉트를 방지
        if (next.onboardingComplete === undefined) next.onboardingComplete = true;
        if (next.age === undefined) next.age = null;
        if (next.ageVerifiedAt === undefined) next.ageVerifiedAt = null;
        if (next.youthTag === undefined) next.youthTag = normalizeYouthTag(next);
        if (next.userTrack === undefined) next.userTrack = getUserTrack(next);
        if (next.school === undefined) next.school = '';
        if (next.careerRaw === undefined) next.careerRaw = '';
        if (next.careerSummary === undefined) next.careerSummary = '';
        return next;
      });
    }

    const likePreset = {
      '지역상점 숏다큐 스튜디오 파일럿': 42,
      '고등학생 팀 협업 앱 MVP 실험': 35,
      '통학 안전 데이터 제안팀': 28,
      '교내 플라스틱 저감 실행 캠페인팀': 24,
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
      const normalizedCategory = normalizeCategory(next.category, next.title, next.summary);
      if (normalizedCategory !== next.category) {
        next.category = normalizedCategory;
        changed = true;
      }
      if (!next.status) {
        const stages = ['모집 중', '기획 중', '진행 중', '피보팅'];
        next.status = stages[Math.floor(Math.random() * stages.length)];
        changed = true;
      }
      if (!next.moderationStatus) {
        next.moderationStatus = 'approved';
        changed = true;
      }
      if (next.moderationReason === undefined) {
        next.moderationReason = '';
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
      const rawCategory = String(next.category || '').trim();
      const cleanedCategory = sanitizeCategoryName(rawCategory);
      if (cleanedCategory !== rawCategory) {
        next.category = cleanedCategory || '기타';
        changed = true;
      }
      const founder = Array.isArray(parsed.users) ? parsed.users.find(u => u.id === next.founderId) : null;
      if (!next.founderEmail && founder?.email) {
        next.founderEmail = String(founder.email).toLowerCase();
        changed = true;
      }
      if (next.youthProjectTag === undefined) {
        next.youthProjectTag = next.founderId === 'system' ? true : !!(founder && normalizeYouthTag(founder));
        changed = true;
      }
      if (next.projectTrack === undefined && next.youthProjectTag) {
        next.projectTrack = 'Youth';
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
    try {
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith('wethus.hub.selected.')) localStorage.removeItem(k);
      });
    } catch (_) {}
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
    else if (p === 'pro') u.plan = 'pro';
    else if (p === 'master') u.plan = 'master';
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
        ageVerifiedAt: null,
        youthTag: false,
        userTrack: 'Open',
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
      if (user.ageVerifiedAt && Number.isFinite(Number(user.age))) {
        user.youthTag = normalizeYouthTag(user);
        user.userTrack = getUserTrack(user);
      }
    }
    s.currentUserId = user.id;
    s.devMode = false;
    save(s);
    return { user, isNew };
  }

  function registerUser({ name, nickname, email, password, age = null, ageVerifiedAt = null }) {
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
      age: age == null ? null : Number(age),
      ageVerifiedAt: ageVerifiedAt || null,
      youthTag: isYouthByAge(age, ageVerifiedAt),
      userTrack: isYouthByAge(age, ageVerifiedAt) ? 'Youth' : 'Open',
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
    const actor = s.currentUserId || 'dev-temp';
    const me = s.users.find(u => u.id === s.currentUserId);
    const moderationStatus = payload?.moderationStatus || 'approved';
    const founderYouth = !!(me && normalizeYouthTag(me));
    const project = {
      id: uid(),
      founderId: actor,
      teamMembers: [{ id: uid(), name: me?.nickname || me?.name || '대표', role: '대표', bio: '프로젝트 대표', isLeader: true }],
      createdAt: new Date().toISOString(),
      moderationStatus,
      moderationReason: payload?.moderationReason || '',
      moderationReviewedAt: payload?.moderationReviewedAt || null,
      youthProjectTag: founderYouth,
      projectTrack: founderYouth ? 'Youth' : 'Open',
      ...payload
    };
    s.projects.unshift(project);
    s.notifications = s.notifications || [];
    s.notifications.unshift({
      id: uid(),
      type: 'founder_submitted',
      title: '신청 완료',
      body: moderationStatus === 'manual_review'
        ? 'AI가 수동 검토 필요로 판단했습니다. 운영자 확인 후 승인 여부가 안내됩니다.'
        : 'AI 검토 중입니다. 보통 2~3분 내 반영되며, 운영자 확인이 필요하면 1일 내 승인 여부를 확인할 수 있습니다.',
      href: 'notifications.html',
      sender: 'WETHUS',
      unread: true,
      createdAt: new Date().toISOString(),
      userId: actor
    });

    if (moderationStatus === 'manual_review') {
      s.notifications.unshift({
        id: uid(),
        type: 'manual_review_required',
        title: '수동 검수 요청',
        body: `${project.title} 프로젝트에 수동 검수가 필요합니다.`,
        href: `admin.html?projectId=${encodeURIComponent(project.id)}`,
        sender: me?.nickname || me?.name || '신청자',
        unread: true,
        createdAt: new Date().toISOString(),
        userId: ADMIN_MODE_USER_ID
      });
    }

    save(s);
    return project;
  }

  function listProjects() {
    return load().projects;
  }

  function ensureHubState(s) {
    if (!s.projectHubs || typeof s.projectHubs !== 'object') s.projectHubs = {};
    return s.projectHubs;
  }

  function getProjectHub(projectId) {
    const s = load();
    const hubs = ensureHubState(s);
    const base = hubs[projectId] || {};
    return {
      goal: base.goal || '',
      weeklyTodos: Array.isArray(base.weeklyTodos) ? base.weeklyTodos : [],
      recentActivities: Array.isArray(base.recentActivities) ? base.recentActivities : [],
      blocker: base.blocker || '',
      tools: Array.isArray(base.tools) ? base.tools : [],
      teamChat: Array.isArray(base.teamChat) ? base.teamChat : [],
      progress: Array.isArray(base.progress) ? base.progress : [],
      materials: Array.isArray(base.materials) ? base.materials : [],
      aiMentors: Array.isArray(base.aiMentors) ? base.aiMentors : [],
      workLogs: Array.isArray(base.workLogs) ? base.workLogs : [],
      workLogsSig: base.workLogsSig || '',
      updatedAt: base.updatedAt || ''
    };
  }

  function upsertProjectHub(projectId, patch = {}) {
    const s = load();
    const hubs = ensureHubState(s);
    const prev = hubs[projectId] || {};
    hubs[projectId] = {
      ...prev,
      ...patch,
      updatedAt: new Date().toISOString()
    };
    save(s);
    return hubs[projectId];
  }

  function addHubActivity(projectId, text) {
    const hub = getProjectHub(projectId);
    const next = [{ id: uid(), text: String(text || ''), createdAt: new Date().toISOString() }, ...(hub.recentActivities || [])].slice(0, 30);
    upsertProjectHub(projectId, { recentActivities: next });
    return next;
  }

  function myProjects() {
    const s = load();
    return s.projects.filter(p => p.founderId === s.currentUserId || (s.devMode && p.founderId === 'dev-temp'));
  }

  function goLoginIfGuest() {
    const actor = currentActorId();
    if (actor) return false;
    if (typeof location !== 'undefined') {
      setAuthReturnState();
      location.href = 'login.html?next=' + encodeURIComponent(location.pathname + location.search);
    }
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

  function isBookmarked(projectId) {
    const s = load();
    const actor = currentActorId();
    if (!actor) return false;
    return (s.bookmarks || []).some(b => b.projectId === projectId && b.userId === actor);
  }

  function toggleBookmark(projectId) {
    const s = load();
    const actor = currentActorId();
    if (!actor) {
      goLoginIfGuest();
      throw new Error('로그인이 필요합니다.');
    }
    s.bookmarks = s.bookmarks || [];
    const idx = s.bookmarks.findIndex(b => b.projectId === projectId && b.userId === actor);
    let bookmarked = false;
    if (idx === -1) {
      s.bookmarks.push({ id: uid(), projectId, userId: actor, createdAt: new Date().toISOString() });
      bookmarked = true;
    } else {
      s.bookmarks.splice(idx, 1);
      bookmarked = false;
    }
    save(s);
    return { bookmarked };
  }

  function myBookmarkedProjects() {
    const s = load();
    const actor = currentActorId();
    if (!actor) return [];
    const ids = new Set((s.bookmarks || []).filter(b => b.userId === actor).map(b => b.projectId));
    return s.projects.filter(p => ids.has(p.id));
  }

  function myLikedProjects() {
    const actor = currentActorId();
    if (!actor) return [];
    return load().projects.filter(p => Array.isArray(p.likedBy) && p.likedBy.includes(actor));
  }

  function recordProjectView(projectId) {
    const s = load();
    const actor = currentActorId();
    if (!actor || !projectId) return false;
    s.projectViews = Array.isArray(s.projectViews) ? s.projectViews : [];
    s.projectViews.push({ id: uid(), userId: actor, projectId: String(projectId), createdAt: new Date().toISOString() });
    s.projectViews = s.projectViews.slice(-3000);
    save(s);
    return true;
  }

  function getRecommendedProjects(limit = 6) {
    const s = load();
    const actor = currentActorId();
    const max = Math.max(1, Number(limit || 6));
    const all = Array.isArray(s.projects) ? s.projects.slice() : [];
    if (!actor) return all.sort((a,b)=>(b.likes||0)-(a.likes||0)).slice(0, max);

    const likesSet = new Set((all.filter(p => Array.isArray(p.likedBy) && p.likedBy.includes(actor)).map(p => p.id)));
    const bmSet = new Set((s.bookmarks || []).filter(b => b.userId === actor).map(b => b.projectId));
    const appliedSet = new Set((s.applications || []).filter(a => a.userId === actor && a.status === 'applied').map(a => a.projectId));
    const views = (s.projectViews || []).filter(v => v.userId === actor);

    const projectById = new Map(all.map(p => [String(p.id), p]));
    const catScore = {};
    for (const v of views) {
      const p = projectById.get(String(v.projectId));
      if (!p?.category) continue;
      catScore[p.category] = (catScore[p.category] || 0) + 1;
    }
    for (const p of all) {
      if (likesSet.has(p.id) || bmSet.has(p.id) || appliedSet.has(p.id)) {
        if (p.category) catScore[p.category] = (catScore[p.category] || 0) + 3;
      }
    }

    const now = Date.now();
    const ranked = all
      .filter(p => !appliedSet.has(p.id))
      .map(p => {
        const likes = Number(p.likes || 0);
        const comments = Array.isArray(p.comments) ? p.comments.length : 0;
        const ageDays = Math.max(1, (now - new Date(p.createdAt || now).getTime()) / 86400000);
        const freshness = Math.max(0, 1 - ageDays / 21);
        const popularity = Math.min(1, (likes * 0.6 + comments * 1.1) / 42);
        const affinity = Math.min(1, Number(catScore[p.category] || 0) / 8);
        const interactionBoost = likesSet.has(p.id) || bmSet.has(p.id) ? 0.2 : 0;
        const score = affinity * 0.46 + popularity * 0.28 + freshness * 0.22 + interactionBoost + Math.random() * 0.02;
        return { ...p, _recScore: score };
      })
      .sort((a,b) => b._recScore - a._recScore)
      .slice(0, max);

    return ranked;
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

  function isAdminActor() {
    const s = load();
    if (s.devMode) return true;
    const actor = s.currentUserId || null;
    if (!actor) return false;
    if (actor === ADMIN_MODE_USER_ID) return true;
    const u = s.users.find(x => x.id === actor);
    const email = String(u?.email || '').toLowerCase();
    return email === 'admin@wethus.ai' || u?.role === 'admin';
  }

  function updateProject(projectId, patch) {
    const s = load();
    const target = s.projects.find(p => p.id === projectId);
    if (!target) return null;
    const actor = s.currentUserId || (s.devMode ? 'dev-temp' : null);
    const admin = isAdminActor();
    if (!admin && target.founderId !== actor) throw new Error('수정 권한이 없습니다.');
    Object.assign(target, patch || {});
    save(s);
    return target;
  }

  function deleteProject(projectId) {
    const s = load();
    const actor = s.currentUserId || (s.devMode ? 'dev-temp' : null);
    const admin = isAdminActor();
    const idx = s.projects.findIndex(p => p.id === projectId);
    if (idx === -1) return false;
    const target = s.projects[idx];
    if (!admin && target.founderId !== actor) throw new Error('삭제 권한이 없습니다.');
    s.projects.splice(idx, 1);
    s.applications = (s.applications || []).filter(a => a.projectId !== projectId);
    save(s);
    return true;
  }

  function reviewProject(projectId, decision, note) {
    const s = load();
    if (!isAdminActor()) throw new Error('관리자 권한이 필요합니다.');
    const target = s.projects.find(p => p.id === projectId);
    if (!target) return null;
    if (decision === 'approve') {
      target.moderationStatus = 'approved';
      target.moderationReason = note || '';
    } else if (decision === 'reject') {
      target.moderationStatus = 'rejected';
      target.moderationReason = note || '운영자 검토 결과 반려되었습니다.';
    } else {
      return null;
    }
    target.moderationReviewedAt = new Date().toISOString();
    s.notifications = s.notifications || [];
    s.notifications.unshift({
      id: uid(),
      type: 'review_result',
      title: decision === 'approve' ? '프로젝트 승인 완료' : '프로젝트 반려 안내',
      body: decision === 'approve'
        ? '운영자 검토를 통과했습니다. 탐색 탭에서 확인할 수 있습니다.'
        : `운영자 검토 결과: ${target.moderationReason || '반려'}`,
      href: `explore_theme.html`,
      sender: 'WETHUS 운영팀',
      unread: true,
      createdAt: new Date().toISOString(),
      userId: target.founderId || null
    });
    save(s);
    return target;
  }

  function updateCurrentUserProfile(patch) {
    const s = load();
    const u = s.users.find(x => x.id === s.currentUserId);
    if (!u) return null;
    Object.assign(u, patch || {});
    u.youthTag = normalizeYouthTag(u);
    u.userTrack = getUserTrack(u);
    save(s);
    return u;
  }

  function upsertCloudUser(user) {
    const s = load();
    const email = String(user?.email || '').trim().toLowerCase();
    let target = s.users.find(u => (user?.id && u.id === user.id) || (email && String(u.email || '').toLowerCase() === email));
    if (!target) {
      target = {
        id: user?.id || uid(),
        name: user?.name || 'User',
        nickname: user?.nickname || user?.name || 'user',
        email,
        password: '',
        bio: user?.bio || '',
        founderVerified: !!user?.founderVerified,
        profileImage: user?.profileImage || '',
        plan: user?.plan || 'free',
        age: user?.age ?? null,
        ageVerifiedAt: user?.ageVerifiedAt || null,
        youthTag: normalizeYouthTag(user || {}),
        userTrack: getUserTrack(user || {}),
        school: user?.school || '',
        careerRaw: user?.careerRaw || '',
        careerSummary: user?.careerSummary || '',
        onboardingComplete: user?.onboardingComplete === undefined ? true : !!user?.onboardingComplete,
        createdAt: user?.createdAt || new Date().toISOString(),
        googleSub: user?.googleSub || ''
      };
      s.users.push(target);
    } else {
      Object.assign(target, {
        id: user?.id || target.id,
        name: user?.name || target.name,
        nickname: user?.nickname || target.nickname,
        email: email || target.email,
        bio: user?.bio ?? target.bio,
        founderVerified: user?.founderVerified ?? target.founderVerified,
        profileImage: user?.profileImage ?? target.profileImage,
        plan: user?.plan || target.plan,
        age: user?.age ?? target.age,
        ageVerifiedAt: user?.ageVerifiedAt ?? target.ageVerifiedAt,
        youthTag: normalizeYouthTag({ ...target, ...user }),
        userTrack: getUserTrack({ ...target, ...user }),
        school: user?.school ?? target.school,
        careerRaw: user?.careerRaw ?? target.careerRaw,
        careerSummary: user?.careerSummary ?? target.careerSummary,
        onboardingComplete: user?.onboardingComplete === undefined ? target.onboardingComplete : !!user.onboardingComplete,
        googleSub: user?.googleSub ?? target.googleSub
      });
    }
    s.currentUserId = target.id;
    s.devMode = false;
    save(s);
    return target;
  }

  async function syncCloudState(emailInput) {
    const email = String(emailInput || currentUser()?.email || '').trim().toLowerCase();
    if (!email) return { ok: false, reason: 'email-missing' };

    const bases = Array.from(new Set(CLOUD_BASE_CANDIDATES));
    let remoteState = null;

    for (const base of bases) {
      try {
        const u = new URL('/cloud/state', base);
        u.searchParams.set('email', email);
        const r = await fetch(u.toString());
        if (!r.ok) continue;
        const j = await r.json().catch(() => ({}));
        if (j?.state && typeof j.state === 'object') {
          remoteState = j.state;
        }
        if (Array.isArray(j?.globalProjects) && j.globalProjects.length) {
          const local = load();
          const m = new Map((local.projects || []).map(p => [String(p.id), p]));
          for (const gp of j.globalProjects) {
            if (!gp?.id) continue;
            const merged = { ...m.get(String(gp.id)), ...gp };
            if (!merged.founderEmail && merged.founderId) {
              const founder = (local.users || []).find(u => u.id === merged.founderId);
              if (founder?.email) merged.founderEmail = String(founder.email).toLowerCase();
            }
            m.set(String(gp.id), merged);
          }
          local.projects = Array.from(m.values());
          try { localStorage.setItem(KEY, JSON.stringify(local)); } catch (_) {}
        }
        if (remoteState) break;
      } catch (_) {}
    }

    const local = load();
    let chosen = local;
    if (remoteState && typeof remoteState === 'object') {
      const localCount = Array.isArray(local.projects) ? local.projects.length : 0;
      const remoteCount = Array.isArray(remoteState.projects) ? remoteState.projects.length : 0;
      chosen = remoteCount > localCount ? remoteState : local;
      if (chosen === remoteState) {
        try { localStorage.setItem(KEY, JSON.stringify(remoteState)); } catch (_) {}
      }
    }

    const chosenCount = Array.isArray(chosen.projects) ? chosen.projects.length : 0;
    const shouldPush = !!remoteState || chosenCount > 0;
    if (shouldPush) {
      for (const base of bases) {
        try {
          await fetch(new URL('/cloud/state', base).toString(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, state: chosen })
          });
          break;
        } catch (_) {}
      }
    }

    return { ok: true, projects: chosenCount };
  }

  function scheduleCloudSync(reason = 'auto') {
    const me = currentUser();
    if (!me?.email) return;
    if (cloudSyncTimer) clearTimeout(cloudSyncTimer);
    cloudSyncTimer = setTimeout(() => {
      syncCloudState(me.email).catch(() => {});
    }, reason === 'save' ? 900 : 250);
  }

  function startAutoCloudSync() {
    if (cloudAutoPullTimer) return;
    const meNow = currentUser();
    if (meNow?.email) syncCloudState(meNow.email).catch(() => {});
    cloudAutoPullTimer = setInterval(() => {
      const me = currentUser();
      if (!me?.email) return;
      syncCloudState(me.email).catch(() => {});
    }, 15000);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          const me = currentUser();
          if (me?.email) syncCloudState(me.email).catch(() => {});
        }
      });
    }
  }

  function listReviewProjects() {
    return load().projects.filter(p => p.moderationStatus === 'manual_review');
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

  function removeNotification(id) {
    const s = load();
    const actor = currentActorId();
    const idx = (s.notifications || []).findIndex(n => n.id === id && (!n.userId || n.userId === actor));
    if (idx === -1) return false;
    s.notifications.splice(idx, 1);
    save(s);
    return true;
  }

  function dmApiBases() {
    const localBases = ['http://127.0.0.1:8787', 'http://localhost:8787'];
    const remoteBase = window.WETHUS_API_BASE || 'https://wethus-api.onrender.com';
    const isLocalHost = ['localhost', '127.0.0.1'].includes(location.hostname);
    return (isLocalHost
      ? [remoteBase, `${location.protocol}//${location.hostname}:8787`, ...localBases]
      : [remoteBase]).filter(Boolean).map(b => b.replace(/\/$/, ''));
  }

  async function dmFetch(path, options = {}) {
    const actorId = currentActorId();
    const bases = dmApiBases();
    let lastErr;
    for (const base of bases) {
      try {
        const res = await fetch(`${base}${path}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': actorId || '',
            ...(options.headers || {})
          }
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data?.ok === false) throw new Error(data?.error || `dm request failed (${res.status})`);
        return data;
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr || new Error('dm api unavailable');
  }

  function listDmThreadsLocal() {
    const s = load();
    return s.dmThreads || [];
  }

  function listDmMessagesLocal(threadId) {
    const s = load();
    const t = (s.dmThreads || []).find(x => x.id === threadId);
    return t?.messages || [];
  }

  function sendDmLocal(threadId, text) {
    const s = load();
    const actor = currentActorId();
    const u = s.users.find(x => x.id === s.currentUserId);
    const plan = (u?.plan || 'free').toLowerCase();
    if (plan === 'free') throw new Error('Free 플랜은 DM 수신만 가능합니다.');
    const t = (s.dmThreads || []).find(x => x.id === threadId);
    if (!t) throw new Error('대화방을 찾을 수 없습니다.');
    t.messages.push({ id: uid(), from: u?.nickname || u?.name || actor || 'Me', text: text || '', createdAt: new Date().toISOString() });
    save(s);
    return t.messages;
  }

  function listHubChatThreadsLocal() {
    const s = load();
    const actor = currentActorId();
    return (s.projects || [])
      .filter(p => p.founderId === actor)
      .map(p => {
        const hub = getProjectHub(p.id);
        const last = (hub.teamChat || []).slice(-1)[0];
        return {
          id: `hubchat:${p.id}`,
          peerId: `hubchat:${p.id}`,
          peerName: `[팀채팅] ${p.title}`,
          lastMessage: last?.text || '아직 대화가 없습니다.',
          updatedAt: last?.createdAt || p.createdAt,
          messageCount: (hub.teamChat || []).length
        };
      });
  }

  async function listDmThreads() {
    let base = [];
    try {
      const data = await dmFetch('/dm/threads');
      base = data?.threads || [];
    } catch {
      base = listDmThreadsLocal();
    }
    return [...listHubChatThreadsLocal(), ...base];
  }

  async function listDmMessages(threadId) {
    if (String(threadId || '').startsWith('hubchat:')) {
      const projectId = String(threadId).replace('hubchat:', '');
      const hub = getProjectHub(projectId);
      return (hub.teamChat || []).map(m => ({ id: m.id, from: m.from, fromId: m.kind === 'human' ? currentActorId() : 'project-ai', text: m.text, createdAt: m.createdAt }));
    }
    try {
      const data = await dmFetch(`/dm/threads/${encodeURIComponent(threadId)}/messages`);
      return data?.messages || [];
    } catch {
      return listDmMessagesLocal(threadId);
    }
  }

  async function createDmThread({ targetUserId, targetName, targetAvatar } = {}) {
    if (!targetUserId && !targetName) throw new Error('대화 상대가 필요합니다.');
    try {
      const data = await dmFetch('/dm/threads', {
        method: 'POST',
        body: JSON.stringify({ targetUserId, targetName, targetAvatar })
      });
      return data?.thread;
    } catch {
      const s = load();
      const peerName = targetName || '대화 상대';
      let thread = (s.dmThreads || []).find(t => String(t.targetName || '') === String(peerName));
      if (!thread) {
        thread = { id: uid(), targetName: peerName, peerAvatar: targetAvatar || '', messages: [] };
        s.dmThreads.unshift(thread);
        save(s);
      }
      return { id: thread.id, peerName, peerAvatar: thread.peerAvatar || targetAvatar || '' };
    }
  }

  async function requestAgentReply(threadId, userText) {
    try {
      await dmFetch(`/dm/threads/${encodeURIComponent(threadId)}/agent-reply`, {
        method: 'POST',
        body: JSON.stringify({ userText: String(userText || '') })
      });
      return true;
    } catch {
      return false;
    }
  }

  async function sendDm(threadId, text) {
    const s = load();
    const u = s.users.find(x => x.id === s.currentUserId);
    const plan = (u?.plan || 'free').toLowerCase();
    if (plan === 'free') throw new Error('Free 플랜은 DM 수신만 가능합니다.');

    if (String(threadId || '').startsWith('hubchat:')) {
      const projectId = String(threadId).replace('hubchat:', '');
      const hub = getProjectHub(projectId);
      const me = currentUser();
      const next = [...(hub.teamChat || []), { id: uid(), from: me?.nickname || me?.name || 'Me', kind: 'human', text: String(text || ''), createdAt: new Date().toISOString() }].slice(-120);
      upsertProjectHub(projectId, { teamChat: next });
      return listDmMessages(threadId);
    }

    try {
      await dmFetch(`/dm/threads/${encodeURIComponent(threadId)}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text: String(text || '') })
      });
      const threads = await listDmThreads();
      const t = (threads || []).find(x => x.id === threadId);
      const peerId = String(t?.peerId || t?.targetId || '');
      if (peerId.startsWith('agent:')) {
        await requestAgentReply(threadId, text);
      }
      return listDmMessages(threadId);
    } catch {
      return sendDmLocal(threadId, text);
    }
  }

  function listAgents() {
    const s = load();
    return (s.agents || []).slice();
  }

  function ensureAgentProfile(input = {}) {
    const s = load();
    s.agents = s.agents || [];
    s.users = s.users || [];

    const code = String(input.code || input.id || '').trim() || `agent_${Date.now()}`;
    let agent = s.agents.find(a => a.code === code);

    if (!agent) {
      const userId = uid();
      const name = input.name || 'WETHUS Agent';
      const nickname = input.nickname || String(name).replace(/\s+/g, '').toLowerCase();
      const user = {
        id: userId,
        name,
        nickname,
        email: `${code}@agent.wethus.local`,
        password: '',
        bio: input.bio || 'WETHUS 프로젝트 실행을 돕는 에이전트입니다.',
        founderVerified: false,
        profileImage: input.profileImage || '',
        plan: 'master',
        role: 'agent',
        isAgent: true,
        age: null,
        school: '',
        careerRaw: '',
        careerSummary: '',
        onboardingComplete: true,
        createdAt: new Date().toISOString()
      };
      s.users.push(user);
      agent = {
        id: uid(),
        code,
        userId,
        name,
        behavior: input.behavior || {
          exploreWeight: 0.5,
          likeWeight: 0.25,
          commentWeight: 0.2,
          createProjectWeight: 0.05
        },
        maxActionsPerTick: Number(input.maxActionsPerTick || 3),
        enabled: input.enabled !== false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      s.agents.push(agent);
      save(s);
      return agent;
    }

    agent.name = input.name || agent.name;
    agent.enabled = input.enabled === undefined ? agent.enabled : !!input.enabled;
    agent.updatedAt = new Date().toISOString();
    save(s);
    return agent;
  }

  function runAgentTick(agentCode, opts = {}) {
    const s = load();
    const agent = (s.agents || []).find(a => a.code === agentCode || a.id === agentCode);
    if (!agent) throw new Error('에이전트를 찾을 수 없습니다.');
    if (!agent.enabled) throw new Error('비활성화된 에이전트입니다.');

    const user = s.users.find(u => u.id === agent.userId);
    if (!user) throw new Error('에이전트 사용자 프로필이 없습니다.');

    const maxActions = Math.max(1, Math.min(10, Number(opts.maxActions || agent.maxActionsPerTick || 3)));
    const actorBackup = { currentUserId: s.currentUserId, devMode: s.devMode };

    const logs = [];
    const now = new Date().toISOString();
    s.currentUserId = user.id;
    s.devMode = false;
    save(s);

    const projects = (s.projects || []).slice();
    const candidate = projects.filter(p => p.founderId !== user.id);

    const randomPick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const commentPool = [
      '좋은 문제정의네요. 다음 단계 가설 검증 계획이 있으면 더 강해질 것 같아요.',
      '실행 플랜이 명확해서 인상적입니다. 1주 단위 목표를 나누면 더 좋아요.',
      '팀 역할이 선명해요. 우선순위 3개만 먼저 고정해보세요.',
      '아이디어 좋습니다. MVP 범위를 한 번 더 좁히면 속도 낼 수 있어요.'
    ];

    for (let i = 0; i < maxActions; i++) {
      const r = Math.random();
      if (r < 0.45 && candidate.length) {
        const p = randomPick(candidate);
        const out = toggleLike(p.id);
        logs.push({ type: 'like', projectId: p.id, liked: !!out?.liked, createdAt: now });
        continue;
      }
      if (r < 0.85 && candidate.length) {
        const p = randomPick(candidate);
        const text = randomPick(commentPool);
        addComment(p.id, text);
        logs.push({ type: 'comment', projectId: p.id, text, createdAt: now });
        continue;
      }

      const titleSeed = ['실행 로그 공유', '팀 스프린트', '현장 테스트', '문제 재정의'];
      const t = randomPick(titleSeed);
      const categorySeed = ['Startup', 'Film', 'Policy', 'App'];
      const category = randomPick(categorySeed);
      const project = addProject({
        title: `[Agent] ${t} 프로젝트 ${Math.floor(Math.random() * 1000)}`,
        category,
        summary: '에이전트가 탐색 중 발견한 실행 패턴을 기반으로 만든 실험형 프로젝트입니다.',
        desc: '초기 가설 수립 → 인터뷰 → 프로토타입 검증 순서로 운영합니다.',
        status: '기획 중',
        teamSize: '3인',
        roles: '기획 1 · 실행 1 · 기록 1',
        duration: '4주',
        image: `https://picsum.photos/seed/agent-${Date.now()}/1200/700`
      });
      logs.push({ type: 'create_project', projectId: project?.id, title: project?.title, createdAt: now });
    }

    const latest = load();
    latest.agentActivityLogs = latest.agentActivityLogs || [];
    latest.agentActivityLogs.unshift({ id: uid(), agentCode: agent.code, userId: user.id, logs, createdAt: now });
    latest.agentActivityLogs = latest.agentActivityLogs.slice(0, 400);
    latest.currentUserId = actorBackup.currentUserId;
    latest.devMode = actorBackup.devMode;
    save(latest);
    return { ok: true, agent: agent.code, actions: logs };
  }

  function listAgentActivityLogs(limit = 50) {
    const s = load();
    return (s.agentActivityLogs || []).slice(0, Math.max(1, Number(limit || 50)));
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
    target.updatedAt = new Date().toISOString();
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

  function setOpenAIApiKey(apiKey) {
    const s = load();
    s.openaiApiKey = apiKey;
    save(s);
  }

  function getOpenAIApiKey() {
    const s = load();
    if (s.openaiApiKey) return s.openaiApiKey;
    if (typeof window !== 'undefined' && window.WETHUS_OPENAI_KEY) {
      s.openaiApiKey = String(window.WETHUS_OPENAI_KEY || '').trim();
      save(s);
      return s.openaiApiKey;
    }
    return DEFAULT_OPENAI_KEY;
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

  async function askChatGPT(prompt) {
    const localBases = ['http://127.0.0.1:8787', 'http://localhost:8787'];
    const remoteBase = window.WETHUS_AI_ENDPOINT || window.WETHUS_API_BASE || 'https://wethus-api.onrender.com';
    const isLocalHost = ['localhost', '127.0.0.1'].includes(location.hostname);
    const apiBases = (isLocalHost
      ? [remoteBase, `${location.protocol}//${location.hostname}:8787`, ...localBases]
      : [remoteBase])
      .filter(Boolean)
      .map(b => b.replace(/\/$/, ''));

    let lastErr;
    for (const base of apiBases) {
      try {
        const res = await fetch(`${base}/ai/moderate-project`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: prompt })
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        if (!data?.ok) throw new Error(data?.error || 'moderate failed');
        return JSON.stringify({ decision: data.decision, reason: data.reason || '' });
      } catch (e) {
        lastErr = e;
      }
    }

    // fallback: direct browser call when backend unavailable
    const apiKey = getOpenAIApiKey();
    if (!apiKey) throw lastErr || new Error('OpenAI API 키가 설정되지 않았습니다.');
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 300
      })
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`ChatGPT 호출 실패: ${t.slice(0, 180)}`);
    }
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error('응답이 비어 있습니다.');
    return text;
  }

  async function askGemini(prompt) {
    const p = String(prompt || '').trim();
    if (!p) throw new Error('프롬프트가 비어 있습니다.');

    // 1) backend proxy 우선 (브라우저 API 키 403 회피)
    const baseCandidates = dmApiBases();
    let backendErr = null;
    for (const base of baseCandidates) {
      try {
        const res = await fetch(`${base}/ai/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: p })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok) throw new Error(data?.error || `ai/chat failed (${res.status})`);
        if (!data?.text) throw new Error('ai/chat empty');
        return data.text;
      } catch (e) {
        backendErr = e;
      }
    }

    // 2) fallback: 직접 Gemini 호출
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
            contents: [{ role: 'user', parts: [{ text: p }] }],
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

    let lastErr = backendErr;
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

  function refreshNavBadges() {
    const unread = listNotifications(99).filter(n => n.unread).length;
    const unreadText = unread > 99 ? '99+' : String(unread);
    document.querySelectorAll('.menu-badge, .side-badge').forEach(el => {
      el.textContent = unreadText;
      el.style.display = unread ? 'inline-grid' : 'none';
    });
  }

  function showTopToast(text) {
    if (!text) return;
    let toast = document.querySelector('.top-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'top-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = text;
    toast.classList.add('show');
    clearTimeout(showTopToast._t1);
    clearTimeout(showTopToast._t2);
    showTopToast._t1 = setTimeout(() => toast.classList.remove('show'), 1700);
    showTopToast._t2 = setTimeout(() => toast.remove(), 2300);
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
      const planClass = plan === 'premium'
        ? 'profile-chip-btn--premium'
        : ((plan === 'pro' || plan === 'master') ? 'profile-chip-btn--master' : '');
      chipWrap.innerHTML = `
        <button class="profile-chip-btn ${planClass}" type="button" aria-label="프로필 메뉴">
          ${avatarHtml}
          <span class="profile-chip-texts"><strong>${u.name || '사용자'}</strong><em>${(u.plan || 'free').toUpperCase()}</em></span>
        </button>
        <div class="notify-dropdown profile-chip-dropdown" style="display:none;">
          <a class="notify-item liquid-metal-btn" href="pricing.html"><strong>요금제</strong><p>${(u.plan || 'free').toUpperCase()} Plan</p></a>
          <a class="notify-item liquid-metal-btn" href="profile.html"><strong>프로필</strong><p>내 프로필 보기 및 수정</p></a>
          <button class="notify-more logout-btn" type="button" id="chipLogoutBtn">로그아웃</button>
        </div>
      `;

      const menuWrap = document.createElement('div');
      menuWrap.className = 'notify-wrap js-side-menu';
      menuWrap.innerHTML = `
        <button class="menu-icon-btn" type="button" aria-label="빠른 메뉴 열기" aria-expanded="false">
          <span></span><span></span><span></span>
          <span class="notify-badge menu-badge" style="display:none;">0</span>
        </button>
        <aside class="side-drawer" style="display:none;">
          <div class="side-drawer-group-title">빠른 메뉴</div>
          <a href="dm.html" class="side-drawer-item side-drawer-item--row">
            <span class="nav-icon-svg" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></span>
            <span>DM</span>
          </a>
          <a href="notifications.html" class="side-drawer-item side-drawer-item--row">
            <span class="nav-icon-svg" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5"/><path d="M9 17a3 3 0 0 0 6 0"/></svg><span class="notify-badge side-badge" style="display:none;">0</span></span>
            <span>알림</span>
          </a>
          <a href="support.html" class="side-drawer-item side-drawer-item--row">
            <span class="nav-icon-svg" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0z"/><path d="M8.5 15a3.5 3.5 0 0 1 7 0"/><circle cx="12" cy="10" r="1"/></svg></span>
            <span>문의</span>
          </a>

          <div class="side-drawer-group-title">AD · 홍보</div>
          <a href="ad-center.html" class="side-drawer-item side-drawer-item--row">
            <span class="nav-icon-svg" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h10M7 13h6"/></svg></span>
            <span>AD 센터</span>
          </a>
          <a href="ad-launch.html" class="side-drawer-item side-drawer-item--row">
            <span class="nav-icon-svg" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l18-5v12l-18-5v-2z"/><path d="M11 14v4a2 2 0 0 0 2 2h1"/></svg></span>
            <span>캠페인 만들기</span>
          </a>

          <div class="side-drawer-group-title side-drawer-settings-title"><span class="nav-icon-svg" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 0-.33 1V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-.33-1 1.65 1.65 0 0 0-1-.6 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.6-1 1.65 1.65 0 0 0-1-.33H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1-.33 1.65 1.65 0 0 0 .6-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6c.3-.21.5-.55.6-1V3a2 2 0 1 1 4 0v.09c.1.45.3.79.6 1a1.65 1.65 0 0 0 1 .6 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.21.3.55.5 1 .6H21a2 2 0 1 1 0 4h-.09c-.45.1-.79.3-1 .6z"/></svg></span><span>설정</span></div>
          <button type="button" class="side-drawer-item side-drawer-item--row" data-lang-switch><span>언어 설정 (KR/EN)</span></button>
          <a href="profile.html" class="side-drawer-item side-drawer-item--row"><span>계정 설정</span></a>
          ${state.devMode ? `<a href="admin.html" class="side-drawer-item side-drawer-item--row"><span>프로젝트 검토</span></a>` : ''}
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
      const langSwitchBtn = menuWrap.querySelector('[data-lang-switch]');
      refreshNavBadges();

      const toggleDrawer = () => {
        const isOpen = drawer.style.display === 'block';
        drawer.style.display = isOpen ? 'none' : 'block';
        openBtn?.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
      };
      openBtn?.addEventListener('click', toggleDrawer);
      langSwitchBtn?.addEventListener('click', () => {
        const cur = localStorage.getItem('wethus.lang') || 'ko';
        const next = cur === 'ko' ? 'en' : 'ko';
        localStorage.setItem('wethus.lang', next);
        alert(`언어 설정이 ${next.toUpperCase()}로 저장되었습니다.`);
        try { applyLanguageUI(); } catch (_) {}
      });
    });
  }

  function setAuthReturnState(extra = {}) {
    try {
      const payload = {
        path: location.pathname,
        search: location.search,
        scrollY: window.scrollY || 0,
        ...extra
      };
      sessionStorage.setItem('wethus_auth_return_state', JSON.stringify(payload));
    } catch (_) {}
  }

  function consumeAuthReturnState() {
    try {
      const raw = sessionStorage.getItem('wethus_auth_return_state');
      if (!raw) return null;
      sessionStorage.removeItem('wethus_auth_return_state');
      return JSON.parse(raw);
    } catch (_) { return null; }
  }

  function initGuestNavGuard() {
    const actor = currentActorId();
    if (actor) return;
    const protectedHrefs = new Set(['founder.html', 'mentor.html', 'profile.html', 'notifications.html', 'dm.html', 'pricing.html']);
    const publicHrefs = new Set(['index.html', 'explore.html', 'explore_theme.html', 'explore_v1.html', 'login.html']);
    document.querySelectorAll('a[href]').forEach(a => {
      const href = (a.getAttribute('href') || '').trim();
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:')) return;
      const base = href.split('?')[0].split('#')[0];
      if (publicHrefs.has(base)) return;
      if (protectedHrefs.has(base)) {
        a.addEventListener('click', () => setAuthReturnState());
        a.setAttribute('href', 'login.html?next=' + encodeURIComponent(location.pathname + location.search));
      }
    });

    // safety: keep explore links public in all guest states
    document.querySelectorAll('a.nav-link, a.btn').forEach(a => {
      const label = (a.textContent || '').replace(/\s+/g, ' ').trim();
      if (label.includes('탐색')) a.setAttribute('href', 'explore.html');
    });
  }

  function initGuestApplyGuard() {
    const actor = currentActorId();
    if (actor) return;
    document.addEventListener('click', (e) => {
      const btn = e.target && e.target.closest && e.target.closest('.apply-btn');
      if (!btn) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const next = location.pathname + location.search;
      location.href = 'login.html?next=' + encodeURIComponent(next);
    }, true);
  }

  function applyLanguageUI() {
    let lang = 'ko';
    try { lang = localStorage.getItem('wethus.lang') || 'ko'; } catch (_) {}
    const dict = {
      en: {
        'nav.explore': 'Explore',
        'nav.hub': 'Project Hub',
        'nav.mentor': 'Mentor',
        'ad.center.title': 'AD Center',
        'ad.center.desc': 'Manage promotion operations in one place. Track campaign status, budget, and performance.',
        'ad.center.summary': 'Summary',
        'ad.center.active': 'Active Campaigns',
        'ad.center.budget': 'Monthly Budget',
        'ad.center.reach': 'Reached Users',
        'ad.center.recommend': 'Recommended Actions',
        'ad.center.action1': 'Write a 3-line campaign copy from your latest project-hub updates.',
        'ad.center.action2': 'Start with one target among Startup / Film / Policy / Science.',
        'ad.center.action3': 'Review every 24h and change only one variable per test.',
        'ad.center.cta': 'Create Campaign',
        'ad.launch.title': 'Create Campaign',
        'ad.launch.desc': 'Start a promotion campaign quickly. (MVP form)',
        'ad.launch.name': 'Campaign Name',
        'ad.launch.name.placeholder': 'e.g., WETHUS Startup Recruitment Campaign',
        'ad.launch.target': 'Target Category',
        'ad.launch.budget': 'Daily Budget (KRW)',
        'ad.launch.copy': 'Ad Copy',
        'ad.launch.cancel': 'Cancel',
        'ad.launch.save': 'Save',
        'ad.launch.placeholder.copy': 'Write your project strengths and why people should join now.'
      }
    };
    const map = dict[lang] || {};
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key && map[key]) el.textContent = map[key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key && map[key]) el.setAttribute('placeholder', map[key]);
    });
  }

  function applyAuthReturnState() {
    try {
      const raw = sessionStorage.getItem('wethus_auth_return_state');
      if (!raw) return;
      const st = JSON.parse(raw);
      if (!st || st.path !== location.pathname) return;
      if (typeof st.scrollY === 'number') {
        setTimeout(() => window.scrollTo(0, st.scrollY), 0);
      }
    } catch (_) {}
  }

  function ensureFavicon() {
    try {
      let link = document.querySelector('link[rel="icon"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'icon');
        document.head.appendChild(link);
      }
      if (!link.getAttribute('href')) {
        link.setAttribute('href', 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22%3E%3Ctext y=%2250%22 x=%228%22 font-size=%2248%22%3E%F0%9F%94%A5%3C/text%3E%3C/svg%3E');
      }
    } catch (_) {}
  }

  function initNotifyToast() {
    const seenKey = 'wethus_last_toast_notification';
    const latest = listNotifications(20).find(n => n.unread && n.type === 'review_result');

    const pendingToast = sessionStorage.getItem('wethus_pending_toast');
    if (pendingToast) {
      sessionStorage.removeItem('wethus_pending_toast');
      if (latest?.id) sessionStorage.setItem(seenKey, latest.id);
      showTopToast(pendingToast);
      return;
    }

    if (!latest) return;
    const seen = sessionStorage.getItem(seenKey);
    if (seen === latest.id) return;
    sessionStorage.setItem(seenKey, latest.id);
    showTopToast(latest.title || '새 알림');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      ensureFavicon();
      initGuestNavGuard();
      initGuestApplyGuard();
      initNotificationNav();
      applyLanguageUI();
      applyAuthReturnState();
      initNotifyToast();
      startAutoCloudSync();
    });
  } else {
    ensureFavicon();
    initGuestNavGuard();
    initGuestApplyGuard();
    initNotificationNav();
    applyLanguageUI();
    applyAuthReturnState();
    initNotifyToast();
    startAutoCloudSync();
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
    getProjectHub,
    upsertProjectHub,
    addHubActivity,
    toggleLike,
    isBookmarked,
    toggleBookmark,
    myBookmarkedProjects,
    myLikedProjects,
    recordProjectView,
    getRecommendedProjects,
    addComment,
    updateProject,
    deleteProject,
    reviewProject,
    listReviewProjects,
    isAdminActor,
    updateCurrentUserProfile,
    upsertCloudUser,
    syncCloudState,
    currentPlan,
    setCurrentUserPlan,
    listNotifications,
    unreadNotificationCount,
    refreshNavBadges,
    showTopToast,
    setAuthReturnState,
    consumeAuthReturnState,
    addNotification,
    markNotificationRead,
    markAllNotificationsRead,
    removeNotification,
    listDmThreads,
    listDmMessages,
    createDmThread,
    sendDm,
    requestAgentReply,
    listAgents,
    ensureAgentProfile,
    runAgentTick,
    listAgentActivityLogs,
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
    setOpenAIApiKey,
    getOpenAIApiKey,
    askChatGPT,
    askGemini
  };
})();
