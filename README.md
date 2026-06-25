# WETHUS2 Handover Notes

This repository contains multiple historical projects and backups. Treat the paths below as the current operating map before editing.

## Active Product Path

- `WETHUS2/` is the active WETHUS static app deployed to `https://www.wethus.co.kr`.
- `WETHUS2/backend/` contains the Node/Express backend source.
- `WETHUS2/data/` contains opportunity feed data.
- `WETHUS2/docs/change-log/` contains decision and audit notes.
- `scripts/validate-static.js` is the local static validation gate.
- `scripts/publish-opportunity-feed.js` rebuilds the public opportunity feed after editorial updates.
- `.github/workflows/static-checks.yml` runs the same validation on GitHub Actions.

## Reference-Only Paths

Do not edit these unless the task explicitly says to recover or compare historical work:

- `WETHUS_backup_project_platform_*`
- `WETHUS_backup_student_startup_rebrand_*`
- `WETHUS2/backups/`
- unrelated sibling projects such as `TIMONEY/`, `wenet/`, and `mirofish-custom/`

Root-level `.bak_*` files must not be left under `WETHUS2/` because that directory is part of the static deploy surface. Move local backup artifacts under `WETHUS2/backups/` or create a git backup branch instead.

## Before Editing

Always create a backup branch before changing files:

```bash
git branch backup/pre-<short-task>-YYYYMMDD-HHMMSS HEAD
```

Then make the smallest scoped change that addresses the issue. Prefer editing active files only; use backup directories for reference.

## Validation

Run this before committing:

```bash
node scripts/validate-static.js
git diff --check
```

The validator currently checks for:

- invalid JSON in active app files
- duplicate or trailing HTML document closing tags
- known leaked script fragments
- `.bak_*` artifacts exposed from the deploy root
- production login dev mode being hidden by default
- expired-opportunity filtering controls on `opportunities.html`

After pushing to `main`, confirm GitHub Actions `Static checks` is green.

If the live frontend on Vercel lags behind the latest `main` commit, redeploy from the repo root with:

```bash
node scripts/deploy-vercel-frontend-production.js
```

This uses the Vercel CLI against the correct repo root, verifies live frontend drift after deploy, and cleans temporary local `.vercel` link artifacts.

## Current Operational Risks

- Google OAuth has not been verified end-to-end with a real account in this audit.
- The app is a static HTML/JS surface with some inline scripts; keep validation tight before deploys.
- Opportunity feed freshness now depends on editorial upkeep. Re-run `node scripts/publish-opportunity-feed.js` after updating opportunity rows so `updatedAt` and expired filtering stay correct.

## Rollback

Prefer `git revert <commit>` for pushed changes. If a local edit needs to be discarded, use the matching `backup/pre-*` branch as the restore point rather than editing backup directories directly.
