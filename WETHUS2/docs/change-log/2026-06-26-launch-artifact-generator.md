# 2026-06-26 - Launch Artifact Generator

- Added `scripts/generate-launch-readiness-artifacts.js` to write all launch-readiness evidence files with explicit UTF-8 encoding.
- Updated both `.github/workflows/launch-readiness.yml` and `.github/workflows/static-checks.yml` to use the generator instead of shell redirection chains.
- This avoids shell-specific encoding drift, especially on Windows PowerShell, while keeping the same evidence bundle shape.

## Verification

- `node scripts/generate-launch-readiness-artifacts.js`
- `GITHUB_STEP_SUMMARY=launch-readiness-step-summary.md node scripts/write-launch-readiness-step-summary.js`
- `REQUIRE_WETHUS_BACKEND_CONTRACTS=true WETHUS_GATE_STRICT_PRODUCTION=true node scripts/run-commercial-gate.js`
