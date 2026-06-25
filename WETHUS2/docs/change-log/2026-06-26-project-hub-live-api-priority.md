# 2026-06-26 - Project hub live API priority

- Updated `project-hub.html` so live environments use the configured Render API base first instead of probing localhost-style `:8787` endpoints before production.
- Added per-candidate request timeouts in `hubApi()` so failed local probes do not leave the hub AI and project-scoped operations visibly stuck in a loading state.

## Why

- On the live site, project hub AI panels could appear to hang because the browser tried unreachable local development endpoints before the real production backend.
- This especially hurt commercialization flows where users expect project status, AI guidance, applications, and integration state to resolve quickly.

## Verification

- `node scripts/validate-static.js`
- `node scripts/run-commercial-gate.js`
- browser review of live `project-hub.html`
