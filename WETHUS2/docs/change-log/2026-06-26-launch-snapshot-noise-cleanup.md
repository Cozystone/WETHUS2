# 2026-06-26 - Launch Snapshot Noise Cleanup

- Extended `scripts/check-deploy-source-readiness.js` so it also ignores generated `launch-readiness-snapshot.md` and `launch-readiness-snapshot.json` files.
- This keeps local launch verification artifacts from appearing as fake source drift after the new snapshot workflow support was added.

## Verification

- `node scripts/check-deploy-source-readiness.js`
- `node scripts/print-launch-readiness-snapshot.js`
- `node scripts/print-launch-readiness-snapshot.js --json`
