# 2026-06-26 project hub tool status chips

## What changed

- Simplified the external-tool cards in `project-hub.html` so launch scope, connection state, webhook/log health, and relay requirement render as compact status chips instead of long stacked sentences.
- Reduced the launch-scope section copy to the concrete live scope:
  - `Google Docs, Google Sheets`
  - `Notion, Slack, Figma`
- Reworked the per-card helper text so operators see one short next-step hint such as:
  - `먼저 리소스를 연결하세요`
  - `Webhook 발급 후 relay 연결`
  - `relay 첫 이벤트 대기중`
  - `relay 재확인 필요`
- Kept the underlying webhook/activity-log contract unchanged while making the commercialization UI easier to scan during operations.

## Why it matters

- Commercial launch reviews depend on fast operator judgement, not long explanatory prose.
- The updated cards make it easier to see:
  - what is in launch scope now
  - which tools are still roadmap-only
  - whether logging is merely configured or actually verified
  - whether an external relay is still the missing step

## Verification

- `node scripts/validate-static.js`
- `node scripts/run-commercial-gate.js`
