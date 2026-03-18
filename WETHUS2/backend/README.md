# WETHUS Google Auth Backend (MVP)

## 1) Install
```bash
cd WETHUS2/backend
npm install
cp .env.example .env
```

## 2) Configure `.env`
- `GOOGLE_CLIENT_ID`: Google Cloud OAuth Web Client ID
- `JWT_SECRET`: long random secret
- `ALLOWED_ORIGINS`: comma-separated origins (local + vercel)
- AI 선택:
  - `AI_PROVIDER=openai` (권장)
  - `OPENAI_API_KEY=...`
  - `OPENAI_MODEL=gpt-4o-mini`
  - (대안) `AI_PROVIDER=gemini` + `GEMINI_API_KEY=...`

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
(Or directly replace constants in script.)

## Notes
- This verifies Google ID tokens on the server (safer than client-only).
- Frontend currently stores app profile state in localStorage (MVP). Later migrate to DB sessions.
