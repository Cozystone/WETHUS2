import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = Number(process.env.PORT || 8787);
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const JWT_SECRET = process.env.JWT_SECRET || 'change-me';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const PASS_ENABLED = String(process.env.PASS_ENABLED || 'false').toLowerCase() === 'true';
const NICE_SITE_CODE = process.env.NICE_SITE_CODE || '';
const NICE_SITE_PASSWORD = process.env.NICE_SITE_PASSWORD || '';
const PASS_RETURN_URL = process.env.PASS_RETURN_URL || 'http://localhost:8787/pass/success';
const PASS_ERROR_URL = process.env.PASS_ERROR_URL || 'http://localhost:8787/pass/fail';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:8080,http://127.0.0.1:8080').split(',').map(s => s.trim());

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

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

app.post('/ai/career-summary', async (req, res) => {
  try {
    const raw = String(req.body?.raw || '').trim();
    if (!raw) return res.status(400).json({ ok: false, error: 'raw is required' });
    const prompt = `다음 경력사항을 정확히 '-(전) ...' 또는 '-(현) ...' 형식의 불릿으로만 출력해줘. 최대 6줄. 원문 복붙 금지, 핵심만 간결히.\n${raw}`;
    const text = await callGemini(prompt, 2);
    return res.json({ ok: true, summary: text });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || 'career summary failed' });
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

    const user = {
      sub: payload.sub,
      email: payload.email,
      name: payload.name || payload.email,
      picture: payload.picture || ''
    };

    const token = jwt.sign({ sub: user.sub, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('wethus_session', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({ ok: true, user });
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
