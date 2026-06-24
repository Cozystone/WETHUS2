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
- `CLOUD_STATE_REQUIRE_SESSION`: set to `true` after production login/session cookies are verified. This blocks `/cloud/state` reads and writes unless the session email matches the requested email.
- `INTEGRATIONS_REQUIRE_ACTOR`: set to `true` after project hub requests are verified to send `x-user-id`. This blocks integration, activity, snapshot, and external identity APIs unless an actor is present.
- `INTEGRATIONS_REQUIRE_SESSION`: set to `true` after `INTEGRATIONS_REQUIRE_ACTOR` and session cookies are verified. This requires the session subject to match `x-user-id`.
- `WETHUS_DATA_DIR`: optional path for JSON state files. Defaults to `backend/data`; tests should use a temporary directory and production should use a persistent disk or database-backed replacement.
- AI provider:
  - `AI_PROVIDER=openai` is recommended.
  - `OPENAI_API_KEY=...`
  - `OPENAI_MODEL=gpt-4o-mini`
  - Local moderation option: `AI_PROVIDER=ollama`, `OLLAMA_BASE_URL=http://127.0.0.1:11434`, `OLLAMA_MODEL=llama3.2:3b`
  - Fallback: `AI_PROVIDER=gemini` with `GEMINI_API_KEY=...`
  - Local WETHUS AI chat also uses the same backend `/ai/chat` route, so when the frontend is opened on `localhost` it can use the Ollama-backed runtime without browser API keys.

## Local LLM quick start
```bash
cd WETHUS2/backend
cp .env.example .env
```

Set:
```env
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2:3b
```

If your local Ollama has a different installed model, replace `OLLAMA_MODEL` with that exact name from:
```bash
ollama list
```

Then run:
```bash
npm start
```

For local frontend testing, open the site from `localhost` or `127.0.0.1`. In that mode, WETHUS AI now prefers the local backend at `:8787` before the hosted API.

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
- Password and Google login responses set an HTTP-only `wethus_session` cookie.
- `/health` exposes non-secret build and security-flag status so production drift can be diagnosed quickly.
- API responses include baseline security headers.
- Auth, AI, webhook, and metadata fetch endpoints use in-memory rate limits.
- `/tools/fetch-meta` rejects localhost/private IP targets and rechecks redirect targets to reduce SSRF risk.
- Frontend currently stores app profile state in `localStorage` for the MVP. `/cloud/state` can be protected with `CLOUD_STATE_REQUIRE_SESSION=true`, but the long-term target is DB-backed sessions and project/review state.
- Backend JSON state is intentionally MVP-grade. Use `WETHUS_DATA_DIR` for isolated test runs or a persistent production disk, and migrate high-value state to a database before scaling usage.
- Project hub integration APIs can be protected with `INTEGRATIONS_REQUIRE_ACTOR=true` and then tightened with `INTEGRATIONS_REQUIRE_SESSION=true`; this is an interim boundary until project membership authorization moves to the database.
- Admin bootstrap only works when no matching admin user exists yet. Set a strong `ADMIN_BOOTSTRAP_PASSWORD`, log in once with `ADMIN_EMAIL`, then rotate or remove the bootstrap password.
- If `/admin.html` shows "권한 없음" and `/auth/login` for `admin@wethus.ai` returns "가입된 계정이 없습니다.", production probably has no admin user and no valid bootstrap password configured.
