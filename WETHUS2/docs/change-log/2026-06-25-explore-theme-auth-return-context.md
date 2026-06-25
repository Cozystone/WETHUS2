# 2026-06-25 Explore Theme Auth Return Context

## What changed
- `WETHUS2/explore_theme.html` now matches the improved auth-return behavior already added to the homepage modal.
- When a guest user is redirected to login from the explore-theme project modal comment flow:
  - the selected project modal is reopened on return
  - the comment panel is reopened when requested
  - the pending draft comment text is restored
- Comment submit now exits safely when login redirection is triggered instead of continuing local UI updates.

## Why
- Explore detail should not feel worse than the homepage.
- Commercial-grade auth gates should preserve user intent and in-progress input consistently across major discovery surfaces.

## Verification
- `node scripts/validate-static.js`
- `node --check WETHUS2/explore_theme.html`
