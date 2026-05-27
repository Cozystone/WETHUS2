# Admin Review Visibility and Local LLM Moderation

Date: 2026-05-27

## Change

- Real admin users now see `admin-mode` manual review notifications.
- Real admin users now get the `프로젝트 검토` quick-menu entry, not only dev mode users.
- Backend AI calls now support `AI_PROVIDER=ollama` with `OLLAMA_BASE_URL` and `OLLAMA_MODEL`.

## Reason

Manual review projects were being created, but the notification recipient was the internal `admin-mode` inbox. A real admin account has its own user id, so manual review notifications could be hidden even when the account had admin authority. The side drawer also hid the review entry unless the app was in dev mode.

The product expectation is that project submissions are checked by a local LLM before publication. The backend previously supported OpenAI/Gemini only, so local LLM moderation could not be configured directly.

## Expected Effect

- Admin accounts can discover pending manual reviews from notifications and quick navigation.
- `founder.html` submissions that become `manual_review` are easier to act on from the admin account.
- Local Ollama-based moderation can be used without exposing browser-side AI keys.

## Risk

- Ollama availability is environment-dependent; if the model is not pulled or the service is not running, moderation falls back only when OpenAI or Gemini credentials are configured.
- Admin visibility still depends on project state being synced to the browser or cloud projection.

## Rollback Criteria

- Roll back if admin notification counts become noisy or include non-review internal notifications unexpectedly.
- Roll back if `AI_PROVIDER=ollama` causes backend startup or moderation regressions in production.
