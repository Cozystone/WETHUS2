# 2026-06-25 Login Contract Smoke Tightening

## What changed
- Tightened `scripts/smoke-production.js` so the deployed `login.html` must also expose the shared frontend contract marker.
- Tightened `scripts/validate-static.js` so local `login.html` explicitly requires the same contract marker alongside the auth-return helpers.

## Why
- `login.html` is now a first-class commercialization surface.
- The auth-return helpers were already required, but the shared frontend contract marker should be enforced at the same granularity so deploy drift cannot partially hide on the login page.

## Verification
- `node scripts/validate-static.js`
- `node scripts/smoke-production.js`
