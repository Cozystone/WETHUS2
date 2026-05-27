# Opportunity Data Rationale - 2026-05-27

## Scope

- `WETHUS2/data/opportunity-published.json`
- `WETHUS2/data/opportunity-review-queue.json`

This note documents the latest substantive data change identified during the May 27, 2026 handover audit. The relevant commit is `d342126` (`chore(opportunities): publish latest opportunity queue and verified feed`) from April 20, 2026.

## Recent Diff Summary

- `opportunity-published.json` changed from an empty public feed to 22 opportunity records.
- `opportunity-review-queue.json` expanded to 33 review records.
- The published feed `updatedAt` moved to `2026-04-20T10:08:54+09:00`.
- The review queue `updatedAt` moved to `2026-04-20T10:08:28+09:00`.
- The diff added 1,540 lines and removed 6 lines across the two JSON files.

Current data profile as of this audit:

- Published feed: 22 items, 13 `candidate`, 9 `unknown`.
- Review queue: 33 items, 16 `candidate`, 17 `unknown`.
- Primary sources: K-Startup, Contest Korea, selected university/program pages.
- As of May 27, 2026 KST, most deadlines in both files are already past. Only 2 items are within the next 30 days and 1 item is further in the future in each file.

## Change Reason

The previous published feed was empty, so the public opportunity surface had no useful data to render even though the product goal is curated execution support for youth/startup opportunities. The change seeds the product with a real opportunity corpus and separates a broader review queue from the smaller feed intended for publication.

## Expected Effect

- The opportunities UI can render real cards instead of an empty state once the route is reachable.
- Users get an initial curated list spanning startup support, contests, hackathons, accelerators, and program/event opportunities.
- The review queue preserves lower-confidence or less-normalized records for later moderation instead of discarding them.
- `dedupe_key`, source fields, deadlines, and schedule fields provide enough structure for filtering, sorting, and future admin review.

## Risks

- Freshness risk: many deadlines are stale as of May 27, 2026, so the feed should not be treated as current without a refresh pass.
- Quality risk: several records still use `unknown` status or `확인중` placeholders for organizer, eligibility, benefits, or schedule fields.
- Schema risk: `opportunities.html` normalizes string and array shapes dynamically, so inconsistent source data can still render but may degrade filters.
- Product risk: the live site currently gates `opportunities.html` behind login, so public discovery does not receive the benefit of the seeded feed.
- Source risk: external links may expire or change, especially Contest Korea and K-Startup detail URLs.

## Rollback Criteria

Rollback to the prior empty feed or temporarily remove affected records if any of the following is true:

- A record links to a wrong, unsafe, or unrelated official page.
- A stale deadline is presented as currently actionable without clear status handling.
- Duplicate or malformed records materially break filtering, sorting, or detail modal rendering.
- The data causes a client-side runtime error on `opportunities.html`.

Preferred rollback command if needed:

```bash
git checkout d342126^ -- WETHUS2/data/opportunity-published.json WETHUS2/data/opportunity-review-queue.json
```

## Follow-up Decisions

- Treat `opportunity-published.json` as the user-facing feed and `opportunity-review-queue.json` as an editorial/moderation queue.
- Do not update backup directories such as `WETHUS_backup_project_platform_*` during this work; they remain reference-only.
- Before promoting the feed again, refresh deadlines and convert `unknown`/`확인중` records into either verified records or review-only records.
- Decide whether `opportunities.html` should be public discovery or authenticated-only. The current code calls `WETHUS.requireAuth()`, while the navigation label suggests a public discovery surface.
