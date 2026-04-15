# WETHUS Student Startup Rebrand — Execution Plan (Reversible)

Date: 2026-04-15 (KST)

## 0) Backup
- ✅ Created clean backup before changes:
  - `WETHUS_backup_project_platform_20260415_092145`

---

## 1) Audit — what fits / what needs work

### A. Fits as-is (keep, reframe copy)
1. **Project Hub / Execution Hub**
   - Already present (`project-hub.html`, hub state in `app.js`).
2. **Mentor layer + AI support layer**
   - Human mentor + AI mentor structure already exists (`mentor.html`, agent logic in backend/app).
3. **Founder gate + operator review concept**
   - Founder submit and admin moderation exist (`founder.html`, `admin.html`, `reviewProject`).
4. **Track foundations**
   - `userTrack`, `projectTrack`, `youthProjectTag` already exist in state.

### B. Rewording only (low risk)
1. Landing / founder / explore copy from broad “project” language to **student startup project platform** language.
2. Category labels to startup umbrella framing (creative venture / civic entrepreneurship / product venture).

### C. Needs structural update (medium risk)
1. **Two-layer review separation**
   - Current: single moderation state.
   - Needed: `founderReview` + `trackReview` separated in model/UI/logic.
2. **Trust signals (4 core)**
   - Must be explicit and consistent in cards/detail/profile/participation flows.
3. **Explore ranking**
   - Current sorting leans latest/popularity.
   - Needed startup-first rules: track-aware, role-need, activity, trust-signal aware.

### D. Should be delayed (for safety)
1. Full DB migration and backend contract hardening (do after frontend model stabilizes).
2. Complex participation UI (specialist/advisor distinctions) — keep architecture-ready first.
3. Exposure percentage tuning / heavy recommendation algorithm.

---

## 2) Target product definition (reframed)

WETHUS = **student startup project platform**
- founder-first, startup-first, execution-first.
- supports startup-like execution across diverse domains.
- solves: discovery + trust + execution.

### Tracks
- User track: `Youth | Open`
- Project track: `Youth | Bridge | Open`
- Transition is **reviewed**, not automatic.

### Review layers
- `founderReview`: should this project exist on WETHUS?
- `trackReview`: is this project ready for Bridge/Open conditions?

### Trust signals (v1 scope lock)
1. role focus
2. portfolio/prior-work evidence
3. recent activity
4. contribution/completion history

---

## 3) Safest implementation order

### Phase 1 (now) — reversible model foundation
1. Add non-breaking fields to project state:
   - `startupCategory`
   - `review.founderReview`
   - `review.trackReview`
   - `trustSignals`
   - `participationModes`
2. Keep old moderation fields for backward compatibility.
3. Reframe founder category options (copy-level + value-compatible).

### Phase 2 — logic update
1. Apply startup-aware explore ranking and filtering defaults.
2. Keep fallback to old sort/filter behavior behind simple conditional.

### Phase 3 — UI surfacing
1. Project cards/detail/profile show 4 trust signals.
2. Admin screen split tabs: Founder Review / Track Review.

### Phase 4 — backend contract alignment
1. Sync frontend model to backend persistence shape.
2. Optional SQL update for `review` and `trust_signals` jsonb fields.

---

## 4) Highest-risk changes
1. Breaking compatibility with existing project data keys.
2. Over-hardcoding startup taxonomy (future rollback pain).
3. Overbuilding AI automation and reducing human review authority.

Mitigation:
- additive schema only,
- keep legacy keys intact,
- keep review human-controlled,
- no destructive migration.

---

## 5) Reversibility strategy
1. One codebase only.
2. Additive fields (no destructive deletes).
3. Keep legacy moderation + old categories operable.
4. New semantics expressed via mapping/config functions.
5. Backup created pre-change.

---

## 6) Immediate implementation status in this commit scope
- Added model foundation in `app.js` (startup category mapping, review/trust defaults, participation modes).
- Updated founder category UX labels in `founder.html` to startup umbrella framing.
- No destructive rewrite, no forked site, no hard removal of legacy behavior.
