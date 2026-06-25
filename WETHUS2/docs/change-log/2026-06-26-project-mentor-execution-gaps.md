## 2026-06-26 Project Mentor Execution Gaps

- Extended the project mentor contract so each run now returns:
  - `executionBlocker`
  - `evidenceGaps`
- Updated the fallback mentor path to produce the same fields, so the hub stays operational even when the model call falls back.
- Expanded the project hub UI to surface:
  - a dedicated "지금 막는 점" view
  - a dedicated "근거 부족 / 추가 확인" view
- Updated the mentor smoke test so these new execution-oriented fields are now part of the verified contract.

### Why

- The earlier mentor output was useful for summary and next steps, but it still left a commercialization gap: teams could get advice without a crisp answer to what is blocking execution right now or what evidence is still missing.
- Surfacing those two dimensions makes the mentor feel more like an operator helping the team move, not only a summarizer.

### Verification

- `node scripts/smoke-project-mentor.js`
- `node scripts/validate-static.js`
- `node scripts/run-commercial-gate.js`
