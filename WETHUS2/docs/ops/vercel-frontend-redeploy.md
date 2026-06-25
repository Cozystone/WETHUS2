# Vercel Frontend Redeploy Runbook

Date: 2026-06-25

## Purpose

Use this runbook when the live WETHUS frontend on `https://www.wethus.co.kr` does not match the current local `WETHUS2/*.html` baseline, even though backend health and other pages look current.

This is especially important when one or more commercialization-critical pages such as `index.html`, `login.html`, `project-hub.html`, `profile.html`, or `explore_theme.html` appear stale.

## Current Evidence Pattern

The common production drift signature is:

- one or more of `index.html`, `login.html`, `project-hub.html`, `profile.html`, or `explore_theme.html` fail the shared frontend contract marker check
- the live site is served by Vercel
- `last-modified` and `etag` values differ by page, which suggests page-level static drift rather than a whole-site outage

## Primary Verification Commands

Run these from the repo root:

```powershell
node scripts\print-post-deploy-verification.js
node scripts\check-live-frontend-drift.js
node scripts\smoke-production.js
node scripts\audit-commercial-readiness.js
```

For launch-grade verification:

```powershell
$env:REQUIRE_WETHUS_FRONTEND_HUB_CONTRACTS='true'
node scripts\smoke-production.js
node scripts\audit-commercial-readiness.js
```

## What To Look For

`scripts/check-live-frontend-drift.js` prints:

- live page URL
- HTTP status
- `server`, `date`, `last-modified`, `etag`, `cache-control`, `age`
- frontend contract marker parity
- normalized SHA-256 of local and live page bodies
- snippet-level parity for commercialization-critical frontend contracts

Interpretation:

- If all hashes match, the live page is serving the expected local baseline.
- If only one page hash differs, treat it as a targeted static deploy drift.
- If `last-modified` is older only for one page, suspect a stale file in the frontend deploy artifact.
- If all pages differ, suspect a broader Vercel deploy mismatch or wrong project/domain binding.

## Redeploy Procedure

1. Confirm the latest GitHub `main` commit contains the intended `WETHUS2/*.html` changes.
2. Confirm the production domain is served by the intended Vercel project.
3. Trigger a Vercel redeploy from the latest `main` commit.
4. If Vercel offers cache invalidation or rebuild options, prefer a fresh rebuild over a metadata-only promote.
5. After deploy, rerun `node scripts/check-live-frontend-drift.js`.
6. Rerun:
   - `node scripts/smoke-production.js`
   - `node scripts/audit-commercial-readiness.js`
   - `node scripts/print-production-rollout-status.js`

## If Only `project-hub.html` Is Stale

Focus on:

- whether the latest local `WETHUS2/project-hub.html` was present in the deployed artifact
- whether the domain is pointing to an older Vercel deployment
- whether a manual copy/paste or partial static upload process bypassed the current repo file

Use the header output from `scripts/check-live-frontend-drift.js` to compare `project-hub.html` against `profile.html` and `explore_theme.html`.

## Launch-Grade Verification

After the Vercel redeploy, run the strict commercialization gate:

```powershell
$env:REQUIRE_WETHUS_API_SECURITY_HEADERS='true'
$env:REQUIRE_WETHUS_API_HEALTH_METADATA='true'
$env:REQUIRE_WETHUS_API_SECURITY_FLAGS='true'
$env:REQUIRE_WETHUS_BACKEND_CONTRACTS='true'
$env:REQUIRE_WETHUS_FRONTEND_HUB_CONTRACTS='true'
$env:WETHUS_GATE_STRICT_PRODUCTION='true'
node scripts\run-commercial-gate.js
```

Treat the frontend as launch-grade only when frontend drift is clean and the strict gate passes end to end.

## Rollback

If the redeploy breaks the live frontend:

1. Roll back to the previous Vercel deployment.
2. Re-run `node scripts/check-live-frontend-drift.js`.
3. Record the failed redeploy and the page-level drift pattern in a new `WETHUS2/docs/change-log/YYYY-MM-DD-*.md` note.
