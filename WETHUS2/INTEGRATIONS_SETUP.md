# WETHUS Project Integrations Setup (Phase 1)

This document explains how to enable project-level external workspace integrations.

## Implemented in Phase 1

- ProjectIntegration model (JSON-backed)
- ActivityEvent model (JSON-backed)
- ProjectStatusSnapshot model (JSON-backed)
- ExternalIdentityMap model (JSON-backed)
- Integration settings UI in Project Hub (connect/disconnect/sync/last sync)
- OAuth architecture endpoints (Google/Notion/Slack/Figma placeholders)
- **First wired provider:** Notion (OAuth callback + sync endpoint)

## Required Environment Variables (backend/.env)

```env
INTEGRATION_APP_URL=https://www.wethus.co.kr

# OpenAI/Gemini (existing AI path)
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o-mini
GEMINI_API_KEY=...

# Google OAuth placeholders
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URI=https://www.wethus.co.kr/oauth/google/callback

# Notion OAuth (implemented provider)
NOTION_CLIENT_ID=
NOTION_CLIENT_SECRET=
NOTION_REDIRECT_URI=https://www.wethus.co.kr/oauth/notion/callback

# Slack OAuth placeholders
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_REDIRECT_URI=https://www.wethus.co.kr/oauth/slack/callback

# Figma OAuth placeholders
FIGMA_CLIENT_ID=
FIGMA_CLIENT_SECRET=
FIGMA_REDIRECT_URI=https://www.wethus.co.kr/oauth/figma/callback
```

## Notion OAuth Setup

1. Create a Notion integration app in Notion developer settings.
2. Set redirect URI to `NOTION_REDIRECT_URI`.
3. Set `NOTION_CLIENT_ID` / `NOTION_CLIENT_SECRET` in backend env.
4. Restart backend.
5. In Project Hub > 외부 툴 연결 > Notion > 연결, OAuth flow starts.

### Callback Endpoint

- `GET /oauth/notion/callback`
- Exchanges code for token (Phase 1 stores demo token in integration row as `_token_demo_only`)

> Production note: replace `_token_demo_only` with encrypted secret manager storage.

## API Endpoints (Phase 1)

### Integrations
- `GET /integrations?projectId=...`
- `POST /integrations`
- `DELETE /integrations/:id`

### Activity & Snapshot
- `GET /activity-events?projectId=...&limit=50`
- `POST /activity-events`
- `GET /status-snapshot?projectId=...`
- `POST /status-snapshot`

### Identity map
- `GET /external-identities?userId=...`
- `POST /external-identities`

### OAuth
- `GET /oauth/:provider/start?project_id=...`
- `GET /oauth/:provider/callback`

### Sync (implemented provider)
- `POST /sync/notion` with `{ project_id, integration_id }`

## What still requires your manual setup

1. Provider OAuth app credentials (especially Notion in Phase 1)
2. Backend env injection on deployed server
3. Optional: secure token vault integration (replace demo token field)
4. Optional: scheduler/cron for automatic periodic sync

## Next recommended steps

- Add webhook-based sync trigger per provider
- Add per-project sync interval policy
- Add conflict/permission error handling UI in hub
- Expand provider implementations: Google Docs/Sheets first, then Slack/Figma
