import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = Number(process.env.PORT || 8787);
const DEFAULT_GOOGLE_CLIENT_ID = '196934770979-6ntmgcrs6k6jkifskspasg4uie5irgec.apps.googleusercontent.com';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID;
const JWT_SECRET = process.env.JWT_SECRET || 'change-me';
const AI_PROVIDER = (process.env.AI_PROVIDER || 'openai').toLowerCase();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const PASS_ENABLED = String(process.env.PASS_ENABLED || 'false').toLowerCase() === 'true';
const NICE_SITE_CODE = process.env.NICE_SITE_CODE || '';
const NICE_SITE_PASSWORD = process.env.NICE_SITE_PASSWORD || '';
const PASS_RETURN_URL = process.env.PASS_RETURN_URL || 'http://localhost:8787/pass/success';
const PASS_ERROR_URL = process.env.PASS_ERROR_URL || 'http://localhost:8787/pass/fail';
const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:8080', 'http://127.0.0.1:8080', 'https://wethus-2.vercel.app'];
const ALLOWED_ORIGINS = Array.from(new Set([
  ...DEFAULT_ALLOWED_ORIGINS,
  ...(process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)
]));

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
const DATA_DIR = path.join(__dirname, 'data');
const USERS_DB = path.join(DATA_DIR, 'users.json');
const DM_DB = path.join(DATA_DIR, 'dm.json');

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(USERS_DB)) fs.writeFileSync(USERS_DB, JSON.stringify({ users: [] }, null, 2));
  if (!fs.existsSync(DM_DB)) fs.writeFileSync(DM_DB, JSON.stringify({ threads: [] }, null, 2));
}
function readUsers() {
  ensureDb();
  try {
    const raw = fs.readFileSync(USERS_DB, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.users) ? parsed.users : [];
  } catch {
    return [];
  }
}
function writeUsers(users) {
  ensureDb();
  fs.writeFileSync(USERS_DB, JSON.stringify({ users }, null, 2));
}
function readDmThreads() {
  ensureDb();
  try {
    const raw = fs.readFileSync(DM_DB, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.threads) ? parsed.threads : [];
  } catch {
    return [];
  }
}
function writeDmThreads(threads) {
  ensureDb();
  fs.writeFileSync(DM_DB, JSON.stringify({ threads }, null, 2));
}
function normEmail(email) {
  return String(email || '').trim().toLowerCase();
}
function hashPw(pw) {
  return crypto.createHash('sha256').update(String(pw || '')).digest('hex');
}

function getActorId(req) {
  return String(req.headers['x-user-id'] || req.body?.actorId || req.query?.actorId || '').trim();
}

function requireActor(req, res) {
  const actorId = getActorId(req);
  if (!actorId) {
    res.status(401).json({ ok: false, error: 'actor required' });
    return null;
  }
  return actorId;
}

function getUserNameById(userId) {
  const users = readUsers();
  const user = users.find(u => String(u.id) === String(userId));
  return user?.nickname || user?.name || user?.email || '사용자';
}

function buildAgentReply(agentCode, userText = '') {
  const text = String(userText || '').trim();
  const oneLine = (s) => String(s || '').replace(/\s+/g, ' ').trim();
  const core = {
    project_management_ai: '프로젝트를 1) 목표정의 2) 2주 스프린트 3) 검증지표로 쪼개서 시작하세요.',
    branding_ai: '브랜드는 문제-대상-약속 한 문장으로 먼저 고정하면 훨씬 선명해집니다.',
    vision_ai: '비전 문장은 “누구를 위해 어떤 변화를 만들 것인지”로 작성해보세요.',
    developer_ai: '기술은 확장성보다 검증속도 우선: MVP 핵심 기능 2~3개만 먼저 구현하세요.',
    marketing_ai: '타깃 1개 세그먼트에 집중하고 첫 50명 반응 데이터를 빠르게 모으세요.',
    science_competition_ai: '가설-변수-측정지표를 표로 먼저 정리하면 대회형 연구 품질이 크게 올라갑니다.',
    film_production_ai: '스토리보드와 쇼트리스트를 먼저 잠그고 촬영일정은 씬 단위로 분할하세요.',
    product_brand_ai: '제품가치와 브랜드 스토리를 같은 메시지 축으로 맞추는 게 핵심입니다.',
    art_exhibition_ai: '전시는 관람 동선과 메시지 흐름을 먼저 설계한 뒤 작품을 배치하세요.',
    indie_publishing_ai: '출판은 기획-목차-샘플 챕터 순으로 검증하면 완성도가 안정됩니다.',
    video_support_ai: '촬영 전에 러닝타임 기준 컷 분량을 먼저 확정하면 편집 효율이 좋아집니다.',
    startup_support_ai: '문제 인터뷰 10건으로 니즈를 검증하고 MVP 범위를 반으로 줄여보세요.',
    startup_competition_ai: '대회는 문제정의-솔루션-시장-실행계획-지표 순으로 발표 구조를 고정하세요.',
    startup_ai: '핵심 가설 1개를 정하고 이번 주에 검증 가능한 실험 1개만 실행하세요.',
    social_service_ai: '봉사 프로젝트는 수혜자 정의와 임팩트 측정지표를 같이 설계해야 지속됩니다.',
    policy_proposal_ai: '정책제안은 현황데이터-문제원인-대안-기대효과를 한 세트로 제시해야 설득력이 생깁니다.',
    campaign_ai: '캠페인은 메시지 1개와 행동유도 CTA 1개를 명확히 잡는 것이 우선입니다.',
    thesis_writing_ai: '소논문은 연구질문-선행연구-방법-결과-한계 구조를 먼저 템플릿으로 고정하세요.',
    student_research_ai: '학생주도연구는 자기주도성 근거(질문선정 이유, 실험 반복기록)를 남기는 게 중요합니다.',
    advisor_professor_ai: '지도교수 커뮤니케이션은 주간 진행요약 5줄 + 다음주 계획 3줄 형식이 가장 효율적입니다.',
    environment_solution_ai: '환경문제 해결은 원인 분석 후 개입지점을 1개 좁혀 파일럿부터 검증하세요.'
  };
  const base = core[agentCode] || '요청 내용을 실행 단위로 쪼개고, 오늘 안에 할 수 있는 1단계를 먼저 정해볼게요.';
  if (!text) return base;
  return oneLine(`${base} 지금 질문 기준으로는 "${text.slice(0, 120)}"를 중심으로 다음 행동을 정리해드릴게요.`);
}

function threadPeer(thread, actorId) {
  if (!thread) return { peerId: '', peerName: '알 수 없음', peerAvatar: '' };
  const participants = Array.isArray(thread.participants) ? thread.participants : [];
  const peer = participants.find(p => p !== actorId) || thread.targetId || '';
  const peerName = thread.targetName || getUserNameById(peer) || '대화 상대';
  const peerAvatar = thread.targetAvatar || '';
  return { peerId: peer, peerName, peerAvatar };
}

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error('CORS not allowed'));
  },
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.get('/health', (_, res) => res.json({ ok: true }));

app.get('/dm/threads', (req, res) => {
  const actorId = requireActor(req, res);
  if (!actorId) return;
  const threads = readDmThreads()
    .filter(t => Array.isArray(t.participants) && t.participants.includes(actorId))
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
    .map(t => {
      const { peerId, peerName, peerAvatar } = threadPeer(t, actorId);
      return {
        id: t.id,
        peerId,
        peerName,
        peerAvatar,
        lastMessage: t.lastMessage || '',
        updatedAt: t.updatedAt || t.createdAt,
        unreadCount: 0,
        messageCount: Array.isArray(t.messages) ? t.messages.length : 0
      };
    });
  return res.json({ ok: true, threads });
});

app.post('/dm/threads', (req, res) => {
  const actorId = requireActor(req, res);
  if (!actorId) return;
  const rawTargetUserId = String(req.body?.targetUserId || '').trim();
  const rawTargetName = String(req.body?.targetName || '').trim();
  const rawTargetAvatar = String(req.body?.targetAvatar || '').trim();
  if (!rawTargetUserId && !rawTargetName) return res.status(400).json({ ok: false, error: 'target required' });

  const targetUserId = rawTargetUserId || `alias:${rawTargetName.toLowerCase().replace(/\s+/g, '_')}`;
  const targetName = rawTargetName || getUserNameById(targetUserId);
  if (targetUserId === actorId) return res.status(400).json({ ok: false, error: 'self dm not allowed' });

  const threads = readDmThreads();
  let thread = threads.find(t => {
    const p = Array.isArray(t.participants) ? t.participants : [];
    return p.length === 2 && p.includes(actorId) && p.includes(targetUserId);
  });

  if (!thread) {
    const now = new Date().toISOString();
    thread = {
      id: crypto.randomUUID(),
      participants: [actorId, targetUserId],
      targetId: targetUserId,
      targetName,
      targetAvatar: rawTargetAvatar || '',
      createdAt: now,
      updatedAt: now,
      lastMessage: '',
      messages: []
    };
    threads.push(thread);
    writeDmThreads(threads);
  }

  const { peerId, peerName, peerAvatar } = threadPeer(thread, actorId);
  return res.json({ ok: true, thread: { id: thread.id, peerId, peerName, peerAvatar, messageCount: thread.messages.length } });
});

app.get('/dm/threads/:threadId/messages', (req, res) => {
  const actorId = requireActor(req, res);
  if (!actorId) return;
  const threadId = String(req.params.threadId || '').trim();
  const thread = readDmThreads().find(t => t.id === threadId);
  if (!thread) return res.status(404).json({ ok: false, error: 'thread not found' });
  if (!Array.isArray(thread.participants) || !thread.participants.includes(actorId)) {
    return res.status(403).json({ ok: false, error: 'forbidden' });
  }
  return res.json({ ok: true, messages: Array.isArray(thread.messages) ? thread.messages : [] });
});

app.post('/dm/threads/:threadId/messages', (req, res) => {
  const actorId = requireActor(req, res);
  if (!actorId) return;
  const text = String(req.body?.text || '').trim();
  if (!text) return res.status(400).json({ ok: false, error: 'text required' });

  const threadId = String(req.params.threadId || '').trim();
  const threads = readDmThreads();
  const thread = threads.find(t => t.id === threadId);
  if (!thread) return res.status(404).json({ ok: false, error: 'thread not found' });
  if (!Array.isArray(thread.participants) || !thread.participants.includes(actorId)) {
    return res.status(403).json({ ok: false, error: 'forbidden' });
  }

  const message = {
    id: crypto.randomUUID(),
    fromId: actorId,
    from: getUserNameById(actorId),
    text,
    createdAt: new Date().toISOString()
  };
  thread.messages = Array.isArray(thread.messages) ? thread.messages : [];
  thread.messages.push(message);
  thread.lastMessage = text;
  thread.updatedAt = message.createdAt;
  writeDmThreads(threads);
  return res.json({ ok: true, message });
});

app.post('/dm/threads/:threadId/agent-reply', (req, res) => {
  const actorId = requireActor(req, res);
  if (!actorId) return;
  const threadId = String(req.params.threadId || '').trim();
  const userText = String(req.body?.userText || '').trim();

  const threads = readDmThreads();
  const thread = threads.find(t => t.id === threadId);
  if (!thread) return res.status(404).json({ ok: false, error: 'thread not found' });
  if (!Array.isArray(thread.participants) || !thread.participants.includes(actorId)) {
    return res.status(403).json({ ok: false, error: 'forbidden' });
  }

  const targetId = String(thread.targetId || '');
  if (!targetId.startsWith('agent:')) {
    return res.status(400).json({ ok: false, error: 'not an agent thread' });
  }
  const agentCode = targetId.replace(/^agent:/, '').split(':')[0];
  const replyText = buildAgentReply(agentCode, userText);
  const now = new Date().toISOString();
  const message = {
    id: crypto.randomUUID(),
    fromId: targetId,
    from: thread.targetName || agentCode,
    text: replyText,
    createdAt: now
  };
  thread.messages = Array.isArray(thread.messages) ? thread.messages : [];
  thread.messages.push(message);
  thread.lastMessage = replyText;
  thread.updatedAt = now;
  writeDmThreads(threads);
  return res.json({ ok: true, message });
});

async function callGemini(prompt, retries = 2) {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000 + i * 3000);
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.25, maxOutputTokens: 220 }
        })
      });
      clearTimeout(timeout);
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!text) throw new Error('empty ai response');
      return text;
    } catch (e) {
      lastErr = e;
      if (i < retries) await new Promise(rs => setTimeout(rs, 450 * (i + 1)));
    }
  }
  throw lastErr || new Error('ai failed');
}

async function callOpenAI(prompt, retries = 2) {
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured');
  const url = 'https://api.openai.com/v1/chat/completions';

  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 18000 + i * 3000);
      const r = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: OPENAI_MODEL,
          temperature: 0.25,
          max_tokens: 260,
          messages: [
            { role: 'system', content: "You rewrite youth profile career notes into concise Korean bullets using only '-(전)' or '-(현)' prefixes." },
            { role: 'user', content: prompt }
          ]
        })
      });
      clearTimeout(timeout);
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      const text = data?.choices?.[0]?.message?.content?.trim();
      if (!text) throw new Error('empty ai response');
      return text;
    } catch (e) {
      lastErr = e;
      if (i < retries) await new Promise(rs => setTimeout(rs, 500 * (i + 1)));
    }
  }
  throw lastErr || new Error('openai failed');
}

async function callAi(prompt) {
  if (AI_PROVIDER === 'openai') return callOpenAI(prompt, 2);
  return callGemini(prompt, 2);
}

app.post('/ai/career-summary', async (req, res) => {
  try {
    const raw = String(req.body?.raw || '').trim();
    if (!raw) return res.status(400).json({ ok: false, error: 'raw is required' });
    const prompt = `다음 경력사항을 정확히 '-(전) ...' 또는 '-(현) ...' 형식의 불릿으로만 출력해줘. 최대 6줄. 원문 복붙 금지, 핵심만 간결히.\n${raw}`;
    const text = await callAi(prompt);
    return res.json({ ok: true, summary: text });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || 'career summary failed' });
  }
});

app.post('/ai/moderate-project', async (req, res) => {
  try {
    const text = String(req.body?.text || '').trim();
    if (!text) return res.status(400).json({ ok: false, error: 'text is required' });
    const prompt = `You are a strict but low-false-positive safety reviewer for a teen project platform. Return JSON only: {"decision":"allow|review|block","reason":"..."}. Block only if clearly harmful/sexual abuse/hate/violent extremism. Review if ambiguous. Text:\n${text.slice(0, 2400)}`;

    let out = '';
    if (AI_PROVIDER === 'openai') {
      if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured');
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          temperature: 0.2,
          max_tokens: 300,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      out = data?.choices?.[0]?.message?.content?.trim() || '';
    } else {
      out = await callGemini(prompt, 2);
    }

    const parsed = JSON.parse(String(out).match(/\{[\s\S]*\}/)?.[0] || '{}');
    const decision = ['allow','review','block'].includes(parsed.decision) ? parsed.decision : 'review';
    return res.json({ ok: true, decision, reason: parsed.reason || '' });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || 'moderation failed' });
  }
});

app.post('/ai/image-prompt', async (req, res) => {
  try {
    const title = String(req.body?.title || '').trim();
    const description = String(req.body?.description || '').trim();
    const category = String(req.body?.category || '').trim();
    if (!title || !description) return res.status(400).json({ ok: false, error: 'title/description required' });
    const prompt = `Create one concise English visual prompt (max 12 words) for a cinematic poster image. Category: ${category}. Title: ${title}. Description: ${description.slice(0,300)}`;
    const text = await callAi(prompt);
    return res.json({ ok: true, prompt: String(text).replace(/[\n\r]/g, ' ').trim().slice(0, 140) });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || 'image prompt failed' });
  }
});

app.post('/pass/start', (req, res) => {
  if (!PASS_ENABLED || !NICE_SITE_CODE || !NICE_SITE_PASSWORD) {
    return res.status(501).json({
      ok: false,
      error: 'PASS integration not configured. NICE contract/module required.',
      required: ['NICE_SITE_CODE', 'NICE_SITE_PASSWORD', 'PASS_ENABLED=true']
    });
  }
  return res.json({
    ok: true,
    mode: 'contract-required',
    message: 'NICE CheckPlus SDK/CPClient module must be installed on server (Java/Spring or official module).',
    returnUrl: PASS_RETURN_URL,
    errorUrl: PASS_ERROR_URL
  });
});

app.post('/auth/register', (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    const nickname = String(req.body?.nickname || '').trim() || name;
    const email = normEmail(req.body?.email);
    const password = String(req.body?.password || '');
    if (!name || !email || !password) return res.status(400).json({ ok: false, error: 'name/email/password required' });
    const users = readUsers();
    if (users.some(u => normEmail(u.email) === email)) return res.status(409).json({ ok: false, error: '이미 가입된 이메일입니다.' });
    const now = new Date().toISOString();
    const user = {
      id: crypto.randomUUID(),
      name,
      nickname,
      email,
      passwordHash: hashPw(password),
      plan: 'free',
      founderVerified: false,
      profileImage: '',
      bio: '',
      onboardingComplete: false,
      school: '',
      careerRaw: '',
      careerSummary: '',
      createdAt: now,
      updatedAt: now
    };
    users.push(user);
    writeUsers(users);
    return res.json({ ok: true, user: { ...user, passwordHash: undefined } });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || 'register failed' });
  }
});

app.post('/auth/login', (req, res) => {
  try {
    const email = normEmail(req.body?.email);
    const password = String(req.body?.password || '');
    if (!email || !password) return res.status(400).json({ ok: false, error: 'email/password required' });
    const users = readUsers();
    const user = users.find(u => normEmail(u.email) === email);
    if (!user) return res.status(404).json({ ok: false, error: '가입된 계정이 없습니다.' });
    if (!user.passwordHash) return res.status(400).json({ ok: false, error: '구글 가입 계정입니다. Google 로그인으로 이용해주세요.' });
    if (user.passwordHash !== hashPw(password)) return res.status(401).json({ ok: false, error: '비밀번호가 일치하지 않습니다.' });
    return res.json({ ok: true, user: { ...user, passwordHash: undefined } });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || 'login failed' });
  }
});

app.post('/auth/google', async (req, res) => {
  try {
    if (!GOOGLE_CLIENT_ID) return res.status(500).json({ ok: false, error: 'GOOGLE_CLIENT_ID not configured' });
    const credential = req.body?.credential;
    if (!credential) return res.status(400).json({ ok: false, error: 'Missing credential' });

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload?.email) {
      return res.status(401).json({ ok: false, error: 'Invalid Google token payload' });
    }

    const email = normEmail(payload.email);
    const users = readUsers();
    let user = users.find(u => (u.googleSub && u.googleSub === payload.sub) || normEmail(u.email) === email);
    const now = new Date().toISOString();
    if (!user) {
      user = {
        id: crypto.randomUUID(),
        name: payload.name || email,
        nickname: String(payload.name || email.split('@')[0] || 'google_user').replace(/\s+/g, ''),
        email,
        passwordHash: '',
        plan: 'free',
        founderVerified: false,
        profileImage: payload.picture || '',
        bio: '',
        onboardingComplete: false,
        school: '',
        careerRaw: '',
        careerSummary: '',
        googleSub: payload.sub,
        createdAt: now,
        updatedAt: now
      };
      users.push(user);
    } else {
      user.googleSub = payload.sub;
      user.name = payload.name || user.name;
      user.profileImage = payload.picture || user.profileImage || '';
      user.updatedAt = now;
    }
    writeUsers(users);

    const token = jwt.sign({ sub: payload.sub, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('wethus_session', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({ ok: true, user: { ...user, passwordHash: undefined } });
  } catch (err) {
    console.error('[auth/google] failed:', err?.message || err);
    return res.status(401).json({ ok: false, error: err?.message || 'Google auth failed' });
  }
});

app.get('/auth/session', (req, res) => {
  try {
    const token = req.cookies?.wethus_session;
    if (!token) return res.status(401).json({ ok: false });
    const decoded = jwt.verify(token, JWT_SECRET);
    return res.json({ ok: true, session: decoded });
  } catch {
    return res.status(401).json({ ok: false });
  }
});

app.post('/auth/logout', (req, res) => {
  res.clearCookie('wethus_session');
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`WETHUS auth backend listening on :${PORT}`);
});
