# WENET Compatibility Engine v1

## Goal
Deterministic, explainable compatibility scoring for friend/peer relationship tracks.

## Core rules
1. Do not compare raw text directly
2. Compare canonical semantic profiles
3. Apply hard gates first
4. Compute directional score A→B and B→A
5. Compute pair score via harmonic mean
6. Return reason codes for explanation

## Hard gates
- Minor/adult isolation
- Minor age range ±2
- identityVerified && ageVerified required
- trustScore >= minimum

## Scoring components
For each relationship type:
- Structured trait alignment (0~1)
- Value alignment (0~1)
- Environment alignment (0~1)
- Rhythm/conversation alignment (0~1)

Directional score:
`score = w1*trait + w2*value + w3*environment + w4*rhythm`

Pair score:
`pair = 2 * (AtoB * BtoA) / (AtoB + BtoA + epsilon)`

## MVP relation types
- friendScore
- peerScore

## Explanation generation
Reason codes:
- `VALUE_ALIGNMENT_HIGH`
- `RHYTHM_ALIGNMENT_HIGH`
- `ENVIRONMENT_MATCH`
- `PACING_MISMATCH`
- `GATE_AGE_BLOCKED`
- `GATE_VERIFICATION_REQUIRED`

Human-readable explanation is generated from reason code templates.

## Feedback-based adjustment (post-MVP-ready hook)
Store feedback:
- comfort
- naturalness
- relation felt
- reconnect intent

Use aggregated feedback to tune weights per relation type.
