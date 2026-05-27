# WETHUS Backend (MVP)

## 1) Install
```bash
cd WETHUS2/backend
npm install
cp .env.example .env
```

## 2) Configure `.env`
- `GOOGLE_CLIENT_ID`: Google Cloud OAuth Web Client ID
- `JWT_SECRET`: long random secret. Production refuses weak or missing values.
- `ALLOWED_ORIGINS`: comma-separated frontend origins.
- `ADMIN_EMAIL`: initial admin email. Default is `admin@wethus.ai`.
- `ADMIN_BOOTSTRAP_PASSWORD`: one-time admin bootstrap password. Must be at least 8 characters and include letters and numbers; weak values such as `0904` are intentionally rejected.
- `RATE_LIMIT_DISABLED`: set to `true` only for local debugging. Keep disabled in production.
- AI provider:
  - `AI_PROVIDER=openai` is recommended.
  - `OPENAI_API_KEY=...`
  - `OPENAI_MODEL=gpt-4o-mini`
  - Fallback: `AI_PROVIDER=gemini` with `GEMINI_API_KEY=...`

## 3) Run
```bash
npm start
```
Server runs at `http://localhost:8787`.

## 4) Frontend setup
In `login.html`, set:
```js
window.WETHUS_GOOGLE_CLIENT_ID = '...';
window.WETHUS_GOOGLE_AUTH_ENDPOINT = 'http://localhost:8787/auth/google';
```

## Security notes
- Google ID tokens are verified on the server.
- API responses include baseline security headers.
- Auth, AI, webhook, and metadata fetch endpoints use in-memory rate limits.
- `/tools/fetch-meta` rejects localhost/private IP targets and rechecks redirect targets to reduce SSRF risk.
- Frontend currently stores app profile state in `localStorage` for the MVP. Later migrate to DB-backed sessions and project/review state.
- Admin bootstrap only works when no matching admin user exists yet. Set a strong `ADMIN_BOOTSTRAP_PASSWORD`, log in once with `ADMIN_EMAIL`, then rotate or remove the bootstrap password.
- If `/admin.html` shows "권한 없음" and `/auth/login` for `admin@wethus.ai` returns "가입된 계정이 없습니다.", production probably has no admin user and no valid bootstrap password configured.
