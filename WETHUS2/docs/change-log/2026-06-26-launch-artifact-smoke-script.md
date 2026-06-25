# 2026-06-26 - Launch Artifact Smoke Script

- Added `scripts/smoke-launch-readiness-artifacts.js`.
- The new smoke script verifies the complete launch-readiness evidence toolchain in one place:
  - artifact generation
  - JSON parsing
  - markdown/text headings
  - step summary rendering
- `scripts/run-commercial-gate.js` and `.github/workflows/static-checks.yml` now use this dedicated smoke instead of duplicating the shell command chain.

## Verification

- `node scripts/smoke-launch-readiness-artifacts.js`
- `node scripts/run-commercial-gate.js`
