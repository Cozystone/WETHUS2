# 2026-06-26 founder idea insights

- Added an `아이디어 인사이트` module to `founder.html` directly below the project description field.
- The founder form now uses `WETHUS.analyzeProjectIdea(...)` while the user types to surface:
  - similar internal projects
  - opportunity points
  - risk reminders
  - immediate next actions
- Added a lightweight manual refresh action so founders can re-run the draft analysis after editing.
- Kept the existing founder submit, draft, preview, and moderation flow unchanged while improving idea-shaping quality before submission.

## Why

- Commercial-quality founder onboarding needs more than validation and moderation; users also need fast guidance on differentiation and execution before they submit.
- This closes part of the gap between profile-side idea generation and the actual founder creation flow.

## Verification

- `node scripts/validate-static.js`
- `node scripts/run-commercial-gate.js`
