# 2026-06-26 project hub mobile list overflow

- Fixed horizontal overflow on the mobile `project-hub.html` project list.
- Project cards in the hub list now use dedicated responsive classes so narrow screens stack the thumbnail above the text instead of forcing the card wider than the viewport.
- The summary line now expands into a short multi-line clamp on small screens rather than keeping a single-line nowrap layout.

## Why

- Browser inspection at a 390px mobile viewport showed `project-hub.html` producing a real horizontal scroll area because long project titles and summaries stretched list cards beyond the viewport.
- That made the hub feel broken on phones even though desktop layouts were clean.
