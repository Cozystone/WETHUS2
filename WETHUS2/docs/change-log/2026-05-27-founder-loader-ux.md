# Founder Loader UX

Date: 2026-05-27

## Change

- Reduced the `founder.html` entry loader from 2.5 seconds to 650 ms.
- Reduced the post-submit transition wait from 2 seconds to 800 ms.
- Corrected the submit loader copy to say the user is moving to the explore screen.

## Reason

Chrome flow testing showed the project submission path works, but the long entry overlay makes the form feel unavailable and can confuse fast users or automated checks. The page is already the authoring experience, so a long artificial loading delay does not add enough value.

## Expected Effect

- Users can start typing sooner after entering `프로젝트 시작하기`.
- Successful submissions move to analysis/explore faster while still showing clear feedback.
- The loading copy matches the actual redirect target.

## Risk

- Users will see less of the branded loading transition.
- If draft restore ever needs more time, the prompt still runs after the shorter loader.

## Rollback Criteria

- Roll back if the shorter loader causes visible layout flash or draft restore prompts to appear before the form is ready.
