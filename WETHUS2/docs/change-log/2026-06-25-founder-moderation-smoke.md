# 2026-06-25 Founder Moderation Smoke

## What changed
- Added `scripts/smoke-founder-moderation.js` to verify the Founder submission moderation contract end to end against the local backend.
- The smoke covers three commercialization-critical outcomes:
  - hard server-side safety block
  - AI-fallback allow for a clear, safe, detailed submission
  - AI-fallback review for a weak or underspecified submission
- Wired the new smoke into:
  - `scripts/run-commercial-gate.js`
  - `.github/workflows/static-checks.yml`
  - commercialization planning helpers

## Why it matters
- Founder submission is the top-of-funnel path that decides whether a project becomes public, enters review, or gets blocked.
- Before this change, we had browser-path fixes and backend moderation logic, but no automated regression check proving the response contract stayed stable.
- This smoke keeps the commercialization gate honest even when no local LLM is running by forcing the backend into the fallback moderation path.

## Acceptance signal
- `node scripts/smoke-founder-moderation.js` passes.
- `node scripts/run-commercial-gate.js` now fails if the founder moderation contract regresses.
