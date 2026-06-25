# 2026-06-25 Strict Backend Contract Gate

## What changed
- Added `REQUIRE_WETHUS_BACKEND_CONTRACTS` support to `scripts/audit-commercial-readiness.js`.
- In strict launch-grade runs, backend contract drift on:
  - `/health`
  - `/integrations/providers`
  can now fail the commercialization audit instead of only appearing as warnings.
- Wired the strict backend contract requirement into:
  - `scripts/run-commercial-gate.js`
  - `.github/workflows/production-smoke.yml`

## Why
- The live backend drift checks were already good at diagnosis, but strict launch verification should also treat that drift as a release blocker.
- This makes the audit, gate runner, and production workflow agree that Render contract lag is not acceptable for launch-grade verification.

## Verification
- `node scripts/audit-commercial-readiness.js`
- `WETHUS_GATE_STRICT_PRODUCTION=true node scripts/run-commercial-gate.js`
- `node scripts/check-live-backend-contract-drift.js`
