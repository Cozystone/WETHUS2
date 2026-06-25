# 2026-06-25 Auth Return And Onboarding Redirect

## What changed
- Login, local auth fallback, Google login, signup, and dev-mode login now use a shared post-auth redirect decision in `WETHUS2/login.html`.
- When a user is not yet onboarded, the original return target is preserved through `profile.html?onboarding=1`.
- Completing onboarding in `WETHUS2/profile.html` now returns the user to the originally requested page instead of always sending them to `index.html`.
- Closing the login screen without prior history now falls back to `index.html`.

## Why
- Commercial-grade flows should return users to the action they were trying to complete.
- Previously, users who were forced through login or first-time onboarding could lose context and land on the homepage even if they started from:
  - a project apply flow
  - a founder flow
  - a protected page deep link

## Verification
- `node scripts/validate-static.js`
- `node scripts/print-commercialization-readiness-summary.js`
