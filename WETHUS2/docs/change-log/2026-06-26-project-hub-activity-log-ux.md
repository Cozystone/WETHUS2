## Summary
- Made project hub activity logs easier to read for commercialization-level ops review.
- External webhook and sync events now render as human-readable Korean activity lines instead of raw event keys.
- Timeline rows now use consistent `text · time · source` formatting so server-collected logs and manual hub notes look coherent together.

## Why
- Activity collection was working, but founder/leader-facing logs still surfaced raw event names such as `notion_page_updated`.
- That was too rough for real operator review and made external tool changes feel less trustworthy in the hub UI.

## What changed
- Added provider labels for major integrations such as Google, Notion, Slack, and Figma.
- Added generic external-event humanization for common webhook patterns like page updates, file updates, and comments.
- Added short payload-summary rendering when the event body includes a compact status/action/delta field.
- Updated integration event summaries to include the latest readable event line.
- Standardized recent-activity and progress-log list rows so the source is explicitly shown as `서버 로그` or `허브 메모`.

## Validation
- `node scripts/validate-static.js`
- `node scripts/run-commercial-gate.js`
