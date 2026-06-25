# 2026-06-26 source alignment retry

## What changed

- Added `scripts/lib/source-alignment.js` to centralize:
  - `git` command execution for source-alignment checks
  - a small retry window for resolving `origin/main`
- Updated:
  - `scripts/check-deploy-source-readiness.js`
  - `scripts/print-commercialization-readiness-summary.js`
- The source-alignment checks now retry `git ls-remote origin refs/heads/main` a few times before declaring `HEAD != origin/main`.

## Why it matters

- Immediately after `git push`, remote ref visibility can lag just enough to create noisy commercialization warnings even when the push has actually succeeded.
- A short retry window reduces false operator anxiety without weakening the real invariant that deploy-source checks should reflect the pushed source of truth.

## Verification

- `node scripts/run-commercial-gate.js`
- `node scripts/smoke-launch-readiness-artifacts.js`
