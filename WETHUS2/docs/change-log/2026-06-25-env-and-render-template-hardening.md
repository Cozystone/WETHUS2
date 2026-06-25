# 2026-06-25 Env And Render Template Hardening

## What changed
- Expanded `WETHUS2/backend/.env.example` to include:
  - admin bootstrap settings
  - production hardening flags
  - integration OAuth settings for Google, Notion, Slack, and Figma
  - integration app URL and optional data-dir path
- Expanded `render.yaml` to declare the same commercialization-relevant environment variables for Render.

## Why
- Commercialization readiness depends on repeatable deployment settings, not just code changes.
- Before this change, the environment template lagged behind the actual backend capabilities, which increased rollout risk.

## Validation
- `node scripts/validate-static.js`
- manual review of `render.yaml` against backend `.env.example`
