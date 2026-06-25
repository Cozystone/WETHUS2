# 2026-06-26 - Launch Bundle Export

- Added `scripts/export-launch-readiness-bundle.js`.
- The exporter generates the current launch-readiness evidence set and writes it into a timestamped `launch-readiness-bundles/` folder with a small `manifest.json`.
- The launch-readiness step summary is written directly into the bundle so the repo root does not gain a stray generated file.
- Added `launch-readiness-bundles/` to `.gitignore` so local export bundles do not pollute the repo state.

## Verification

- `node scripts/export-launch-readiness-bundle.js`
- `git status --short`
