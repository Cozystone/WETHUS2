# Next Commit Plan

Repository: WETHUS2

Staged change:
- WETHUS2/vercel.json

Recommended commit message:
fix: remove login COOP/COEP headers blocking Google sign-in popup

Why:
- login.html had Cross-Origin-Opener-Policy / Cross-Origin-Embedder-Policy headers configured via vercel.json
- This can block Google GIS popup postMessage flow and break sign-in
- Removing the headers restores standard popup communication behavior
