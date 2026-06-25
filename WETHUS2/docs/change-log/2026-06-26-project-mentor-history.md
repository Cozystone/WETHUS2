## 2026-06-26 Project Mentor History

- Added an in-hub mentor history card so teams can review the latest AI mentor runs without losing prior context after each refresh.
- Each saved run now surfaces:
  - mentor mode
  - trigger type
  - original request prompt when available
  - summary
  - priority
  - execution blocker
- Extended the frontend drift and commercialization audit scripts so this new mentor-history UI is included in release parity checks.
- Added mentor-history actions so a saved run can be re-applied to the current mentor panels or used as the basis for a follow-up mentor request.

### Why

- The hub already persisted mentor runs, but the product behaved as if only the most recent answer existed.
- Showing recent mentor history makes the AI guidance feel like an operational log instead of a disposable chat response, which is a much better fit for commercialization and team execution.

### Verification

- `node scripts/validate-static.js`
- `node scripts/check-live-frontend-drift.js`
- `REQUIRE_WETHUS_BACKEND_CONTRACTS=true WETHUS_GATE_STRICT_PRODUCTION=true node scripts/run-commercial-gate.js`
