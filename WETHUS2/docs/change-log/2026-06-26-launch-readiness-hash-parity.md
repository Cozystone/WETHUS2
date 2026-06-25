## 2026-06-26 Launch Readiness Hash Parity

- Fixed a commercialization-audit inconsistency where `print-commercialization-readiness-summary.js` could still report `productionLaunchReady=true` even when `print-production-rollout-status.js` had already detected live frontend drift through normalized page-hash mismatch.
- The readiness summary now treats normalized frontend hash mismatch as a blocker, not only snippet drift.
- Updated both launch-readiness scripts so the new project-hub relay download controls are part of the checked front-end commercialization contract.
