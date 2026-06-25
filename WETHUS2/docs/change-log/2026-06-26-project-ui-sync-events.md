## 2026-06-26 Project UI Sync Events

- Added a lightweight `wethus:project-ui-sync` browser event so project interaction changes propagate across static surfaces without requiring a full page reload.
- The shared app layer now emits this event after:
  - like toggles
  - bookmark toggles
  - comment creation
  - server-like refresh merges
  - server-bookmark refresh merges
  - remote project merges
- Updated key surfaces to react immediately:
  - `index.html` refreshes featured-card bookmark, social, and applied-button states
  - `explore_theme.html` re-applies filters and refreshes the open modal project state
  - `profile.html` refreshes bookmarked/liked activity lists and the current project panes

### Why

- Before this, interactions were usually persisted correctly but some screens needed a manual refresh or a second navigation before counts and saved-state UI matched the latest action.
- This closes a product-polish gap that is very noticeable in commercialization testing because users expect likes, bookmarks, and comments to feel instant and consistent.

### Verification

- `node scripts/validate-static.js`
- `node scripts/smoke-project-interactions.js`
