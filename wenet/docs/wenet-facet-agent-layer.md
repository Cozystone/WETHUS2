# WENET Facet-Agent Layer

## Positioning
Facet-agent layer is a **support layer** for richer interpretation on top-ranked candidates.
It does NOT replace deterministic matching core.

## Why
Lifestyle signals interact and can produce emergent relationship traits:
- travel + reading + deep talk -> reflective explorer
- calm + stability + long pace -> long-arc friend

## Objects
- Facet
- FacetType
- FacetInteraction
- EmergentTrait

## Pipeline (top-N only)
1. Extract key facets from each profile (8~12)
2. Run pairwise interactions
3. Classify each interaction as resonance/complement/tension
4. Generate 1~3 emergent traits
5. Append to MatchExplanation

## MVP heuristics
- Resonance: similar value/rhythm facet with high weight
- Complement: different but compatible interaction style
- Tension: conflicting pacing/boundary signals

## Guardrails
- No autonomous open-ended multi-agent chat
- No full-population simulation
- Budget cap on top-N and facet count
- Explanations must map to source facets
