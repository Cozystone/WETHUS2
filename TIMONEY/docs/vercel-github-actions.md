# Deploy TIMONEY to Vercel via GitHub Actions

## 1) Add GitHub Secrets
In GitHub repo → Settings → Secrets and variables → Actions, add:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## 2) Get Vercel IDs (one-time, local)
Run in project root after installing Vercel CLI:

```bash
npm i -g vercel
vercel login
vercel link
```

Then copy values from `.vercel/project.json`:
- `orgId` -> `VERCEL_ORG_ID`
- `projectId` -> `VERCEL_PROJECT_ID`

## 3) Push to main
Every push to `main` triggers `.github/workflows/deploy-vercel.yml`.

## Notes
- `vercel.json` includes SPA rewrite to `/index.html` for Flutter web routing.
- Keep Flutter build on GitHub Actions; Vercel only hosts the built output.
