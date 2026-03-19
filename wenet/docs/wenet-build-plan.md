# WENET Build Plan (Mock-first)

## Week 1 — Foundation
- Create domain models
- Implement CompatibilityEngineV1
- Implement ExplanationGenerator
- Add mock repositories and sample data
- Build onboarding -> profile review flow

## Week 2 — Matching UX
- Candidate list and detail screens
- Relation-type score visualization (friend/peer)
- Interest expression and first hello placeholders
- Feedback screen and storage

## Week 3 — Facet-agent v0
- Facet extraction heuristics
- Facet interaction scoring
- Emergent trait generation
- Integrate into match detail explanation

## Week 4 — Hardening
- Unit tests for gates and scoring
- Basic localization (KO/EN)
- UX refinements for calm elegance
- Prepare backend integration interfaces

## Done criteria for MVP
- End-to-end mock flow works on Android emulator
- Deterministic score + explainable reasons displayed
- Safety gates validated in tests
- Feedback persisted in local mock store
