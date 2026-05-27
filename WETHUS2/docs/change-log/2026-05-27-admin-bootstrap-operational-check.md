# Admin Bootstrap Operational Check

## Context
- Production API health checks passed on `https://wethus-api.onrender.com`.
- `/admin.html` loads, but a non-admin user sees `권한 없음`.
- A safe probe against `/auth/login` showed `admin@wethus.ai` with the old weak password `0904` is not accepted and no admin account exists for that credential.

## Decision
- Keep rejecting weak bootstrap passwords such as `0904`.
- Use a strong `ADMIN_BOOTSTRAP_PASSWORD` in production for the first admin login.
- After the first successful admin login creates the admin user, rotate or remove `ADMIN_BOOTSTRAP_PASSWORD`.

## Expected Effect
- Manual review projects can appear for a real admin account.
- The legacy shared weak admin password is not reintroduced.
- Operators have a concrete diagnostic path when `/admin.html` shows `권한 없음`.

## Risk
- If production has no strong `ADMIN_BOOTSTRAP_PASSWORD`, admin bootstrap cannot happen and manual review remains inaccessible.
- If `ADMIN_BOOTSTRAP_PASSWORD` is left in production after bootstrap, it remains an unnecessary privileged secret.

## Rollback Criteria
- Roll back only if emergency admin access is impossible and a separate secure account provisioning path is unavailable.
- Do not roll back to `0904`; instead provision a strong temporary password and rotate it after use.

