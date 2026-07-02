# WETHUS Project Integrations Setup

This document explains how to enable project-level external workspace integrations.

Related docs:

- `docs/ops/oauth-provider-setup.md`
- `docs/product/project-hub-ui-reference-notes.md`

## Launch Scope

- Google Docs and Google Sheets are ready when Google OAuth credentials are configured.
- Notion, Slack, and Figma are also in launch scope now, but each requires its own OAuth Client ID/Secret before users can connect.
- External change logs are collected through project webhooks or relay setup after a resource is connected.

## Required Environment Variables

```env
INTEGRATION_APP_URL=https://wethus-api.onrender.com

# AI
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o-mini
GEMINI_API_KEY=...

# Launch policy
WETHUS_LAUNCH_PROVIDERS=google_docs,google_sheets,notion,slack,figma,github,discord,google_calendar,airtable
WETHUS_DEFERRED_PROVIDERS=
INTEGRATIONS_ENFORCE_LAUNCH_SCOPE=true

# Google OAuth
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URI=https://wethus-api.onrender.com/oauth/google/callback

# Notion OAuth
NOTION_CLIENT_ID=
NOTION_CLIENT_SECRET=
NOTION_REDIRECT_URI=https://wethus-api.onrender.com/oauth/notion/callback

# Slack OAuth
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_REDIRECT_URI=https://wethus-api.onrender.com/oauth/slack/callback

# Figma OAuth
FIGMA_CLIENT_ID=
FIGMA_CLIENT_SECRET=
FIGMA_REDIRECT_URI=https://wethus-api.onrender.com/oauth/figma/callback

# GitHub OAuth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_REDIRECT_URI=https://wethus-api.onrender.com/oauth/github/callback

# Discord OAuth
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_REDIRECT_URI=https://wethus-api.onrender.com/oauth/discord/callback

# Google Calendar OAuth
GOOGLE_CALENDAR_CLIENT_ID=
GOOGLE_CALENDAR_CLIENT_SECRET=
GOOGLE_CALENDAR_REDIRECT_URI=https://wethus-api.onrender.com/oauth/google_calendar/callback

# Airtable OAuth
AIRTABLE_CLIENT_ID=
AIRTABLE_CLIENT_SECRET=
AIRTABLE_REDIRECT_URI=https://wethus-api.onrender.com/oauth/airtable/callback
```

## OAuth Setup

1. Create an app in the provider developer console.
2. Set the matching redirect URI listed above.
3. Put the Client ID and Client Secret into Render environment variables.
4. Redeploy or restart the backend.
5. Confirm `/integrations/providers` returns `status: "ready"` for the provider.
6. In Project Hub > 연동, click the provider's 연결 button.

## Callback Endpoints

- `GET /oauth/google/callback`
- `GET /oauth/notion/callback`
- `GET /oauth/slack/callback`
- `GET /oauth/figma/callback`
- `GET /oauth/github/callback`
- `GET /oauth/discord/callback`
- `GET /oauth/google_calendar/callback`
- `GET /oauth/airtable/callback`

Production note: replace `_token_demo_only` with encrypted secret manager storage before storing real long-lived tokens.

## API Endpoints

### Integrations

- `GET /integrations?projectId=...`
- `POST /integrations`
- `DELETE /integrations/:id`
- `POST /integrations/:id/webhook-config`

### Webhook Ingest

- `POST /webhooks/:provider/:integrationId`
- Header: `x-webhook-secret: <issued-secret>`
- Body: `{ event_type, item_id, item_name, actor_name, occurred_at, ... }`

### Activity And Snapshot

- `GET /activity-events?projectId=...&limit=50`
- `POST /activity-events`
- `GET /status-snapshot?projectId=...`
- `POST /status-snapshot`

### Identity Map

- `GET /external-identities?userId=...`
- `POST /external-identities`

### OAuth

- `GET /oauth/:provider/start?project_id=...`
- `GET /oauth/:provider/callback`

### Sync

- `GET /sync/notion/health`
- `POST /sync/notion` with `{ project_id, integration_id }`
