# 2026-06-26 mobile UI smoke

- Added `scripts/smoke-mobile-commercial-ui.js` to guard the highest-visibility mobile commercialization fixes.
- Wired that smoke into both `scripts/run-commercial-gate.js` and `.github/workflows/static-checks.yml`.

## What it protects

- The shared mobile nav breakpoint must wrap links instead of depending on a horizontal scroll strip.
- The injected profile chip and quick-menu controls must reset their mobile margins.
- `project-hub.html` must keep the responsive project-list card classes and the mobile stacking rules for the project detail header/actions.

## Why

- These mobile regressions were found through browser inspection, and they are subtle enough that ordinary static parsing would not call them out clearly.
- A dedicated smoke makes those commercialization-critical layout contracts explicit and reviewable.
