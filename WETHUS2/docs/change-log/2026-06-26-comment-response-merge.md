## 2026-06-26 - Comment Response Merge

- Updated `addComment()` so the client immediately merges the backend-returned project after comment creation instead of keeping only the optimistic local comment array.
- This reduces commercialization-grade drift where a freshly added comment could look correct only in the local modal until a later cloud sync or page reload.
- Extended `scripts/smoke-project-interactions.js` so comment creation now also verifies that the backend response includes updated project context.

## Verification

- `node scripts/smoke-project-interactions.js`
- `node scripts/run-commercial-gate.js`
