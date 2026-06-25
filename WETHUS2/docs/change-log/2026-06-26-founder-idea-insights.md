# 2026-06-26 founder idea insights

- Added an `아이디어 인사이트` module to `founder.html` directly below the project description field.
- The founder form now uses `WETHUS.analyzeProjectIdea(...)` while the user types to surface:
  - similar internal projects
  - opportunity points
  - risk reminders
  - immediate next actions
- Extended the same founder card with backend-powered `AI 멘토 초안 피드백` using the existing `/ai/project-mentor` contract.
- Draft ideas now receive a second layer of execution guidance:
  - summary
  - priority
  - next actions
  - key questions
  - grounding
  - suggested change-log phrasing
- Removed the active function-name collision inside `founder.html` by demoting the older local-only insight helpers to legacy names, so the live founder draft mentor flow now has a single active implementation path.
- Added a lightweight manual refresh action so founders can re-run the draft analysis after editing.
- Kept the existing founder submit, draft, preview, and moderation flow unchanged while improving idea-shaping quality before submission.

## Why

- Commercial-quality founder onboarding needs more than validation and moderation; users also need fast guidance on differentiation and execution before they submit.
- This closes part of the gap between profile-side idea generation and the actual founder creation flow.

## Verification

- `node scripts/validate-static.js`
- `node scripts/smoke-project-mentor.js`
- `node scripts/run-commercial-gate.js`
