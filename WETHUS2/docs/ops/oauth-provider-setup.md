# OAuth Provider Setup

This is the operator checklist for enabling external tool connections in WETHUS Project Hub.

## Current Launch Providers

| Provider | Current product status | Required Render secrets | Redirect URI |
| --- | --- | --- | --- |
| Google Docs | Ready when Google OAuth is configured | `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` | `https://wethus-api.onrender.com/oauth/google/callback` |
| Google Sheets | Ready when Google OAuth is configured | `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` | `https://wethus-api.onrender.com/oauth/google/callback` |
| Notion | Launch scope, setup required until secrets exist | `NOTION_CLIENT_ID`, `NOTION_CLIENT_SECRET` | `https://wethus-api.onrender.com/oauth/notion/callback` |
| Slack | Launch scope, setup required until secrets exist | `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET` | `https://wethus-api.onrender.com/oauth/slack/callback` |
| Figma | Launch scope, setup required until secrets exist | `FIGMA_CLIENT_ID`, `FIGMA_CLIENT_SECRET` | `https://wethus-api.onrender.com/oauth/figma/callback` |
| GitHub | Launch scope, setup required until secrets exist | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | `https://wethus-api.onrender.com/oauth/github/callback` |
| Discord | Launch scope, setup required until secrets exist | `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` | `https://wethus-api.onrender.com/oauth/discord/callback` |
| Google Calendar | Launch scope, setup required until secrets exist | `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET` | `https://wethus-api.onrender.com/oauth/google_calendar/callback` |
| Airtable | Launch scope, setup required until secrets exist | `AIRTABLE_CLIENT_ID`, `AIRTABLE_CLIENT_SECRET` | `https://wethus-api.onrender.com/oauth/airtable/callback` |

## Provider Notes

### Notion

- Create a public Notion connection in the Notion developer portal.
- Set the OAuth redirect URI to `https://wethus-api.onrender.com/oauth/notion/callback`.
- Use the Client ID and Client Secret from the connection configuration.
- Users must select pages/databases during authorization, so WETHUS should show the connected workspace/page name clearly after callback.
- Useful initial capability: read selected pages/databases and sync project evidence summaries.

### Slack

- Create a Slack app and configure OAuth & Permissions.
- Set the redirect URI to `https://wethus-api.onrender.com/oauth/slack/callback`.
- Start with the narrow bot scopes already implied by the backend flow: `channels:read`, `groups:read`.
- Add event/log collection later with Slack Events API or a webhook relay. Do not request broad message history until the product has a clear user-facing consent copy.
- Useful initial capability: choose a project channel and log channel metadata/lifecycle events.

### Figma

- Create an OAuth app in Figma developer settings.
- Set the redirect URI to `https://wethus-api.onrender.com/oauth/figma/callback`.
- The backend currently requests `file_read`.
- Useful initial capability: connect a design file, read file metadata/version timestamps, and log design-update events through webhook/relay when available.

### GitHub

- Create a GitHub OAuth App.
- Set the callback URL to `https://wethus-api.onrender.com/oauth/github/callback`.
- Current requested scopes: `read:user public_repo`.
- Useful initial capability: connect the founder's GitHub account, then later select repositories and track commits, issues, pull requests, and releases as execution proof.

### Discord

- Create a Discord application.
- Set the redirect URI to `https://wethus-api.onrender.com/oauth/discord/callback`.
- Current requested scopes: `identify guilds webhook.incoming`.
- Useful initial capability: connect the user's Discord account and later attach a server/channel webhook for team activity logs.

### Google Calendar

- Use the existing Google Cloud OAuth project or create a separate OAuth client.
- Set the redirect URI to `https://wethus-api.onrender.com/oauth/google_calendar/callback`.
- Current requested scope: `https://www.googleapis.com/auth/calendar.events.readonly`.
- Useful initial capability: read mentor sessions, team meetings, and milestone deadlines as schedule evidence.

### Airtable

- Create an Airtable OAuth integration.
- Set the redirect URI to `https://wethus-api.onrender.com/oauth/airtable/callback`.
- Current requested scopes: `data.records:read schema.bases:read`.
- Useful initial capability: connect customer discovery, survey, interview, and operations bases as validation evidence.

## Verification

After secrets are added and the backend is redeployed:

```powershell
node scripts/smoke-provider-launch-scope.js
node scripts/run-commercial-gate.js
```

Then check:

```text
GET https://wethus-api.onrender.com/integrations/providers
```

Expected:

- `launchPhase: "launch"` for every launch provider.
- `status: "ready"` for every provider whose OAuth secrets are present.
- Project Hub integration cards show `연결` for ready providers and `설정 필요` only for missing secrets.

## Security Notes

- Never put client secrets in frontend code.
- OAuth access tokens must stay server-side and encrypted at rest with `TOKEN_ENCRYPTION_KEY`.
- Keep scopes narrow and explain each provider's exact data access in the connection modal before requesting authorization.
