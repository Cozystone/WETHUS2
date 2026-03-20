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

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(USERS_DB)) fs.writeFileSync(USERS_DB, JSON.stringify({ users: [] }, null, 2));
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
function normEmail(email) {
  return String(email || '').trim().toLowerCase();
}
function hashPw(pw) {
  return crypto.createHash('sha256').update(String(pw || '')).digest('hex');
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
