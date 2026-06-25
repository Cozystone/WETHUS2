## 2026-06-26 - Project Mentor Fallback Polish

- Polished the backend `buildProjectMentorFallback()` response so the project hub keeps producing commercialization-grade mentor guidance even when the structured AI call falls back.
- Added prompt sanitization so internal auto-refresh prompts such as `문서 N건과 최근 활동을 반영해...` are no longer exposed to users as visible mentor questions.
- Tightened the fallback summary, priority, action, grounding, and tool-action wording so the hub reads like an operational mentor instead of an internal debug surface.
- Extended `scripts/smoke-project-mentor.js` to assert that fallback responses do not leak the internal auto-refresh prompt into user-facing questions.

## Verification

- `node scripts/smoke-project-mentor.js`
- `node scripts/run-commercial-gate.js`
