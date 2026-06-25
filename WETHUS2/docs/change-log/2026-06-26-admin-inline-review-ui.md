## 2026-06-26 Admin Inline Review UI

- Reworked `admin.html` so project moderation and plan-request review no longer depend on browser `prompt()` dialogs.
- Added inline review note textareas directly inside each review card.
- Operators can now:
  - read queue context
  - write a decision note
  - approve or reject in one place
- Project review cards now also show:
  - created time
  - AI moderation reason when present
- Goal: reduce accidental empty decisions and make manual-review operations safer for commercial use.
