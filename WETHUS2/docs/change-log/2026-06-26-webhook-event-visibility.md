## 2026-06-26 Webhook Event Visibility

- Expanded the project-hub webhook modal so operators can see not only the current collection status but also the most recent stored event lines for the selected integration.
- Broke the event summary into:
  - total event count
  - lifecycle event count (`integration_*`)
  - external activity count
- Added a short recent-event list to the modal so leaders can confirm that test events, lifecycle events, and relay-delivered events are actually landing without leaving the hub.

### Why

- The previous UI explained whether webhook collection was configured, but it still required a second mental step to answer the commercialization question: "Are events actually arriving right now?"
- Surfacing the latest ingested rows in the modal makes external-tool logging feel operational rather than theoretical and reduces ambiguity during launch checks.

### Verification

- `node scripts/validate-static.js`
- `node scripts/run-commercial-gate.js`
