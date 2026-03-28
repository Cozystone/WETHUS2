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

const AGENT_SYSTEM_PROMPTS = {
  project_management_ai: 'You are a senior project management mentor for youth teams. Respond in Korean. Give practical, step-by-step execution guidance with priorities and clear next action.',
  branding_ai: 'You are a branding mentor. Respond in Korean with clear brand positioning, messaging, and identity guidance.',
  vision_ai: 'You are a vision mentor. Respond in Korean and help define mission, long-term direction, and measurable milestones.',
  developer_ai: 'You are a software engineering mentor. Respond in Korean with technical clarity and MVP-first decisions.',
  marketing_ai: 'You are a growth marketing mentor. Respond in Korean with target, channel, and experiment suggestions.',
  science_competition_ai: 'You are a science competition mentor. Respond in Korean with hypothesis, method, measurement and presentation advice.',
  film_production_ai: 'You are a film production mentor. Respond in Korean with planning, shoot, edit, and storytelling guidance.',
  product_brand_ai: 'You are a product-brand mentor. Respond in Korean with product positioning and brand strategy.',
  art_exhibition_ai: 'You are an art exhibition mentor. Respond in Korean with curatorial flow and execution details.',
  indie_publishing_ai: 'You are an indie publishing mentor. Respond in Korean with structure, editing and production advice.',
  video_support_ai: 'You are a video production support mentor. Respond in Korean with practical production checklists.',
  startup_support_ai: 'You are a startup execution mentor. Respond in Korean with customer validation and MVP guidance.',
  startup_competition_ai: 'You are a startup competition mentor. Respond in Korean with pitch strategy and judging criteria alignment.',
  startup_ai: 'You are a startup mentor. Respond in Korean with concrete experiments and execution steps.',
  social_service_ai: 'You are a social impact mentor. Respond in Korean with beneficiary focus and impact metrics.',
  policy_proposal_ai: 'You are a policy proposal mentor. Respond in Korean with evidence-based proposal structure.',
  campaign_ai: 'You are a campaign mentor. Respond in Korean with message strategy and action design.',
  thesis_writing_ai: 'You are a mini-thesis writing mentor. Respond in Korean with research structure and academic writing guidance.',
  student_research_ai: 'You are a student-led research mentor. Respond in Korean with inquiry framing and iterative method advice.',
  advisor_professor_ai: 'You are an academic advisor mentor. Respond in Korean with supervision-ready summaries and progress framing.',
  environment_solution_ai: 'You are an environmental problem-solving mentor. Respond in Korean with actionable intervention plans.'
};

function buildAgentFallbackReply(agentCode, userText = '') {
  const text = String(userText || '').trim();
  const oneLine = (s) => String(s || '').replace(/\s+/g, ' ').trim();
  const core = {
    project_management_ai: '목표-스프린트-검증지표 순서로 쪼개서 실행해보세요.',
    branding_ai: '문제-대상-약속을 한 문장으로 먼저 고정해보세요.',
    vision_ai: '누구를 위해 어떤 변화를 만들지 한 문장 비전으로 정리해보세요.',
    developer_ai: '확장성보다 MVP 검증 속도를 우선해 핵심 기능부터 구현하세요.',
    marketing_ai: '타깃 세그먼트 1개와 실험 1개를 먼저 선택해 실행해보세요.',
    science_competition_ai: '가설-변수-측정지표를 표로 먼저 정리해보세요.',
    film_production_ai: '스토리보드와 쇼트리스트를 먼저 확정해보세요.',
    product_brand_ai: '제품 가치와 브랜드 메시지를 같은 축으로 맞춰보세요.',
    art_exhibition_ai: '관람 동선과 메시지 흐름을 먼저 설계해보세요.',
    indie_publishing_ai: '기획-목차-샘플 원고 순서로 검증해보세요.',
    video_support_ai: '러닝타임 기준 컷 분량부터 먼저 고정해보세요.',
    startup_support_ai: '문제 인터뷰로 니즈를 검증하고 MVP 범위를 줄여보세요.',
    startup_competition_ai: '문제정의-해결-시장-실행-지표 순으로 발표를 구성해보세요.',
    startup_ai: '핵심 가설 1개와 검증 실험 1개를 먼저 실행해보세요.',
    social_service_ai: '수혜자와 임팩트 지표를 함께 정의해보세요.',
    policy_proposal_ai: '현황-원인-대안-효과 구조로 제안서를 설계해보세요.',
    campaign_ai: '메시지 1개와 CTA 1개를 명확히 잡아보세요.',
    thesis_writing_ai: '연구질문-선행연구-방법-결과-한계 템플릿으로 먼저 정리해보세요.',
    student_research_ai: '질문선정 이유와 반복실험 기록을 중심으로 진행해보세요.',
    advisor_professor_ai: '주간 요약 5줄과 다음주 계획 3줄로 보고 구조를 맞춰보세요.',
    environment_solution_ai: '개입지점을 1개로 좁혀 파일럿 실험부터 시작해보세요.'
  };
  const base = core[agentCode] || '요청을 실행 단위로 쪼개서 오늘 할 1단계를 먼저 정해볼게요.';
  if (!text) return base;
  return oneLine(`${base} 우선 질문의 핵심인 "${text.slice(0, 100)}"부터 정리해볼게요.`);
}

async function generateAgentReply(agentCode, userText = '') {
  const system = AGENT_SYSTEM_PROMPTS[agentCode] || 'You are a helpful specialized project mentor. Respond in Korean with practical steps.';
  const prompt = `SYSTEM:\n${system}\n\nUSER:\n${String(userText || '').slice(0, 2000)}\n\n지침:\n- 말투는 자연스럽고 대화형으로 답변\n- 필요한 경우에만 불릿을 사용하고 과도한 템플릿 반복 금지\n- 사용자 문맥을 반영한 구체적 다음 행동 제안`;
  try {
    const out = await callAi(prompt, { systemPrompt: system, temperature: 0.7, maxTokens: 420 });
    return String(out || '').trim() || buildAgentFallbackReply(agentCode, userText);
  } catch {
    return buildAgentFallbackReply(agentCode, userText);
  }
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

app.post('/dm/threads/:threadId/agent-reply', async (req, res) => {
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
  const replyText = await generateAgentReply(agentCode, userText);
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

async function callOpenAI(prompt, retries = 2, opts = {}) {
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured');
  const url = 'https://api.openai.com/v1/chat/completions';
  const systemPrompt = String(opts.systemPrompt || 'You are a helpful assistant. Respond clearly and naturally in Korean.');
  const temperature = Number.isFinite(opts.temperature) ? Number(opts.temperature) : 0.35;
  const maxTokens = Number.isFinite(opts.maxTokens) ? Number(opts.maxTokens) : 320;

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
          temperature,
          max_tokens: maxTokens,
          messages: [
            { role: 'system', content: systemPrompt },
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

async function callAi(prompt, opts = {}) {
  if (AI_PROVIDER === 'openai') return callOpenAI(prompt, 2, opts);
  return callGemini(prompt, 2);
}

app.post('/ai/career-summary', async (req, res) => {
  try {
    const raw = String(req.body?.raw || '').trim();
    if (!raw) return res.status(400).json({ ok: false, error: 'raw is required' });
    const prompt = `다음 경력사항을 정확히 '-(전) ...' 또는 '-(현) ...' 형식의 불릿으로만 출력해줘. 최대 6줄. 원문 복붙 금지, 핵심만 간결히.\n${raw}`;
    const text = await callAi(prompt, {
      systemPrompt: "You rewrite youth profile career notes into concise Korean bullets using only '-(전)' or '-(현)' prefixes.",
      temperature: 0.2,
      maxTokens: 260
    });
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
