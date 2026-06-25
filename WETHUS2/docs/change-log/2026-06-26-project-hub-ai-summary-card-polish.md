# 2026-06-26 project hub AI summary card polish

- Refined the `프로젝트 운영 AI 요약` card header in `project-hub.html` so the card title, helper copy, and action button render as separate elements instead of reading like one merged heading.
- Kept the existing `pgAiSummBtn` action and mentor summary flow unchanged while improving scanability on the progress tab.

## Why

- In browser inspection, the previous header structure caused the title and button label to read as one continuous phrase, which made the project-hub progress surface feel less polished.
- The updated layout preserves the same workflow while making the AI summary card easier to understand at a glance.
