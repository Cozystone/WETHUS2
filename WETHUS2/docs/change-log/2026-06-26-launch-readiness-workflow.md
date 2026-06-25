# 2026-06-26 - Launch Readiness Workflow

- Added `.github/workflows/launch-readiness.yml` as a dedicated strict commercialization workflow.
- It runs on manual dispatch and on a daily schedule.
- The workflow now:
  - captures `print-commercialization-readiness-summary.js`
  - captures `print-production-rollout-status.js`
  - runs `node scripts/run-commercial-gate.js` with strict launch-grade env flags enabled
  - uploads the summary and rollout outputs as GitHub Actions artifacts
- This closes an ops gap where WETHUS could be locally launch-ready, but there was no dedicated recurring GitHub proof that strict production parity still held over time.

## Verification

- `REQUIRE_WETHUS_BACKEND_CONTRACTS=true WETHUS_GATE_STRICT_PRODUCTION=true node scripts/run-commercial-gate.js`
- `node scripts/print-commercialization-readiness-summary.js`
- `node scripts/print-production-rollout-status.js`
