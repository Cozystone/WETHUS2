# Integration API actor guard

## Change
- Added `INTEGRATIONS_REQUIRE_ACTOR` to the backend.
- Added `INTEGRATIONS_REQUIRE_SESSION` as a stricter follow-up guard.
- When enabled, project hub integration, activity, status snapshot, and external identity endpoints require an actor from `x-user-id`, `actorId`, or query `actorId`.
- When session guard is enabled, the actor must also match the session subject.
- Integration reads are scoped to integrations owned by the actor when the guard is enabled.
- Integration delete/sync/webhook-config operations reject requests from a different actor.
- Backend security smoke now verifies unauthenticated requests are rejected, cross-actor deletion is forbidden, and mismatched session/actor requests are forbidden.

## Reason
- Several MVP project hub APIs could read or mutate integration-adjacent data without requiring any actor.
- The frontend already sends `x-user-id` from the current WETHUS user, so this creates a deployable guard without redesigning the full authorization model.

## Expected effect
- Default behavior remains compatible until `INTEGRATIONS_REQUIRE_ACTOR=true` is enabled.
- Once enabled, anonymous integration/activity/snapshot requests fail with `401`.
- Cross-actor integration mutation fails with `403`.
- With `INTEGRATIONS_REQUIRE_SESSION=true`, spoofed `x-user-id` values fail unless the session subject matches.

## Risks
- `x-user-id` is still a client-supplied actor hint unless `INTEGRATIONS_REQUIRE_SESSION=true` is enabled.
- Some legacy or manual calls may fail once the flag is enabled if they do not include an actor.
- Full protection still requires DB-backed users, sessions, projects, memberships, and per-project authorization.

## Rollback criteria
- Disable `INTEGRATIONS_REQUIRE_ACTOR` if project hub integration UI cannot load after deploy.
- Keep the smoke coverage and use it while migrating toward real membership authorization.
