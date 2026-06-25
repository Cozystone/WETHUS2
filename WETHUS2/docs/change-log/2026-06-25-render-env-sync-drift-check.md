# 2026-06-25 Render Env Sync Drift Check

## What changed

- added `scripts/check-render-env-sync.js`
- added shared helper logic in `scripts/lib/render-env-sync.js`
- wired the new check into commercialization status outputs and the commercial gate

## Why

- after the latest deploys, the live backend code and contract matched source, but the saved Render service env values still kept the six launch-grade security flags at `false`
- that is operationally different from source drift, so the tooling should identify it explicitly as an env sync/settings problem

## Validation

- `node scripts/check-render-env-sync.js`
- `node scripts/print-production-rollout-status.js`
- `node scripts/print-commercialization-readiness-summary.js`
