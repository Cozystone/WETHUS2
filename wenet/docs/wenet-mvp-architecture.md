# WENET MVP Architecture

## MVP scope
Included:
- Intro/philosophy
- Verification placeholder
- Onboarding + free text profile
- AI/mocked semantic profile generation
- Candidate list with friend/peer scores
- Match detail explanation
- Feedback capture

Excluded for MVP:
- Location resonance
- Heavy multi-agent simulation for all users
- Production backend integration

## 3-layer architecture

### Layer 1: Canonical Matching Core
Input:
- SemanticProfile
- ConnectionIntent
- VerificationProfile

Output:
- MatchHypothesis (friendScore, peerScore, pairScore, reasons)

### Layer 2: Facet-Agent Interpretation (top-N only)
Input:
- Top candidate pairs
- Facets extracted from semantic profile

Output:
- MatchExplanation extension: resonance/complement/tension/emergent traits

### Layer 3: Virtual Connection Experience
- Candidate list
- Explanation detail
- Interest expression
- Mutual unlock + first hello
- Post-interaction feedback

## Data flow (mock-first)
1. User submits onboarding + raw text
2. SemanticProfileBuilder (mock) creates canonical profile
3. CompatibilityEngineV1 ranks candidates
4. FacetAgentEngine enriches top-N
5. UI displays explainable cards
6. Feedback stored to mock repository

## Future Foundry/AIP integration points
- Semantic profile builder API
- Similarity embedding service
- Feedback-driven weight tuning pipeline
- Trust/risk policy decision service
