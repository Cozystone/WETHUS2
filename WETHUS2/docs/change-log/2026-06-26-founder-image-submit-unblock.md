# 2026-06-26 - Founder image submit unblock

- Removed the strict founder submit blocker that required a manually selected or AI-generated cover image before form submission.
- Founder submit now allows image-less submissions because the existing submit path already applies a fallback cover image automatically.
- Updated AI image prompt generation to prefer the configured production API base instead of defaulting to localhost on the live site.

## Why

- The live founder flow could get stuck even when all core project fields were complete.
- The validation layer demanded a cover image first, but the submit handler already had a safe fallback image path.
- This contradiction made the production founder funnel less reliable than the underlying submit implementation.

## Verification

- `node scripts/validate-static.js`
- browser repro review of `founder.html`
