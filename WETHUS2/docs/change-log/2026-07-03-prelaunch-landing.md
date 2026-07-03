# Pre-launch reservation landing page

## Change
- Added `prelaunch.html`, a standalone pre-registration landing page (self-contained CSS, same design tokens as the main site: dark base, `#ff6a00` orange, Pretendard, liquid-glass accents).
- Page content mirrors the 2026 Deep-tech Project (모두의 창업) application: one-line pitch, problem quotes, solution features (팀 매칭 / 신뢰 신호 / 프로젝트 허브 + AI / 멘토링·아카이브), 3-step roadmap (팀빌딩 → 실행 지원 → Youth/Bridge/Open 트랙), founder's note (시나브로 / 학생창업유망팀300+).
- Added backend endpoints:
  - `POST /prelaunch/signups` — validates email, dedupes, stores to `data/prelaunch-signups.json` via `writeJsonAtomic`.
  - `GET /prelaunch/signups` — admin-only (requires `requireAdminUser`), returns count + list.
  - Rate limited: `prelaunch` bucket, 10 requests / 10 minutes per client.
- Added `/prelaunch` clean route to `vercel.json`.
- Form JS falls back to a localStorage pending queue when the API is unreachable and auto-resubmits queued signups on the next visit.

## Reason
- Pre-registration is needed ahead of launch to collect early-access emails; the live site has no waitlist feature.

## Expected effect
- `wethus.co.kr/prelaunch` serves the landing page after the next Vercel deploy.
- Signups are collected once the Render backend redeploys with the new endpoint. Until then, browser-side queueing prevents silent loss and informs the user.

## Verification
- `node --check` passes on `backend/server.js`.
- Local boot + curl: new signup, duplicate detection, invalid-email rejection, admin guard on GET all confirmed.
- Browser preview: desktop and 375px mobile render without horizontal overflow, no console errors; API-unreachable fallback path confirmed (info message + localStorage queue).

## Risks
- Production Render drift (known issue) means the endpoint is not live until Render redeploys the current backend.
- Signup data is stored in flat JSON like other collections; migrate with the planned DB work.

## Rollback criteria
- Remove `prelaunch.html` and the `/prelaunch` route; restore `backend/server.js.bak-20260703-prelaunch` and `vercel.json.bak-20260703-prelaunch`.
