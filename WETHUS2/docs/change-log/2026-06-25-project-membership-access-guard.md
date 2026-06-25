# 2026-06-25 Project Membership Access Guard

## What changed
- Added `PROJECT_ACCESS_REQUIRE_MEMBERSHIP` to the backend health payload and Render service configuration.
- Tightened project-scoped integration, activity, insight, sync, and snapshot routes so they can require project membership when the flag is enabled.
- Expanded project application permissions so founders and leaders can review all applications, while applicants still only see their own submissions.
- Blocked existing project members from re-applying to the same project.
- Extended the backend security smoke to cover the membership guard and founder/leader management boundary.

## Why
- WETHUS is moving from MVP-grade trust assumptions toward production-safe project collaboration.
- Project-scoped APIs should not be readable by unrelated logged-in users once commercialization hardening is enabled.
- Team operation should not depend on a single founder account when leader roles already exist in the product model.

## Validation
- `node --check WETHUS2/backend/server.js`
- `node scripts/smoke-backend-security.js`
- `node scripts/validate-static.js`
