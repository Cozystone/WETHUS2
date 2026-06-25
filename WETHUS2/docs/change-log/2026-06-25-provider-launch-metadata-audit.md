# 2026-06-25 Provider Launch Metadata Audit

## What changed
- Strengthened production provider checks in:
  - `scripts/smoke-production.js`
  - `scripts/audit-commercial-readiness.js`
- Provider verification now checks not only readiness status, but also launch-contract metadata:
  - `launchPhase`
  - `launchIncluded`
  - `launchNote`

## Why
- Commercial launch readiness depends on the provider contract being correct, not only on OAuth secrets being present.
- This helps catch live drift where production still returns provider rows but with missing or inconsistent launch/deferred metadata.

## Verification
- `node scripts/smoke-production.js`
- `node scripts/audit-commercial-readiness.js`
