# 2026-06-26 - Project mentor hub integration

- Connected `project-hub.html` to the backend `POST /ai/project-mentor` contract instead of relying only on ad-hoc browser-side prompts.
- Project hub now persists structured AI mentor outputs:
  - summary
  - priority
  - next actions
  - check questions
  - tool actions
  - grounding
  - change log
- Added `scripts/smoke-project-mentor.js` and wired it into both `static-checks.yml` and `scripts/run-commercial-gate.js`.

## Why

- The backend already had a commercialization-grade project mentor contract, but the main hub UI still used a much looser direct chat pattern.
- This left the product with weaker consistency, less persistent reasoning, and no CI coverage for the structured mentor response shape.

## Verification

- `node scripts/smoke-project-mentor.js`
- `node scripts/validate-static.js`
- `node scripts/run-commercial-gate.js`
