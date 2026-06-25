## 2026-06-26 Project Hub Application Clarity

- Improved the project-hub application panel so leaders and applicants both see clearer next-step context instead of only raw status labels.
- Leaders now see:
  - a short “acceptance joins the team immediately” note in the summary card
  - per-application hints for pending, accepted, rejected, and cancelled states
  - the accepted member role when the applicant has already joined the project team
- Applicants now see:
  - a clearer accepted-state onboarding message
  - a clearer rejected-state message
  - a clearer cancelled-state recovery message
- Team members who are already inside the project no longer see a generic “no permission” block. They now see that they already joined the team and what their current role is.
- Fixed the backend team-member row created during application acceptance so accepted applicants are saved with clean Korean `role` and `bio` values.

### Verification

- `node scripts/smoke-project-applications.js`
- `node scripts/validate-static.js`
