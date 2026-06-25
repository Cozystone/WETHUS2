# 2026-06-25 Deploy Config Parity Check

## What changed
- Added `scripts/check-deploy-config-parity.js`.
- The script verifies that commercialization-relevant environment keys exist in both:
  - `WETHUS2/backend/.env.example`
  - `render.yaml`
- Added the parity check to `scripts/run-commercial-gate.js`.

## Why
- The platform now relies on a broader set of security and OAuth configuration than the original MVP.
- A missing key in either the backend template or Render manifest can silently break production rollout even when the code is correct.

## Validation
- `node scripts/check-deploy-config-parity.js`
- `node scripts/run-commercial-gate.js`
