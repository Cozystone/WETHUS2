## 2026-06-26 Founder Validation Focus

- Improved `founder.html` submit validation so missing required fields now move focus back to the exact input that needs attention instead of failing with only a generic blocked submit state.
- Added focused recovery for:
  - missing required text fields
  - custom category input when `기타` is selected
  - invalid start/end date combinations
  - over-capacity member counts
  - minimum-length textarea failures
- Browser-verified that the submit flow now returns focus to the missing `duration` field when every earlier field is filled.
- Re-verified with:
  - `node scripts/validate-static.js`
  - `node scripts/smoke-founder-moderation.js`
