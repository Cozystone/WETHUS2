# 2026-06-26 mobile nav wrap polish

- Updated the shared mobile navigation breakpoint in `styles.css` so small screens wrap the top navigation onto multiple rows instead of forcing a horizontally scrollable nav strip.
- Reset the mobile profile-chip and side-menu margins at the same breakpoint so the injected account controls align cleanly inside the wrapped nav rows.

## Why

- Browser inspection showed the mobile navigation still behaving like a hidden horizontal scroller, which is workable but feels rough for a commercialization-ready product.
- Wrapping the nav rows keeps the primary destinations visible without asking users to side-scroll the header on phones.
