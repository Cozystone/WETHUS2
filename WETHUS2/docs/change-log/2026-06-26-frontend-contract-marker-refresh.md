## 2026-06-26 - Frontend Contract Marker Refresh

- Refreshed the shared frontend contract marker from `2026-06-25-commercial-hardening-v1` to `2026-06-26-commercial-interactions-v1`.
- Updated drift, readiness, rollout, production smoke, and static validation scripts to expect the new marker across the commercialization-critical frontend surfaces.
- Updated launch-readiness artifact smoke so it validates artifact consistency against the current live state instead of assuming production is always `ready`.
- This makes undeployed frontend bundles show up as an explicit commercial-readiness signal instead of silently passing on a stale static marker.

## Verification

- `node scripts/validate-static.js`
- `node scripts/smoke-launch-readiness-artifacts.js`
- `node scripts/run-commercial-gate.js`
