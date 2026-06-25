# 2026-06-25 Strict Rollout Command Alignment

## What changed
- Updated rollout-facing reports so the final strict rerun command now includes `REQUIRE_WETHUS_BACKEND_CONTRACTS=true`.
- Updated `WETHUS2/docs/ops/security-flag-rollout.md` so launch-grade verification explicitly requires:
  - strict backend contract parity
  - strict frontend contract parity across `index.html`, `login.html`, `project-hub.html`, `profile.html`, and `explore_theme.html`

## Why
- The strict gate already understands backend contract parity, but operator-facing guidance should show the exact command and expected surfaces without relying on memory.

## Verification
- `node scripts/print-production-rollout-status.js`
- `node scripts/print-commercialization-readiness-summary.js`
