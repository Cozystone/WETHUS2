# 2026-06-26 - Launch Artifact CI Smoke

- Added `Launch readiness artifact smoke` to `.github/workflows/static-checks.yml`.
- CI now directly exercises:
  - `print-commercialization-readiness-summary.js --json`
  - `print-production-rollout-status.js --json`
  - `print-launch-readiness-snapshot.js`
  - `print-launch-readiness-snapshot.js --json`
  - `write-launch-readiness-step-summary.js`
- This keeps the launch-readiness evidence toolchain from regressing silently while the main product code continues to pass.

## Verification

- `node scripts/print-launch-readiness-snapshot.js`
- `node scripts/print-launch-readiness-snapshot.js --json`
- `GITHUB_STEP_SUMMARY=launch-readiness-step-summary.md node scripts/write-launch-readiness-step-summary.js`
