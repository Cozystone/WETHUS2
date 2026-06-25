# Opportunity Feed Publish

`WETHUS2/data/opportunity-published.json` is the public feed used by `opportunities.html`.

After manually curating or editing opportunity rows, rebuild the published feed with:

```bash
node scripts/publish-opportunity-feed.js
```

Useful options:

```bash
node scripts/publish-opportunity-feed.js --today 2026-06-26
node scripts/publish-opportunity-feed.js --include-expired
node scripts/publish-opportunity-feed.js --max 12
node scripts/publish-opportunity-feed.js --input WETHUS2/data/opportunity-published.json --output WETHUS2/data/opportunity-published.json
```

What the script does:

- normalizes key fields and dates
- infers `open` / `closed` status from deadline
- removes duplicate rows by `dedupe_key`
- sorts by nearest deadline first
- refreshes `updatedAt`
- drops expired rows by default

Recommended release flow:

```bash
node scripts/publish-opportunity-feed.js
node scripts/validate-static.js
node scripts/run-commercial-gate.js
```

If the live site must reflect the change immediately, redeploy frontend from repo root:

```bash
node scripts/deploy-vercel-frontend-production.js
```
