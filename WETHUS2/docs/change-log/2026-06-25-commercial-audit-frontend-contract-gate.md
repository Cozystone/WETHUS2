# 2026-06-25 Commercial Audit Frontend Contract Gate

## Summary
- Extended `scripts/audit-commercial-readiness.js` so commercialization audits also inspect live frontend contract drift on `project-hub.html`, `profile.html`, and `explore_theme.html`.
- Updated `scripts/run-commercial-gate.js` so `WETHUS_GATE_STRICT_PRODUCTION=true` now forwards `REQUIRE_WETHUS_FRONTEND_HUB_CONTRACTS=true` to both the commercialization audit and strict production smoke.
- Updated rollout and redeploy runbooks so launch-grade verification explicitly includes frontend contract parity, not just backend health/security flags.

## Why
- The previous commercialization gate could fail on backend guard rollout while only warning about live frontend drift.
- That left a gap where production could appear close to launch-ready even when the deployed `project-hub.html` was behind the local hardening work.
- Commercialization readiness should require both:
  - backend session/membership protections
  - live frontend interaction contracts matching the audited local baseline

## Verification
- `node --check scripts/audit-commercial-readiness.js`
- `node scripts/validate-static.js`
- `node scripts/audit-commercial-readiness.js`
- `WETHUS_GATE_STRICT_PRODUCTION=true node scripts/run-commercial-gate.js`
