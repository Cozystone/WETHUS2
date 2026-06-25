## 2026-06-26 - Project Application Live Merge

- Updated the application review API to return the latest project object together with the reviewed application row.
- Sorted application lists by `updatedAt/createdAt` so the freshest review context shows first in project hub review surfaces.
- Added `mergeRemoteProject()` to `app.js` and wired project-hub application review actions to merge the returned project immediately after accept/reject.
- This removes a commercialization-grade lag where support data changed on the backend but the leader-facing hub could briefly keep showing stale team state until a later sync.
- Extended application smoke coverage so accepted application responses must now include project context, and extended static validation so project-hub must keep the immediate merge wiring.

## Verification

- `node scripts/smoke-project-applications.js`
- `node scripts/validate-static.js`
- `node scripts/run-commercial-gate.js`
