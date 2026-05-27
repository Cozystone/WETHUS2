# API security hardening

## Change
- Added baseline API security headers to the Express backend.
- Added in-memory rate limits for auth, AI, webhook, and metadata fetch endpoints.
- Hardened `/tools/fetch-meta` against SSRF by rejecting localhost/private IP targets and rechecking redirect targets.
- Added `scripts/smoke-backend-security.js` and wired it into Static checks so the hardening is verified on pushes and pull requests.

## Reason
- The production API handled sensitive login, AI moderation, webhook, and external fetch flows without a basic request abuse boundary.
- `/tools/fetch-meta` accepted arbitrary HTTP(S) URLs, which could be abused to reach internal infrastructure if a private host or redirect target was supplied.

## Expected effect
- Repeated login/AI/tool calls from the same client are throttled with `429`.
- API responses include conservative browser security headers.
- Metadata fetch continues to support public HTTP(S) pages while rejecting local/private destinations.
- CI now fails if the security headers, SSRF guard, or auth rate limit regress.

## Risks
- In-memory rate limits reset on server restart and do not coordinate across multiple instances.
- Some legitimate high-volume use may need higher limits or a shared rate limiter.
- Public URLs that resolve through unusual DNS setups may be rejected if any address is private.

## Rollback criteria
- Roll back if production clients receive unexpected `429` responses under normal use.
- Roll back or tune if a required public metadata URL is falsely rejected.
- Do not remove SSRF protection without replacing it with an equivalent or stronger guard.
