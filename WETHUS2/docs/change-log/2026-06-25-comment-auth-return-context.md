# 2026-06-25 Comment Auth Return Context

## What changed
- `WETHUS2/app.js`
  - `goLoginIfGuest()` now accepts extra auth-return context.
  - Guest apply redirects preserve `modalProjectId` when available.
  - Guest comment redirects preserve:
    - `modalProjectId`
    - `reopenCommentPanel`
    - `pendingCommentText`
- `WETHUS2/script.js`
  - Home project modal apply redirect now explicitly preserves `modalProjectId`.
  - Comment submit now safely exits when login redirect is triggered.
  - After auth return, the home modal can reopen the comment panel and restore the pending draft text.

## Why
- Commercial-grade auth gates should minimize lost user effort.
- Previously, a guest user who typed a comment in the project modal and got redirected to login could lose the writing context after returning.

## Verification
- `node scripts/validate-static.js`
- Browser check on local auth return from project modal comment flow
