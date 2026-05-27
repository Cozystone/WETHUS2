# Backend Data Directory Isolation

Date: 2026-05-27

## Change

- Added `WETHUS_DATA_DIR` so the backend JSON state directory can be configured per environment.
- Updated the backend security smoke test to create a temporary data directory and pass it to the backend process.
- Documented the data directory behavior and the MVP limitation of file-backed state.

## Reason

The backend smoke test was exercising real local files under `WETHUS2/backend/data`, including ignored JSON state such as `integrations.json`. That made test runs mutate developer state and reduced confidence that a clean worktree meant a clean local backend state.

## Expected Effect

- Security smoke tests no longer pollute local ignored backend data.
- Local development, CI, and future deployment environments can choose separate state locations.
- Production can move toward a persistent disk or database without changing every call site that reads JSON state.

## Risk

- A misconfigured `WETHUS_DATA_DIR` can point the backend at an empty state directory, making users, projects, integrations, or review data appear missing.
- The change does not make JSON files concurrent-safe; it only isolates where they live.
- Production still needs a deliberate persistent storage decision.

## Rollback Criteria

- Roll back if the backend fails to start because the configured data directory cannot be created.
- Roll back if smoke tests fail to clean up temporary directories.
- Roll back if production state disappears after setting `WETHUS_DATA_DIR`; first remove or correct the environment variable before reverting code.
