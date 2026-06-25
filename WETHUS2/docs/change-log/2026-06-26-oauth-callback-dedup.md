## 2026-06-26 OAuth Callback Dedup

- Removed duplicate Slack and Figma callback branches from `backend/server.js`.
- The earlier branches already handled:
  - token exchange
  - integration row persistence
  - activity event recording
  - popup close response
- Keeping the duplicated unreachable branches increased maintenance risk and made future OAuth fixes easier to miss.
- Verified with:
  - backend syntax check
  - production smoke
  - commercialization gate
